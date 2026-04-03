/**
 * Monad WebSocket RPC client using ethers.js v6.
 * Supports multiple endpoint failover for rate-limit resilience.
 */

import { WebSocketProvider } from 'ethers';
import { createLogger } from '../utils/logger';
import { buildEndpointList, isRateLimitError } from './rpc-utils';

const logger = createLogger('rpc-adapter');

export interface RpcClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getBlockNumber(): Promise<number>;
  onBlock(callback: (blockNumber: number) => void): void;
  removeBlockListener(): void;
  getTransactionCount(address: string): Promise<number>;
  getProvider(): WebSocketProvider | null;
}

export class MonadRpcClient implements RpcClient {
  private provider: WebSocketProvider | null = null;
  private endpoints: string[];
  private currentEndpointIndex = 0;
  private blockCallback: ((blockNumber: number) => void) | null = null;
  private reconnecting = false;
  private reconnectAttempt = 0;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private lastPolledBlock = 0;
  private readonly MAX_RECONNECT_DELAY_MS = 60_000;
  private readonly BASE_DELAY_MS = 1_000;
  private readonly RATE_LIMIT_ROTATE_AFTER = 3;
  private readonly POLL_INTERVAL_MS = 2_000;
  private readonly connectTimeoutMs: number;

  constructor(wsUrl: string, fallbackUrls: string[] = [], connectTimeoutMs: number = 15_000) {
    this.endpoints = buildEndpointList(wsUrl, fallbackUrls);
    this.connectTimeoutMs = connectTimeoutMs;
    logger.info({ endpoints: this.endpoints.length }, 'RPC failover initialized');
  }

  private get currentWsUrl(): string {
    return this.endpoints[this.currentEndpointIndex];
  }

  private rotateEndpoint(): void {
    if (this.endpoints.length <= 1) {
      return;
    }

    const previousIndex = this.currentEndpointIndex;
    this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.endpoints.length;

    logger.info(
      { from: this.endpoints[previousIndex], to: this.currentWsUrl },
      'Rotating to next RPC endpoint'
    );
  }

  private getReconnectDelay(): number {
    const exponent = Math.min(this.reconnectAttempt, 10);
    const base = this.BASE_DELAY_MS * Math.pow(2, exponent);
    const jitter = Math.random() * base * 0.3;
    return Math.min(base + jitter, this.MAX_RECONNECT_DELAY_MS);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async connectWithTimeout(provider: WebSocketProvider): Promise<void> {
    await Promise.race([
      (async () => {
        await provider.getNetwork();
        await provider.getBlockNumber();
      })(),
      this.sleep(this.connectTimeoutMs).then(() => {
        throw new Error(`RPC connect timeout after ${this.connectTimeoutMs}ms`);
      }),
    ]);
  }

  async connect(): Promise<void> {
    let consecutiveFailures = 0;

    while (true) {
      try {
        logger.info(
          {
            wsUrl: this.currentWsUrl,
            attempt: this.reconnectAttempt + 1,
            endpoint: this.currentEndpointIndex + 1,
            totalEndpoints: this.endpoints.length,
          },
          'Connecting to Monad WebSocket'
        );

        this.provider = new WebSocketProvider(this.currentWsUrl);
        await this.connectWithTimeout(this.provider);

        const network = await this.provider.getNetwork();
        const blockNumber = await this.provider.getBlockNumber();

        logger.info({ chainId: network.chainId }, 'Connected to Monad network');
        logger.info({ blockNumber }, 'Current block number');

        this.reconnectAttempt = 0;
        consecutiveFailures = 0;
        this.setupAutoReconnect();
        return;
      } catch (error: any) {
        this.reconnectAttempt++;
        consecutiveFailures++;

        const errorCode = error?.error?.code || error?.code || 'unknown';
        const rateLimited = isRateLimitError(error);

        if (rateLimited || consecutiveFailures >= this.RATE_LIMIT_ROTATE_AFTER) {
          this.rotateEndpoint();
          consecutiveFailures = 0;
        }

        const delay = this.getReconnectDelay();
        logger.warn(
          {
            error: error?.message ?? String(error),
            code: errorCode,
            attempt: this.reconnectAttempt,
            retryInMs: delay,
            rateLimited,
            endpoint: this.currentWsUrl,
          },
          'Failed to connect, retrying with backoff'
        );

        if (this.provider) {
          try {
            await this.provider.destroy();
          } catch {
            // ignore cleanup failure
          }
          this.provider = null;
        }

        await this.sleep(delay);
      }
    }
  }

  private setupAutoReconnect(): void {
    if (!this.provider) {
      return;
    }

    const websocket = (this.provider as any)._websocket || (this.provider as any).websocket;
    if (websocket && typeof websocket.on === 'function') {
      websocket.on('close', async (code?: number) => {
        if (!this.reconnecting) {
          logger.warn({ code }, 'WebSocket closed unexpectedly, reconnecting');
          if (code === 1008 || code === 1013) {
            this.rotateEndpoint();
          }
          await this.reconnectWithCallbacks();
        }
      });

      websocket.on('error', (err: any) => {
        logger.warn({ error: err?.message }, 'WebSocket error');
      });
    }
  }

  private async reconnectWithCallbacks(): Promise<void> {
    if (this.reconnecting) {
      return;
    }

    this.reconnecting = true;

    try {
      if (this.provider) {
        try {
          await this.provider.destroy();
        } catch {
          // ignore cleanup failure
        }
        this.provider = null;
      }

      await this.connect();

      if (this.blockCallback) {
        const callback = this.blockCallback;
        this.onBlock(callback);
        logger.info('Re-subscribed to block events after reconnect');
      }
    } finally {
      this.reconnecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.provider) {
      return;
    }

    logger.info('Disconnecting from Monad WebSocket');
    this.removeBlockListener();
    await this.provider.destroy();
    this.provider = null;
  }

  async getBlockNumber(): Promise<number> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    return this.provider.getBlockNumber();
  }

  onBlock(callback: (blockNumber: number) => void): void {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    this.blockCallback = callback;
    let receivedBlock = false;

    this.provider.on('block', (blockNumber: number) => {
      receivedBlock = true;
      logger.debug({ blockNumber }, 'New block');
      if (this.blockCallback) {
        this.blockCallback(blockNumber);
      }
    });

    setTimeout(() => {
      if (!receivedBlock && this.blockCallback) {
        logger.warn('No blocks received via subscription after 5s, switching to polling');
        this.provider?.removeAllListeners('block');
        this.startBlockPolling();
      }
    }, 5000);

    logger.info('Subscribed to new block events (WebSocket)');
  }

  private startBlockPolling(): void {
    this.stopBlockPolling();

    logger.info({ intervalMs: this.POLL_INTERVAL_MS }, 'Starting block polling');

    this.pollTimer = setInterval(async () => {
      if (!this.provider || !this.blockCallback) {
        return;
      }

      try {
        const blockNumber = await this.provider.getBlockNumber();
        if (blockNumber > this.lastPolledBlock) {
          this.lastPolledBlock = blockNumber;
          logger.debug({ blockNumber }, 'New block (polled)');
          this.blockCallback(blockNumber);
        }
      } catch (error: any) {
        logger.warn({ err: error?.message ?? String(error) }, 'Block poll failed');
      }
    }, this.POLL_INTERVAL_MS);
  }

  private stopBlockPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  removeBlockListener(): void {
    this.stopBlockPolling();
    if (this.provider) {
      this.provider.removeAllListeners('block');
    }
    this.blockCallback = null;
    logger.debug('Removed block listener');
  }

  async getTransactionCount(address: string): Promise<number> {
    if (!this.provider) {
      throw new Error('Provider not connected');
    }

    return this.provider.getTransactionCount(address);
  }

  getProvider(): WebSocketProvider | null {
    return this.provider;
  }
}

export function createRpcClient(
  wsUrl: string,
  fallbackUrls: string[] = [],
  connectTimeoutMs: number = 15_000
): RpcClient {
  return new MonadRpcClient(wsUrl, fallbackUrls, connectTimeoutMs);
}
