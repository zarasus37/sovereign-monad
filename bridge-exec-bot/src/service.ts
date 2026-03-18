import { Kafka, Consumer, Producer, EachMessagePayload } from 'kafkajs';
import { ethers, JsonRpcProvider, Wallet, Contract } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from './config';
import { createLogger } from './utils/logger';
import { BridgeRequest, BridgeResult, EventMeta } from './models/events';

const logger = createLogger('bridge-bot');

// Wormhole NTT ABI
const WORMHOLE_NTT_ABI = [
  'function transfer(uint256 amount, uint16 recipientChain, bytes32 recipient, bytes32 refundAddress, bool shouldQueue, bytes transferInstructions) payable returns (uint64)',
];

// Standard ERC20 ABI for approve + balanceOf
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

export class BridgeExecutorBot {
  private kafka: Kafka;
  private consumer: Consumer;
  private producer: Producer;
  private config: ReturnType<typeof getConfig>;
  private ethProvider: JsonRpcProvider | null = null;
  private monadProvider: JsonRpcProvider | null = null;
  private wallet: Wallet | null = null;
  private bridgeContractVerified: boolean = false;

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
      this.ethProvider = new JsonRpcProvider(this.config.ethRpcUrl);
      this.monadProvider = new JsonRpcProvider(this.config.monadRpcUrl);
      this.wallet = new Wallet(this.config.privateKey, this.ethProvider);

      // Verify bridge contract exists on-chain
      await this.verifyBridgeContract();

      logger.info({ address: this.wallet.address }, 'Connected to RPC providers');
    } else {
      logger.info('Running in DRY RUN mode — bridge calls will be simulated');
    }

    await this.consumer.subscribe({ topic: this.config.inputTopic, fromBeginning: false });
    await this.consumer.run({
      eachMessage: async (payload) => await this.handleMessage(payload),
    });
    logger.info({ topic: this.config.inputTopic }, 'Bridge executor started');
  }

  /**
   * Verify bridge contract is deployed and has code at the configured address
   */
  private async verifyBridgeContract(): Promise<void> {
    if (!this.config.wormholeNttAddress || !this.ethProvider) {
      logger.warn('No WORMHOLE_NTT_ADDRESS configured — bridge transfers will fail');
      return;
    }

    try {
      const code = await this.ethProvider.getCode(this.config.wormholeNttAddress);
      if (code === '0x') {
        logger.error(
          { address: this.config.wormholeNttAddress },
          'Wormhole NTT contract NOT FOUND at configured address'
        );
      } else {
        this.bridgeContractVerified = true;
        logger.info(
          { address: this.config.wormholeNttAddress, codeLength: code.length },
          'Wormhole NTT contract verified'
        );
      }
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Failed to verify bridge contract');
    }
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { message } = payload;
    if (!message.value) return;

    try {
      const request: BridgeRequest = JSON.parse(message.value.toString());
      const result = await this.executeBridge(request);
      await this.emitResult(result);
    } catch (error) {
      logger.error({ error }, 'Error executing bridge');
    }
  }

  private async executeBridge(request: BridgeRequest): Promise<BridgeResult> {
    const startTime = Date.now();
    const meta: EventMeta = {
      eventId: uuidv4(),
      eventType: 'BridgeResult',
      version: 1,
      timestampMs: Date.now(),
      source: 'bridge-exec-bot',
    };

    // Check deadline
    if (Date.now() > request.deadlineMs) {
      return {
        meta,
        requestId: request.requestId,
        success: false,
        error: 'Deadline expired',
        timestampMs: Date.now(),
      };
    }

    // Dry run mode
    if (this.config.dryRun || !this.wallet) {
      logger.info({
        requestId: request.requestId,
        asset: request.asset,
        amount: request.amount,
        from: request.fromChain,
        to: request.toChain,
        mode: 'DRY_RUN',
      }, 'Simulated bridge transfer');
      return {
        meta,
        requestId: request.requestId,
        success: true,
        txHash: '0x' + '0'.repeat(64),
        bridgeLatencyMs: 100,
        timestampMs: Date.now(),
      };
    }

    // Live mode — verify prerequisites
    if (!this.bridgeContractVerified) {
      return {
        meta,
        requestId: request.requestId,
        success: false,
        error: 'Bridge contract not verified — check WORMHOLE_NTT_ADDRESS',
        timestampMs: Date.now(),
      };
    }

    try {
      const provider = request.fromChain === 'ETHEREUM' ? this.ethProvider : this.monadProvider;
      if (!provider) throw new Error(`Provider not initialized for ${request.fromChain}`);

      const signer = this.wallet.connect(provider);

      logger.info({
        requestId: request.requestId,
        asset: request.asset,
        amount: request.amount,
        from: request.fromChain,
        to: request.toChain,
      }, 'Executing bridge transfer');

      // Step 1: Approve token spend if needed
      // (For native token transfers, this step is skipped)
      // In a real implementation, "request.asset" would map to a token address

      // Step 2: Call Wormhole NTT transfer
      const nttContract = new Contract(this.config.wormholeNttAddress, WORMHOLE_NTT_ABI, signer);
      const recipientBytes32 = ethers.zeroPadValue(request.recipient, 32);
      const refundBytes32 = ethers.zeroPadValue(await signer.getAddress(), 32);

      const tx = await nttContract.transfer(
        ethers.parseUnits(request.amount, 18),
        this.config.wormholeChainIdMonad,
        recipientBytes32,
        refundBytes32,
        false, // shouldQueue
        '0x', // no extra instructions
      );

      logger.info({ txHash: tx.hash }, 'Bridge tx submitted, waiting for confirmation');

      // Step 3: Wait for confirmation with timeout
      const receipt = await Promise.race([
        tx.wait(1),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Bridge confirmation timeout')), this.config.timeoutMs)
        ),
      ]);

      if (!receipt) throw new Error('Receipt is null');

      return {
        meta,
        requestId: request.requestId,
        success: true,
        txHash: receipt.hash,
        bridgeLatencyMs: Date.now() - startTime,
        timestampMs: Date.now(),
      };
    } catch (error) {
      logger.error({ error: (error as Error).message, requestId: request.requestId }, 'Bridge failed');
      return {
        meta,
        requestId: request.requestId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestampMs: Date.now(),
      };
    }
  }

  private async emitResult(result: BridgeResult): Promise<void> {
    await this.producer.send({
      topic: this.config.outputTopic,
      messages: [{ key: result.requestId, value: JSON.stringify(result) }],
    });
    logger.info({
      requestId: result.requestId,
      success: result.success,
      latency: result.bridgeLatencyMs,
    }, 'Emitted bridge result');
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
    await this.producer.disconnect();
  }
}
