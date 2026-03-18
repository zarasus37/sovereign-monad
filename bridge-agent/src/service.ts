import { Kafka, Consumer, Producer, EachMessagePayload } from 'kafkajs';
import { ethers, JsonRpcProvider, Wallet, Contract, Interface } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { getConfig, CHAIN_IDS, SPOKE_POOL_ADDRESSES } from './config';
import { createLogger } from './utils/logger';
import {
  BridgeTransferRequest,
  BridgeQuote,
  BridgeTransferResult,
  EventMeta,
  getTokenAddress,
  SUPPORTED_TOKENS,
} from './models/events';

const logger = createLogger('bridge-agent');

// Across SpokePool ABI - key functions for deposits
const SPOKE_POOL_ABI = [
  'function deposit(address recipient, address token, uint256 amount, uint256 destinationChainId, uint64 relayerFeePct, uint32 quoteTimestamp) returns (uint256 depositId)',
  'function fillTransfer(bytes memory fillData) returns (uint256)',
  'function speedUpDeposit(address depositor, uint64 newRelayerFeePct, uint32 depositId, bytes memory signature)',
  'function getCurrentTime() view returns (uint32)',
  'event FundsDeposited(address depositor, address recipient, address originToken, uint256 amount, uint256 destinationChainId, uint64 relayerFeePct, uint32 quoteTimestamp, uint32 fillDeadline, uint64 originChainId, uint256 depositId)',
];

// ERC20 ABI for approvals
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
];

export class BridgeAgent {
  private kafka: Kafka;
  private consumer: Consumer;
  private producer: Producer;
  private config: ReturnType<typeof getConfig>;
  private providers: Record<number, JsonRpcProvider> = {};
  private wallets: Record<number, Wallet> = {};
  private spokePools: Record<number, Contract> = {};

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

    // Initialize providers and wallets
    this.providers[CHAIN_IDS.BASE] = new JsonRpcProvider(this.config.baseRpcUrl);
    this.providers[CHAIN_IDS.ARBITRUM] = new JsonRpcProvider(this.config.arbitrumRpcUrl);

    if (!this.config.dryRun && this.config.privateKey) {
      this.wallets[CHAIN_IDS.BASE] = new Wallet(this.config.privateKey, this.providers[CHAIN_IDS.BASE]);
      this.wallets[CHAIN_IDS.ARBITRUM] = new Wallet(this.config.privateKey, this.providers[CHAIN_IDS.ARBITRUM]);
      
      logger.info({ baseRpc: this.config.baseRpcUrl, arbitrumRpc: this.config.arbitrumRpcUrl }, 'Connected to RPCs');
    } else {
      logger.info({ dryRun: this.config.dryRun }, 'Running in DRY RUN mode');
    }

    // Initialize SpokePool contracts
    this.initializeSpokePools();

    // Subscribe to input topic
    await this.consumer.subscribe({ topic: this.config.inputTopic, fromBeginning: false });
    await this.consumer.run({
      eachMessage: async (payload) => await this.handleMessage(payload),
    });
    
    logger.info({ topic: this.config.inputTopic }, 'Bridge agent started');
  }

  private initializeSpokePools(): void {
    for (const [chainId, address] of Object.entries(SPOKE_POOL_ADDRESSES)) {
      const chainIdNum = parseInt(chainId);
      if (this.providers[chainIdNum]) {
        this.spokePools[chainIdNum] = new Contract(
          address,
          SPOKE_POOL_ABI,
          this.providers[chainIdNum]
        );
        logger.info({ chainId: chainIdNum, spokePool: address }, 'Initialized SpokePool');
      }
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { message } = payload;
    if (!message.value) return;

    try {
      const request: BridgeTransferRequest = JSON.parse(message.value.toString());
      
      // Get quote first
      const quote = await this.getQuote(request);
      
      // Emit quote to Kafka
      await this.emitQuote(quote);
      
      // If this is a quote request only (no execution), skip transfer
      if (request.meta.eventType === 'BridgeQuoteRequest') {
        logger.info({ requestId: request.requestId }, 'Quote request - emitted quote, skipping transfer');
        return;
      }

      // Execute the transfer
      const result = await this.executeTransfer(request, quote);
      
      // Emit result
      await this.emitResult(result);
    } catch (error) {
      logger.error({ error }, 'Error processing bridge request');
    }
  }

  async getQuote(request: BridgeTransferRequest): Promise<BridgeQuote> {
    const { sourceChainId, destChainId, token, amount } = request;
    
    const meta: EventMeta = {
      eventId: uuidv4(),
      eventType: 'BridgeQuote',
      version: 1,
      timestampMs: Date.now(),
      source: 'bridge-agent',
    };

    // Validate chain support
    if (!this.isSupportedChain(sourceChainId) || !this.isSupportedChain(destChainId)) {
      throw new Error(`Unsupported chain: ${!this.isSupportedChain(sourceChainId) ? sourceChainId : destChainId}`);
    }

    // Validate token
    const tokenAddress = getTokenAddress(sourceChainId, token);
    if (!tokenAddress) {
      throw new Error(`Unsupported token: ${token} on chain ${sourceChainId}`);
    }

    // Calculate bridge fee (simplified - in production would query the SpokePool or API)
    const amountWei = ethers.parseUnits(amount, 18);
    const bridgeFeePct = this.estimateBridgeFee(sourceChainId, destChainId);
    const bridgeFee = (amountWei * bridgeFeePct) / 10000n;
    const estimatedAmountOut = amountWei - bridgeFee;

    // Estimate time based on destination chain
    const estimatedTimeMinutes = destChainId === CHAIN_IDS.ARBITRUM ? 15 : 20;
    
    // Convert bridge fee to USD (simplified - use token price feed in production)
    const bridgeFeeUsd = Number(bridgeFee) / 1e18 * 2500; // Rough ETH price estimate

    const quoteExpiry = Math.floor(Date.now() / 1000) + 300; // 5 minutes

    return {
      meta,
      requestId: request.requestId,
      sourceChainId,
      destChainId,
      token,
      amount,
      estimatedAmountOut: estimatedAmountOut.toString(),
      bridgeFee: bridgeFee.toString(),
      bridgeFeeUsd,
      estimatedTimeMinutes,
      route: `${this.getChainName(sourceChainId)} → ${this.getChainName(destChainId)}`,
      quoteExpiry,
      spokepool: SPOKE_POOL_ADDRESSES[sourceChainId],
    };
  }

  private estimateBridgeFee(sourceChainId: number, destChainId: number): bigint {
    // Base fee in bps (0.3% = 30 bps)
    let baseFee = 30n;
    
    // Add destination chain fee
    if (destChainId === CHAIN_IDS.ARBITRUM) {
      baseFee += 10n; // Extra for Arbitrum
    } else if (destChainId === CHAIN_IDS.BASE) {
      baseFee += 5n;
    }
    
    return baseFee;
  }

  private isSupportedChain(chainId: number): boolean {
    return chainId in SPOKE_POOL_ADDRESSES;
  }

  private getChainName(chainId: number): string {
    const names: Record<number, string> = {
      [CHAIN_IDS.BASE]: 'Base',
      [CHAIN_IDS.ARBITRUM]: 'Arbitrum',
      [CHAIN_IDS.ETHEREUM]: 'Ethereum',
      [CHAIN_IDS.OPTIMISM]: 'Optimism',
    };
    return names[chainId] || `Chain ${chainId}`;
  }

  async executeTransfer(request: BridgeTransferRequest, quote: BridgeQuote): Promise<BridgeTransferResult> {
    const { sourceChainId, destChainId, token, amount, recipient } = request;
    
    const meta: EventMeta = {
      eventId: uuidv4(),
      eventType: 'BridgeTransferResult',
      version: 1,
      timestampMs: Date.now(),
      source: 'bridge-agent',
    };

    // Dry run mode
    if (this.config.dryRun || !this.wallets[sourceChainId]) {
      return {
        meta,
        requestId: request.requestId,
        success: true,
        sourceChainId,
        destChainId,
        token,
        amount,
        depositId: uuidv4().slice(0, 8),
        txHash: '0x' + '00'.repeat(32),
        realizedPnl: 0,
        timestampMs: Date.now(),
      };
    }

    try {
      const wallet = this.wallets[sourceChainId];
      const spokePool = this.spokePools[sourceChainId].connect(wallet);
      const tokenAddress = getTokenAddress(sourceChainId, token);

      // Handle native ETH vs ERC20
      let tx;
      if (tokenAddress === '0x0000000000000000000000000000000000000000') {
        // Native ETH - send with the deposit call
        const amountWei = ethers.parseUnits(amount, 18);
        
        // Get current time for quote timestamp
        const currentTime = await this.spokePools[sourceChainId].getCurrentTime();
        
        // Estimate relayer fee (simplified)
        const relayerFeePct = BigInt(Math.floor(Math.random() * 500 + 100)); // 1-6%
        
        tx = await spokePool.deposit.populateTransaction(
          recipient,           // recipient
          tokenAddress,        // originToken (use address(0) for ETH)
          amountWei,           // amount
          destChainId,         // destinationChainId
          relayerFeePct,       // relayerFeePct
          currentTime,         // quoteTimestamp
          {
            value: amountWei,  // Send ETH with transaction
          }
        );
      } else {
        // ERC20 token - need to approve first
        const erc20 = new Contract(tokenAddress, ERC20_ABI, wallet);
        const spender = SPOKE_POOL_ADDRESSES[sourceChainId];
        const allowance = await erc20.allowance(await wallet.getAddress(), spender);
        const amountWei = ethers.parseUnits(amount, 18);
        
        if (allowance < amountWei) {
          const approveTx = await erc20.approve.populateTransaction(spender, amountWei);
          const signedApprove = await wallet.signTransaction(approveTx);
          const approveReceipt = await this.providers[sourceChainId].broadcastTransaction(signedApprove);
          await approveReceipt.wait(1);
          logger.info({ token: tokenAddress, spender }, 'Token approved');
        }

        // Get current time for quote timestamp
        const currentTime = await this.spokePools[sourceChainId].getCurrentTime();
        
        // Estimate relayer fee
        const relayerFeePct = BigInt(Math.floor(Math.random() * 500 + 100));
        
        tx = await spokePool.deposit.populateTransaction(
          recipient,
          tokenAddress,
          amountWei,
          destChainId,
          relayerFeePct,
          currentTime
        );
      }

      // Set gas parameters
      const feeData = await this.providers[sourceChainId].getFeeData();
      tx.gasLimit = 500000n;
      tx.maxFeePerGas = feeData.maxFeePerGas ?? undefined;
      tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? undefined;
      tx.nonce = await this.providers[sourceChainId].getTransactionCount(await wallet.getAddress());
      tx.chainId = BigInt(sourceChainId);

      const signedTx = await wallet.signTransaction(tx);
      const receipt = await this.providers[sourceChainId].broadcastTransaction(signedTx);
      const txReceipt = await receipt.wait(1);

      // Extract deposit ID from event
      let depositId: string | undefined;
      if (txReceipt?.logs) {
        // Try to find FundsDeposited event
        const spokePoolInterface = new Interface(SPOKE_POOL_ABI);
        for (const log of txReceipt.logs) {
          try {
            const parsed = spokePoolInterface.parseLog(log);
            if (parsed?.name === 'FundsDeposited') {
              depositId = parsed.args.depositId.toString();
              break;
            }
          } catch {
            // Not a SpokePool event
          }
        }
      }

      // Calculate gas cost
      const gasUsed = txReceipt?.gasUsed?.toString() || '0';
      const gasCostWei = BigInt(gasUsed) * (feeData.gasPrice ?? 30000000000n);
      const gasCostUsd = Number(gasCostWei) / 1e18 * 2500;

      logger.info({
        requestId: request.requestId,
        depositId,
        txHash: receipt.hash,
        gasUsed,
      }, 'Bridge deposit executed');

      return {
        meta,
        requestId: request.requestId,
        success: true,
        sourceChainId,
        destChainId,
        token,
        amount,
        depositId,
        txHash: receipt.hash,
        realizedPnl: -gasCostUsd,
        gasUsed,
        gasCostUsd,
        timestampMs: Date.now(),
      };
    } catch (error) {
      logger.error({ error, requestId: request.requestId }, 'Bridge transfer failed');
      return {
        meta,
        requestId: request.requestId,
        success: false,
        sourceChainId,
        destChainId,
        token,
        amount,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestampMs: Date.now(),
      };
    }
  }

  private async emitQuote(quote: BridgeQuote): Promise<void> {
    await this.producer.send({
      topic: this.config.quotesTopic,
      messages: [{ key: quote.requestId, value: JSON.stringify(quote) }],
    });
    logger.info({
      requestId: quote.requestId,
      fee: quote.bridgeFeeUsd,
      time: quote.estimatedTimeMinutes,
    }, 'Emitted bridge quote');
  }

  private async emitResult(result: BridgeTransferResult): Promise<void> {
    await this.producer.send({
      topic: this.config.outputTopic,
      messages: [{ key: result.requestId, value: JSON.stringify(result) }],
    });
    logger.info({
      requestId: result.requestId,
      success: result.success,
      depositId: result.depositId,
    }, 'Emitted bridge result');
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
    await this.producer.disconnect();
  }
}
