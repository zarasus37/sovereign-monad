/**
 * Flashbots bundle submission for private Ethereum transactions.
 * Uses the Flashbots relay API (eth_sendBundle) to submit transactions
 * that bypass the public mempool, preventing front-running/sandwich attacks.
 *
 * Auth: Each request is signed with a dedicated Flashbots auth key (not the wallet key).
 * The relay identifies your reputation via this key.
 */

import { ethers, Wallet, JsonRpcProvider } from 'ethers';
import { createLogger } from './utils/logger';

const logger = createLogger('flashbots');

export interface FlashbotsConfig {
  relayUrl: string;
  authSigner: Wallet;
  provider: JsonRpcProvider;
}

export interface BundleParams {
  signedTx: string;
  targetBlockNumber: number;
}

interface RelayResponse {
  jsonrpc: string;
  id: number;
  result?: { bundleHash: string };
  error?: { code: number; message: string };
}

export class FlashbotsRelay {
  private relayUrl: string;
  private authSigner: Wallet;
  private provider: JsonRpcProvider;

  constructor(config: FlashbotsConfig) {
    this.relayUrl = config.relayUrl;
    this.authSigner = config.authSigner;
    this.provider = config.provider;
  }

  /**
   * Send a signed transaction as a Flashbots bundle targeting the next N blocks.
   * Returns the bundle hash if accepted by the relay, or null on failure.
   */
  async sendBundle(signedTx: string, blocksAhead: number = 3): Promise<string | null> {
    const currentBlock = await this.provider.getBlockNumber();

    // Submit to the next `blocksAhead` blocks for higher inclusion probability
    for (let i = 1; i <= blocksAhead; i++) {
      const targetBlock = currentBlock + i;
      const hash = await this.submitToRelay(signedTx, targetBlock);
      if (hash) {
        logger.info({ bundleHash: hash, targetBlock }, 'Bundle submitted');
        return hash;
      }
    }

    logger.warn('Bundle rejected by all target blocks');
    return null;
  }

  /**
   * Submit a single bundle to the Flashbots relay.
   */
  private async submitToRelay(signedTx: string, targetBlock: number): Promise<string | null> {
    const params = {
      txs: [signedTx],
      blockNumber: `0x${targetBlock.toString(16)}`,
    };

    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_sendBundle',
      params: [params],
    });

    // Flashbots auth: sign the request body with the auth key
    const signature = await this.authSigner.signMessage(
      ethers.id(body)
    );
    const authHeader = `${await this.authSigner.getAddress()}:${signature}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {
      const resp = await fetch(this.relayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Flashbots-Signature': authHeader,
        },
        body,
        signal: controller.signal,
      });

      const data: RelayResponse = await resp.json() as RelayResponse;

      if (data.error) {
        logger.warn({ error: data.error, targetBlock }, 'Relay error');
        return null;
      }

      return data.result?.bundleHash ?? null;
    } catch (err) {
      logger.error({ err, targetBlock }, 'Failed to submit bundle');
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Check if a bundle was included in a block.
   */
  async getBundleStats(bundleHash: string, targetBlock: number): Promise<boolean> {
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'flashbots_getBundleStatsV2',
      params: [{ bundleHash, blockNumber: `0x${targetBlock.toString(16)}` }],
    });

    const signature = await this.authSigner.signMessage(ethers.id(body));
    const authHeader = `${await this.authSigner.getAddress()}:${signature}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const resp = await fetch(this.relayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Flashbots-Signature': authHeader,
        },
        body,
        signal: controller.signal,
      });

      const data = await resp.json() as Record<string, unknown>;
      const result = data.result as Record<string, unknown> | undefined;
      const included = result?.isSimulated === true;
      logger.info({ bundleHash, targetBlock, included }, 'Bundle stats');
      return included;
    } catch {
      return false;
    } finally {
      clearTimeout(timeout);
    }
  }
}
