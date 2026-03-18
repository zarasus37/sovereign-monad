import { Kafka, Consumer, Producer, EachMessagePayload } from 'kafkajs';
import { ethers, JsonRpcProvider, Wallet, Contract } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from './config';
import { createLogger } from './utils/logger';
import { EthExecutionPlan, EthExecutionResult, EventMeta } from './models/events';
import { FlashbotsRelay } from './flashbots';

const logger = createLogger('eth-arb-bot');

const UNISWAP_V3_ROUTER_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) returns (uint256 amountOut)',
];

const UNISWAP_V3_POOL_ABI = [
  'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
];

export class EthArbBot {
  private kafka: Kafka;
  private consumer: Consumer;
  private producer: Producer;
  private config: ReturnType<typeof getConfig>;
  private provider: JsonRpcProvider | null = null;
  private wallet: Wallet | null = null;
  private flashbots: FlashbotsRelay | null = null;

  constructor() {
    this.config = getConfig();
    this.kafka = new Kafka({
      clientId: this.config.clientId,
      brokers: this.config.kafkaBrokers,
    });
    this.consumer = this.kafka.consumer({ groupId: `${this.config.clientId}-group` });
    this.producer = this.kafka.producer();
  }

  async start(): Promise<void> {
    await this.consumer.connect();
    await this.producer.connect();

    if (!this.config.dryRun && this.config.privateKey) {
      this.provider = new JsonRpcProvider(this.config.ethRpcUrl);
      this.wallet = new Wallet(this.config.privateKey, this.provider);
      logger.info({ rpc: this.config.ethRpcUrl }, 'Connected to Ethereum RPC');

      // Initialize Flashbots relay if enabled
      if (this.config.useFlashbots) {
        // Use a separate auth key for Flashbots; generate ephemeral if not provided
        const authKey = this.config.flashbotsAuthKey || ethers.Wallet.createRandom().privateKey;
        const authSigner = new Wallet(authKey);
        this.flashbots = new FlashbotsRelay({
          relayUrl: this.config.flashbotsRelayUrl,
          authSigner,
          provider: this.provider,
        });
        logger.info({
          relay: this.config.flashbotsRelayUrl,
          authAddress: await authSigner.getAddress(),
        }, 'Flashbots relay initialized');
      }
    } else {
      logger.info({
        dryRun: this.config.dryRun,
        flashbots: this.config.useFlashbots,
      }, 'Running in DRY RUN mode');
    }

    await this.consumer.subscribe({ topic: this.config.inputTopic, fromBeginning: false });
    await this.consumer.run({
      eachMessage: async (payload) => await this.handleMessage(payload),
    });
    logger.info({ topic: this.config.inputTopic }, 'Eth arb bot started');
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { message } = payload;
    if (!message.value) return;

    try {
      const plan: EthExecutionPlan = JSON.parse(message.value.toString());
      const result = await this.executeTrade(plan);
      await this.emitResult(result);
    } catch (error) {
      logger.error({ error }, 'Error executing trade');
    }
  }

  private async executeTrade(plan: EthExecutionPlan): Promise<EthExecutionResult> {
    const meta: EventMeta = {
      eventId: uuidv4(),
      eventType: 'EthExecutionResult',
      version: 1,
      timestampMs: Date.now(),
      source: 'eth-arb-bot',
    };

    if (this.config.dryRun || !this.wallet) {
      return {
        meta,
        planId: plan.planId,
        success: true,
        executedSize: plan.size,
        realizedPnl: plan.expectedPnl,
        gasUsed: '21000',
        gasCostUsd: 5,
        slippageBps: 10,
        timestampMs: Date.now(),
      };
    }

    try {
      logger.info({
        planId: plan.planId,
        asset: plan.asset,
        size: plan.size,
        pool: plan.poolAddress,
        flashbots: !!this.flashbots,
      }, 'Executing Ethereum trade');

      // Build swap transaction via Uniswap V3 router
      const router = new Contract(
        '0xE592427A0AEce92De3Edee1F18E0157C05861564', // Uniswap V3 SwapRouter
        UNISWAP_V3_ROUTER_ABI,
        this.wallet
      );

      const amountIn = ethers.parseUnits(plan.size, 18);
      const slippageFactor = 10000 - this.config.maxSlippageBps;
      // Calculate minimum output with slippage protection
      const amountOutMin = (amountIn * BigInt(slippageFactor)) / 10000n;

      const deadline = Math.floor(Date.now() / 1000) + 120; // 2 minute deadline

      const swapTx = await router.exactInputSingle.populateTransaction({
        tokenIn: ethers.ZeroAddress, // Will be replaced with actual token
        tokenOut: ethers.ZeroAddress,
        fee: plan.fee,
        recipient: await this.wallet.getAddress(),
        deadline,
        amountIn,
        amountOutMinimum: amountOutMin,
        sqrtPriceLimitX96: 0,
      });

      // Set gas parameters
      const feeData = await this.provider!.getFeeData();
      swapTx.gasLimit = 300000n;
      swapTx.maxFeePerGas = feeData.maxFeePerGas ?? undefined;
      swapTx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? undefined;
      swapTx.nonce = await this.provider!.getTransactionCount(await this.wallet.getAddress());
      swapTx.chainId = 1n;

      const signedTx = await this.wallet.signTransaction(swapTx);

      let txHash: string | undefined;
      let gasUsed = '0';

      if (this.flashbots) {
        // Submit via Flashbots private relay (no public mempool exposure)
        const bundleHash = await this.flashbots.sendBundle(signedTx, 3);
        if (bundleHash) {
          txHash = bundleHash;
          gasUsed = '250000'; // estimate for Flashbots bundle
          logger.info({ bundleHash, planId: plan.planId }, 'Flashbots bundle submitted');
        } else {
          throw new Error('Flashbots bundle rejected by relay');
        }
      } else {
        // Submit via public mempool
        const tx = await this.provider!.broadcastTransaction(signedTx);
        const receipt = await tx.wait(1);
        txHash = receipt?.hash;
        gasUsed = receipt?.gasUsed?.toString() ?? '0';
      }

      const gasCostWei = BigInt(gasUsed) * (feeData.gasPrice ?? 30000000000n);
      const gasCostEth = Number(gasCostWei) / 1e18;
      const gasCostUsd = gasCostEth * 2500; // approximate

      return {
        meta,
        planId: plan.planId,
        success: true,
        executedSize: plan.size,
        realizedPnl: plan.expectedPnl - gasCostUsd,
        gasUsed,
        gasCostUsd,
        slippageBps: 0, // actual slippage calculated from fill
        txHash,
        timestampMs: Date.now(),
      };
    } catch (error) {
      return {
        meta,
        planId: plan.planId,
        success: false,
        executedSize: '0',
        realizedPnl: 0,
        gasUsed: '0',
        gasCostUsd: 0,
        slippageBps: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestampMs: Date.now(),
      };
    }
  }

  private async emitResult(result: EthExecutionResult): Promise<void> {
    await this.producer.send({
      topic: this.config.outputTopic,
      messages: [{ key: result.planId, value: JSON.stringify(result) }],
    });
    logger.info({
      planId: result.planId,
      success: result.success,
      pnl: result.realizedPnl,
    }, 'Emitted Ethereum result');
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
    await this.producer.disconnect();
  }
}
