import { Kafka, Consumer, Producer, EachMessagePayload } from 'kafkajs';
import {
  Contract,
  JsonRpcProvider,
  TransactionReceipt,
  Wallet,
  formatEther,
  formatUnits,
} from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from './config';
import { createLogger } from './utils/logger';
import { tradeDb } from './utils/database';
import { ExecutionPlan, ExecutionResult, EventMeta } from './models/events';
import { AdapterRegistry } from './adapters';
import { PreparedSwapTransaction } from './adapters/types';
import { ARBITRUM_USDC, BASE_USDC } from './adapters/common';
import {
  ARBITRUM_WETH,
  buildAdapterSwapLegs,
  buildAdapterSwapTransactions,
  buildExecutionPath,
  BASE_WETH,
  getRequiredInventory,
  supportsLiveExecution,
  validateExecutionPlan,
} from './execution';
import { summarizeSettlement } from './settlement';

const logger = createLogger('arb-bot');
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

export class ArbitrageBot {
  private kafka: Kafka;
  private consumer: Consumer;
  private producer: Producer;
  private config: ReturnType<typeof getConfig>;
  private chainAProvider: JsonRpcProvider | null = null;
  private chainBProvider: JsonRpcProvider | null = null;
  private chainAWallet: Wallet | null = null;
  private chainBWallet: Wallet | null = null;
  private readonly adapterRegistry: AdapterRegistry;

  constructor() {
    this.config = getConfig();
    this.kafka = new Kafka({
      clientId: this.config.clientId,
      brokers: this.config.kafkaBrokers,
    });
    this.consumer = this.kafka.consumer({ groupId: `${this.config.clientId}-group` });
    this.producer = this.kafka.producer();
    this.adapterRegistry = new AdapterRegistry({
      aerodromeRouterAddress: this.config.aerodromeRouterAddress,
      aerodromeFactoryAddress: this.config.aerodromeFactoryAddress,
      camelotRouterAddress: this.config.camelotRouterAddress,
      camelotReferrerAddress: this.config.camelotReferrerAddress,
    });
  }

  async start(): Promise<void> {
    // Initialize database
    await tradeDb.init();
    logger.info('Database initialized');

    await this.consumer.connect();
    await this.producer.connect();

    if (!this.config.dryRun && this.config.privateKey) {
      this.chainAProvider = new JsonRpcProvider(this.config.chainARpcUrl);
      this.chainBProvider = new JsonRpcProvider(this.config.chainBRpcUrl);
      this.chainAWallet = new Wallet(this.config.privateKey, this.chainAProvider);
      this.chainBWallet = new Wallet(this.config.privateKey, this.chainBProvider);
      await this.verifyLiveExecutionSetup();
      logger.info(
        {
          chainA: this.config.chainARpcUrl,
          chainB: this.config.chainBRpcUrl,
          enableLiveExecution: this.config.enableLiveExecution,
        },
        'Connected to chain RPCs'
      );
    } else {
      logger.info({ dryRun: true }, 'Running in DRY RUN mode');
    }

    await this.consumer.subscribe({ topic: this.config.inputTopic, fromBeginning: false });
    await this.consumer.run({
      eachMessage: async (payload) => this.handleMessage(payload),
    });
    logger.info({ topic: this.config.inputTopic }, 'Arbitrage bot started');
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { message } = payload;
    if (!message.value) {
      return;
    }

    try {
      const plan: ExecutionPlan = JSON.parse(message.value.toString());
      if (!plan.approved) {
        logger.debug({ planId: plan.planId }, 'Plan not approved, skipping');
        return;
      }

      const result = await this.executeTrade(plan);
      await this.emitResult(result);
    } catch (error: unknown) {
      logger.error({ error }, 'Error executing trade');
    }
  }

  private async executeTrade(plan: ExecutionPlan): Promise<ExecutionResult> {
    const meta: EventMeta = {
      eventId: uuidv4(),
      eventType: 'ExecutionResult',
      version: 1,
      timestampMs: Date.now(),
      source: 'arb-bot',
    };

    const executionPath = buildExecutionPath(
      plan,
      this.config.chainAName,
      this.config.chainBName
    );
    const validation = validateExecutionPlan(
      plan,
      Date.now(),
      this.config.maxPlanAgeMs
    );

    if (!validation.valid) {
      return this.failedResult(meta, plan, executionPath, validation.reason || 'invalid_plan');
    }

    if (this.config.dryRun || !this.chainAWallet || !this.chainBWallet) {
      // Log dry-run trade to database
      const side = plan.direction === 'buy_M_sell_E' ? 'buy' : 'sell';
      tradeDb.logTrade({
        chain: this.config.chainAName,
        pair: `${plan.asset}/USDC`,
        side,
        size_usd: parseFloat(plan.size),
        price: 0, // Not available in dry run
        pnl: 0,
        status: 'dry_run',
        planId: plan.planId,
      });
      
      return {
        meta,
        planId: plan.planId,
        success: true,
        executedSize: plan.size,
        realizedPnl: plan.expectedEv,
        gasUsed: '0',
        slippageBps: Math.min(10, this.config.maxSlippageBps),
        executionPath,
        timestampMs: Date.now(),
      };
    }

    try {
      if (!this.config.enableLiveExecution) {
        return this.failedResult(meta, plan, executionPath, 'live_execution_disabled');
      }

      const liveSupport = supportsLiveExecution(plan);
      if (!liveSupport.valid) {
        return this.failedResult(meta, plan, executionPath, liveSupport.reason || 'unsupported_live_plan');
      }

      const adapterLegs = buildAdapterSwapLegs(
        plan,
        this.adapterRegistry,
        this.config.maxSlippageBps
      );
      if (!adapterLegs.ok) {
        return this.failedResult(
          meta,
          plan,
          executionPath,
          adapterLegs.reason || 'adapter_leg_build_failed'
        );
      }

      const recipient = await this.chainAWallet.getAddress();
      const swapTransactions = buildAdapterSwapTransactions(
        adapterLegs.legs,
        this.adapterRegistry,
        recipient,
        plan.executionDeadlineMs
      );
      if (!swapTransactions.ok) {
        return this.failedResult(
          meta,
          plan,
          executionPath,
          swapTransactions.reason || 'swap_transaction_build_failed'
        );
      }

      const inventoryCheck = await this.checkInventory(plan);
      if (!inventoryCheck.ok) {
        return this.failedResult(meta, plan, executionPath, inventoryCheck.reason);
      }

      const allowanceCheck = await this.ensureAllowances(swapTransactions.transactions);
      if (!allowanceCheck.ok) {
        return this.failedResult(meta, plan, executionPath, allowanceCheck.reason);
      }

      logger.info({
        planId: plan.planId,
        asset: plan.asset,
        size: plan.size,
        mode: plan.mode,
        entryVenue: plan.entryVenue,
        exitVenue: plan.exitVenue,
        direction: plan.direction,
        legs: adapterLegs.legs,
        transactions: swapTransactions.transactions.map((tx) => ({
          chain: tx.chain,
          venue: tx.venue,
          method: tx.method,
          routerAddress: tx.routerAddress,
        })),
      }, 'Validated live trade plan');

      if (!this.config.enableSwapSubmission) {
        return this.failedResult(
          meta,
          plan,
          executionPath,
          'swap_submission_disabled'
        );
      }

      const submission = await this.submitSwapTransactions(swapTransactions.transactions);
      if (!submission.ok) {
        const settlement =
          submission.submitted.length > 0
            ? summarizeSettlement(recipient, submission.submitted, swapTransactions.transactions.length)
            : undefined;
        return this.failedResult(
          meta,
          plan,
          executionPath,
          submission.reason,
          settlement?.realizedPnlUsd ?? 0,
          submission.transactions,
          settlement
        );
      }

      const settlement = summarizeSettlement(
        recipient,
        submission.submitted,
        swapTransactions.transactions.length
      );

      const side = plan.direction === 'buy_M_sell_E' ? 'buy' : 'sell';
      tradeDb.logTrade({
        chain: this.config.chainAName,
        pair: `${plan.asset}/USDC`,
        side,
        size_usd: parseFloat(plan.size),
        price: plan.entryPrice,
        pnl: settlement.realizedPnlUsd,
        status: settlement.status,
        planId: plan.planId,
      });

      return {
        meta,
        planId: plan.planId,
        success: true,
        executedSize: plan.size,
        realizedPnl: settlement.realizedPnlUsd,
        gasUsed: submission.gasUsed,
        slippageBps: Math.min(10, this.config.maxSlippageBps),
        executionPath,
        submittedTransactions: submission.transactions,
        settlement: {
          status: settlement.status,
          realizedPnlUsd: settlement.realizedPnlUsd,
          usdcSpent: settlement.usdcSpent,
          usdcReceived: settlement.usdcReceived,
          completedTransactions: settlement.completedTransactions,
          attemptedTransactions: settlement.attemptedTransactions,
        },
        timestampMs: Date.now(),
      };
    } catch (error: unknown) {
      return this.failedResult(
        meta,
        plan,
        executionPath,
        error instanceof Error ? error.message : 'unknown_error'
      );
    }
  }

  private async verifyLiveExecutionSetup(): Promise<void> {
    if (!this.chainAProvider || !this.chainBProvider || !this.chainAWallet || !this.chainBWallet) {
      throw new Error('live_execution_setup_incomplete');
    }

    const [chainANetwork, chainBNetwork, chainAAddress, chainBAddress] = await Promise.all([
      this.chainAProvider.getNetwork(),
      this.chainBProvider.getNetwork(),
      this.chainAWallet.getAddress(),
      this.chainBWallet.getAddress(),
    ]);

    if (Number(chainANetwork.chainId) !== this.config.expectedChainAId) {
      throw new Error(`unexpected_chain_a_id:${chainANetwork.chainId.toString()}`);
    }

    if (Number(chainBNetwork.chainId) !== this.config.expectedChainBId) {
      throw new Error(`unexpected_chain_b_id:${chainBNetwork.chainId.toString()}`);
    }

    if (chainAAddress.toLowerCase() !== chainBAddress.toLowerCase()) {
      throw new Error('wallet_address_mismatch_between_chains');
    }
  }

  private async checkInventory(
    plan: ExecutionPlan
  ): Promise<{ ok: true } | { ok: false; reason: string }> {
    if (!this.chainAProvider || !this.chainBProvider || !this.chainAWallet || !this.chainBWallet) {
      return { ok: false, reason: 'wallet_not_initialized' };
    }

    const [chainAAddress, chainBAddress] = await Promise.all([
      this.chainAWallet.getAddress(),
      this.chainBWallet.getAddress(),
    ]);

    const [chainAGas, chainBGas] = await Promise.all([
      this.chainAProvider.getBalance(chainAAddress),
      this.chainBProvider.getBalance(chainBAddress),
    ]);

    if (parseFloat(formatEther(chainAGas)) < this.config.minGasBalanceEth) {
      return { ok: false, reason: 'insufficient_chain_a_gas_balance' };
    }

    if (parseFloat(formatEther(chainBGas)) < this.config.minGasBalanceEth) {
      return { ok: false, reason: 'insufficient_chain_b_gas_balance' };
    }

    const requirements = getRequiredInventory(plan);
    for (const requirement of requirements) {
      if (requirement.chain === 'base' && requirement.asset === 'USDC') {
        const balance = await new Contract(BASE_USDC, ERC20_ABI, this.chainAProvider)
          .balanceOf(chainAAddress);
        if (parseFloat(formatUnits(balance, 6)) < requirement.amount) {
          return { ok: false, reason: 'insufficient_base_usdc_inventory' };
        }
      }

      if (requirement.chain === 'arbitrum' && requirement.asset === 'USDC') {
        const balance = await new Contract(ARBITRUM_USDC, ERC20_ABI, this.chainBProvider)
          .balanceOf(chainBAddress);
        if (parseFloat(formatUnits(balance, 6)) < requirement.amount) {
          return { ok: false, reason: 'insufficient_arbitrum_usdc_inventory' };
        }
      }

      if (requirement.chain === 'base' && requirement.asset === 'WETH') {
        const balance = await new Contract(BASE_WETH, ERC20_ABI, this.chainAProvider)
          .balanceOf(chainAAddress);
        if (parseFloat(formatEther(balance)) < requirement.amount) {
          return { ok: false, reason: 'insufficient_base_weth_inventory' };
        }
      }

      if (requirement.chain === 'arbitrum' && requirement.asset === 'WETH') {
        const balance = await new Contract(ARBITRUM_WETH, ERC20_ABI, this.chainBProvider)
          .balanceOf(chainBAddress);
        if (parseFloat(formatEther(balance)) < requirement.amount) {
          return { ok: false, reason: 'insufficient_arbitrum_weth_inventory' };
        }
      }
    }

    return { ok: true };
  }

  private async ensureAllowances(
    transactions: Array<{
      chain: 'base' | 'arbitrum';
      spender: string;
      tokenIn: string;
      amountIn: string;
      venue: string;
    }>
  ): Promise<{ ok: true } | { ok: false; reason: string }> {
    if (!this.chainAWallet || !this.chainBWallet || !this.chainAProvider || !this.chainBProvider) {
      return { ok: false, reason: 'wallet_not_initialized' };
    }

    for (const tx of transactions) {
      const wallet = tx.chain === 'base' ? this.chainAWallet : this.chainBWallet;
      const provider = tx.chain === 'base' ? this.chainAProvider : this.chainBProvider;
      const owner = await wallet.getAddress();
      const token = new Contract(tx.tokenIn, ERC20_ABI, wallet.connect(provider));
      const allowance = await token.allowance(owner, tx.spender);

      if (allowance >= BigInt(tx.amountIn)) {
        continue;
      }

      if (!this.config.enableAutoApprove) {
        return {
          ok: false,
          reason: `insufficient_router_allowance:${tx.chain}:${tx.venue}`,
        };
      }

      const approvalTx = await token.approve(tx.spender, BigInt(tx.amountIn));
      const receipt = await approvalTx.wait();
      if (!receipt || receipt.status !== 1) {
        return {
          ok: false,
          reason: `router_approval_failed:${tx.chain}:${tx.venue}`,
        };
      }
    }

    return { ok: true };
  }

  private async submitSwapTransactions(
    transactions: PreparedSwapTransaction[]
  ): Promise<
    | {
        ok: true;
        gasUsed: string;
        submitted: Array<{
          tx: PreparedSwapTransaction;
          receipt: TransactionReceipt;
        }>;
        transactions: Array<{ chain: string; venue: string; hash: string }>;
      }
    | {
        ok: false;
        reason: string;
        submitted: Array<{
          tx: PreparedSwapTransaction;
          receipt: TransactionReceipt;
        }>;
        transactions: Array<{ chain: string; venue: string; hash: string }>;
      }
  > {
    if (!this.chainAWallet || !this.chainBWallet) {
      return {
        ok: false,
        reason: 'wallet_not_initialized',
        submitted: [],
        transactions: [],
      };
    }

    const submitted: Array<{ chain: string; venue: string; hash: string }> = [];
    const settled: Array<{
      tx: PreparedSwapTransaction;
      receipt: TransactionReceipt;
    }> = [];
    const receipts: TransactionReceipt[] = [];

    for (const tx of transactions) {
      const wallet = tx.chain === 'base' ? this.chainAWallet : this.chainBWallet;
      try {
        const response = await wallet.sendTransaction({
          to: tx.routerAddress,
          data: tx.data,
          value: BigInt(tx.value || '0'),
        });
        const receipt = await response.wait();
        if (!receipt || receipt.status !== 1) {
          return {
            ok: false,
            reason: `swap_submission_failed:${tx.chain}:${tx.venue}`,
            submitted: settled,
            transactions: submitted,
          };
        }

        submitted.push({
          chain: tx.chain,
          venue: tx.venue,
          hash: response.hash,
        });
        settled.push({ tx, receipt });
        receipts.push(receipt);
      } catch (error) {
        return {
          ok: false,
          reason:
            error instanceof Error
              ? `swap_submission_failed:${tx.chain}:${tx.venue}:${error.message}`
              : `swap_submission_failed:${tx.chain}:${tx.venue}`,
          submitted: settled,
          transactions: submitted,
        };
      }
    }

    const gasUsed = receipts.reduce((acc, receipt) => acc + receipt.gasUsed, 0n);
    return {
      ok: true,
      gasUsed: gasUsed.toString(),
      submitted: settled,
      transactions: submitted,
    };
  }

  private failedResult(
    meta: EventMeta,
    plan: ExecutionPlan,
    executionPath: string,
    reason: string,
    realizedPnl: number = 0,
    submittedTransactions?: Array<{ chain: string; venue: string; hash: string }>,
    settlement?: {
      status: 'filled' | 'partial_failure' | 'no_transfers';
      realizedPnlUsd: number;
      usdcSpent: number;
      usdcReceived: number;
      completedTransactions: number;
      attemptedTransactions: number;
    }
  ): ExecutionResult {
    const side = plan.direction === 'buy_M_sell_E' ? 'buy' : 'sell';
    const status = settlement?.status === 'partial_failure' ? 'partial_failure' : 'failed';
    tradeDb.logTrade({
      chain: this.config.chainAName,
      pair: `${plan.asset}/USDC`,
      side,
      size_usd: parseFloat(plan.size),
      price: plan.entryPrice,
      pnl: realizedPnl,
      status,
      planId: plan.planId,
    });

    return {
      meta,
      planId: plan.planId,
      success: false,
      executedSize: '0',
      realizedPnl,
      gasUsed: '0',
      slippageBps: 0,
      executionPath,
      error: reason,
      submittedTransactions,
      settlement,
      timestampMs: Date.now(),
    };
  }

  private async emitResult(result: ExecutionResult): Promise<void> {
    await this.producer.send({
      topic: this.config.outputTopic,
      messages: [{ key: result.planId, value: JSON.stringify(result) }],
    });
    logger.info({ planId: result.planId, success: result.success, pnl: result.realizedPnl }, 'Emitted execution result');
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
    await this.producer.disconnect();
  }
}
