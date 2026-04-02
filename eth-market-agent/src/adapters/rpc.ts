import { WebSocketProvider } from 'ethers';
import { createLogger } from '../utils/logger';

const logger = createLogger('rpc-adapter');

export interface RpcClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getBlockNumber(): Promise<number>;
  getGasPrice(): Promise<number>;
  onBlock(callback: (blockNumber: number) => void): void;
  removeBlockListener(): void;
  getProvider(): WebSocketProvider | null;
}

const BASE_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 60_000;

export class EthereumRpcClient implements RpcClient {
  private provider: WebSocketProvider | null = null;
  private wsUrl: string;
  private blockCallback: ((blockNumber: number) => void) | null = null;
  private reconnectAttempt = 0;

  constructor(wsUrl: string) {
    this.wsUrl = wsUrl;
  }

  private getReconnectDelay(): number {
    const exp = Math.min(BASE_DELAY_MS * 2 ** this.reconnectAttempt, MAX_RECONNECT_DELAY_MS);
    return exp * (0.7 + Math.random() * 0.3); // 30 % jitter
  }

  async connect(): Promise<void> {
    while (true) {
      try {
        logger.info({ wsUrl: this.wsUrl, attempt: this.reconnectAttempt }, 'Connecting to Ethereum WebSocket');
        this.provider = new WebSocketProvider(this.wsUrl);
        const network = await this.provider.getNetwork();
        logger.info({ chainId: network.chainId }, 'Connected to Ethereum network');
        const blockNumber = await this.provider.getBlockNumber();
        logger.info({ blockNumber }, 'Current block number');
        this.reconnectAttempt = 0;
        this.setupAutoReconnect();
        return;
      } catch (err) {
        const delay = this.getReconnectDelay();
        logger.warn({ err, delay, attempt: this.reconnectAttempt }, 'ETH WS connect failed, retrying');
        this.reconnectAttempt++;
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  private setupAutoReconnect(): void {
    if (!this.provider) return;
    const ws = (this.provider as any).websocket ?? (this.provider as any)._websocket;
    if (!ws) return;
    const reconnect = () => {
      logger.warn('ETH WebSocket dropped, reconnecting');
      this.reconnectWithCallbacks();
    };
    ws.addEventListener?.('close', reconnect);
    ws.addEventListener?.('error', reconnect);
  }

  private async reconnectWithCallbacks(): Promise<void> {
    const savedCb = this.blockCallback;
    try { await this.disconnect(); } catch {}
    await this.connect();
    if (savedCb) this.onBlock(savedCb);
  }

  async disconnect(): Promise<void> {
    if (this.provider) {
      this.removeBlockListener();
      await this.provider.destroy();
      this.provider = null;
    }
  }

  async getBlockNumber(): Promise<number> {
    if (!this.provider) throw new Error('Provider not connected');
    return this.provider.getBlockNumber();
  }

  async getGasPrice(): Promise<number> {
    if (!this.provider) throw new Error('Provider not connected');
    const feeData = await this.provider.getFeeData();
    return Number(feeData.gasPrice || 0) / 1e9;
  }

  onBlock(callback: (blockNumber: number) => void): void {
    if (!this.provider) throw new Error('Provider not connected');
    this.blockCallback = callback;
    this.provider.on('block', (blockNumber: number) => {
      if (this.blockCallback) this.blockCallback(blockNumber);
    });
    logger.info('Subscribed to Ethereum block events');
  }

  removeBlockListener(): void {
    if (this.provider) {
      this.provider.removeAllListeners('block');
      this.blockCallback = null;
    }
  }

  getProvider(): WebSocketProvider | null {
    return this.provider;
  }
}

export function createRpcClient(wsUrl: string): RpcClient {
  return new EthereumRpcClient(wsUrl);
}

