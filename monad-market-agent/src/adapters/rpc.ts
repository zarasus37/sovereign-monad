/**
 * Monad WebSocket RPC client using ethers.js v6
 * Supports multiple endpoint failover for rate-limit resilience
 */

import { WebSocketProvider } from 'ethers';
import { createLogger } from '../utils/logger';

const logger = createLogger('rpc-adapter');

/**
 * Monad testnet public/free RPC endpoints for failover.
 * When the primary (configured) endpoint hits rate limits,
 * the client rotates through these alternatives.
 */
const MONAD_TESTNET_WS_FALLBACKS = [
  'wss://monad-testnet.drpc.org',
  'wss://ws.testnet.monad.xyz',
];

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
  private currentEndpointIndex: number = 0;
  private blockCallback: ((blockNumber: number) => void) | null = null;
  private reconnecting: boolean = false;
  private reconnectAttempt: number = 0;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private lastPolledBlock: number = 0;
  private readonly MAX_RECONNECT_DELAY_MS = 60_000;
  private readonly BASE_DELAY_MS = 1_000;
  private readonly RATE_LIMIT_ROTATE_AFTER = 3; // rotate endpoint after N consecutive failures
  private readonly POLL_INTERVAL_MS = 2_000; // block polling interval when subscriptions unavailable

  constructor(wsUrl: string) {
    // Build endpoint list: primary first, then fallbacks (deduplicated)
    const seen = new Set<string>();
    this.endpoints = [];
    for (const url of [wsUrl, ...MONAD_TESTNET_WS_FALLBACKS]) {
      const normalized = url.replace(/\/+$/, '');
      if (!seen.has(normalized)) {
        seen.add(normalized);
        this.endpoints.push(normalized);
      }
    }
    logger.info({ endpoints: this.endpoints.length }, 'RPC failover initialized');
  }

  private get currentWsUrl(): string {
    return this.endpoints[this.currentEndpointIndex];
  }

  private rotateEndpoint(): void {
    const prev = this.currentEndpointIndex;
    this.currentEndpointIndex = (this.currentEndpointIndex + 1) % this.endpoints.length;
    logger.info(
      { from: this.endpoints[prev], to: this.currentWsUrl },
      'Rotating to next RPC endpoint'
    );
  }

  /**
   * Exponential backoff with jitter for reconnection
   */
  private getReconnectDelay(): number {
    const exp = Math.min(this.reconnectAttempt, 10);
    const base = this.BASE_DELAY_MS * Math.pow(2, exp);
    const jitter = Math.random() * base * 0.3;
    return Math.min(base + jitter, this.MAX_RECONNECT_DELAY_MS);
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async connect(): Promise<void> {
    let consecutiveFailures = 0;

    while (true) {
      try {
        logger.info(
          { wsUrl: this.currentWsUrl, attempt: this.reconnectAttempt + 1, endpoint: this.currentEndpointIndex + 1, totalEndpoints: this.endpoints.length },
          'Connecting to Monad WebSocket'
        );
        this.provider = new WebSocketProvider(this.currentWsUrl);

        // Test connection
        const network = await this.provider.getNetwork();
        logger.info(
          { chainId: network.chainId },
          'Connected to Monad network'
        );

        // Get initial block number
        const blockNumber = await this.provider.getBlockNumber();
        logger.info({ blockNumber }, 'Current block number');

        // Reset counters on success
        this.reconnectAttempt = 0;
        consecutiveFailures = 0;

        // Set up auto-reconnect on WebSocket close/error
        this.setupAutoReconnect();
        return;
      } catch (error: any) {
        this.reconnectAttempt++;
        consecutiveFailures++;

        const errorCode = error?.error?.code || error?.code || 'unknown';
        const isRateLimit = errorCode === -32003 || String(error?.message).includes('rate limit') || String(error?.message).includes('daily request limit');

        // Rotate endpoint on rate limit or after N consecutive failures
        if (isRateLimit || consecutiveFailures >= this.RATE_LIMIT_ROTATE_AFTER) {
          this.rotateEndpoint();
          consecutiveFailures = 0;
        }

        const delay = this.getReconnectDelay();
        logger.warn(
          { error: error.message, code: errorCode, attempt: this.reconnectAttempt, retryInMs: delay, isRateLimit, endpoint: this.currentWsUrl },
          'Failed to connect, retrying with backoff'
        );

        // Clean up failed provider
        if (this.provider) {
          try { await this.provider.destroy(); } catch { /* ignore */ }
          this.provider = null;
        }

        await this.sleep(delay);
      }
    }
  }

  /**
   * Auto-reconnect when WebSocket drops
   */
  private setupAutoReconnect(): void {
    if (!this.provider) return;

    const ws = (this.provider as any)._websocket || (this.provider as any).websocket;
    if (ws && typeof ws.on === 'function') {
      ws.on('close', async () => {
        if (!this.reconnecting) {
          logger.warn('WebSocket closed unexpectedly, reconnecting');
          await this.reconnectWithCallbacks();
        }
      });
      ws.on('error', (err: any) => {
        logger.warn({ error: err?.message }, 'WebSocket error');
      });
    }
  }

  /**
   * Reconnect and re-subscribe to block events
   */
  private async reconnectWithCallbacks(): Promise<void> {
    if (this.reconnecting) return;
    this.reconnecting = true;

    try {
      // Clean up old provider
      if (this.provider) {
        try { await this.provider.destroy(); } catch { /* ignore */ }
        this.provider = null;
      }

      await this.connect();

      // Re-subscribe to blocks if we had a callback
      if (this.blockCallback) {
        const cb = this.blockCallback;
        this.onBlock(cb);
        logger.info('Re-subscribed to block events after reconnect');
      }
    } finally {
      this.reconnecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.provider) {
      logger.info('Disconnecting from Monad WebSocket');
      this.removeBlockListener();
      await this.provider.destroy();
      this.provider = null;
    }
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

    // Try WebSocket subscription first
    this.provider.on('block', (blockNumber: number) => {
      receivedBlock = true;
      logger.debug({ blockNumber }, 'New block');
      if (this.blockCallback) {
        this.blockCallback(blockNumber);
      }
    });

    // If no block arrives within 5 seconds, subscription likely failed — switch to polling
    setTimeout(() => {
      if (!receivedBlock && this.blockCallback) {
        logger.warn('No blocks received via subscription after 5s, switching to polling');
        this.provider?.removeAllListeners('block');
        this.startBlockPolling();
      }
    }, 5000);

    logger.info('Subscribed to new block events (WebSocket)');
  }

  /**
   * Poll for new blocks when WebSocket subscriptions aren't available
   */
  private startBlockPolling(): void {
    this.stopBlockPolling();

    logger.info({ intervalMs: this.POLL_INTERVAL_MS }, 'Starting block polling');

    this.pollTimer = setInterval(async () => {
      if (!this.provider || !this.blockCallback) return;

      try {
        const blockNumber = await this.provider.getBlockNumber();
        if (blockNumber > this.lastPolledBlock) {
          this.lastPolledBlock = blockNumber;
          logger.debug({ blockNumber }, 'New block (polled)');
          this.blockCallback(blockNumber);
        }
      } catch (err: any) {
        logger.warn({ err: err?.message ?? String(err) }, 'Block poll failed');
      }
    }, this.POLL_INTERVAL_MS);
  }

  /**
   * Stop block polling timer
   */
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
      this.blockCallback = null;
      logger.debug('Removed block listener');
    }
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

export function createRpcClient(wsUrl: string): RpcClient {
  return new MonadRpcClient(wsUrl);
}

