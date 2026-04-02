import { Log, TransactionReceipt, formatEther, formatUnits, id } from 'ethers';
import { ARBITRUM_USDC, ARBITRUM_WETH, BASE_USDC, BASE_WETH } from './execution';
import { PreparedSwapTransaction } from './adapters/types';

const ERC20_TRANSFER_TOPIC = id('Transfer(address,address,uint256)');

interface TokenMetadata {
  symbol: 'USDC' | 'WETH';
  decimals: number;
}

const TOKEN_METADATA: Record<string, TokenMetadata> = {
  [BASE_USDC.toLowerCase()]: { symbol: 'USDC', decimals: 6 },
  [ARBITRUM_USDC.toLowerCase()]: { symbol: 'USDC', decimals: 6 },
  [BASE_WETH.toLowerCase()]: { symbol: 'WETH', decimals: 18 },
  [ARBITRUM_WETH.toLowerCase()]: { symbol: 'WETH', decimals: 18 },
};

export interface SubmittedReceipt {
  tx: PreparedSwapTransaction;
  receipt: TransactionReceipt;
}

export interface TokenDelta {
  chain: 'base' | 'arbitrum';
  token: string;
  symbol: 'USDC' | 'WETH' | 'UNKNOWN';
  amount: number;
}

export interface SettlementSummary {
  status: 'filled' | 'partial_failure' | 'no_transfers';
  realizedPnlUsd: number;
  usdcSpent: number;
  usdcReceived: number;
  completedTransactions: number;
  attemptedTransactions: number;
  tokenDeltas: TokenDelta[];
}

function decodeAddress(topic: string): string {
  return `0x${topic.slice(26).toLowerCase()}`;
}

function normalizeAmount(tokenAddress: string, rawDelta: bigint): number {
  const metadata = TOKEN_METADATA[tokenAddress.toLowerCase()];
  if (!metadata) {
    return Number(formatEther(rawDelta));
  }

  return Number(formatUnits(rawDelta, metadata.decimals));
}

function isTransferLog(log: Log): boolean {
  return log.topics.length >= 3 && log.topics[0] === ERC20_TRANSFER_TOPIC;
}

export function summarizeSettlement(
  walletAddress: string,
  receipts: SubmittedReceipt[],
  attemptedTransactions: number
): SettlementSummary {
  const normalizedWallet = walletAddress.toLowerCase();
  const aggregate = new Map<string, TokenDelta>();

  for (const { tx, receipt } of receipts) {
    for (const log of receipt.logs) {
      if (!isTransferLog(log)) {
        continue;
      }

      const from = decodeAddress(log.topics[1]);
      const to = decodeAddress(log.topics[2]);
      if (from !== normalizedWallet && to !== normalizedWallet) {
        continue;
      }

      const tokenAddress = log.address.toLowerCase();
      const metadata = TOKEN_METADATA[tokenAddress];
      const rawAmount = BigInt(log.data);
      const signedAmount =
        to === normalizedWallet
          ? rawAmount
          : from === normalizedWallet
            ? -rawAmount
            : 0n;

      if (signedAmount === 0n) {
        continue;
      }

      const key = `${tx.chain}:${tokenAddress}`;
      const current = aggregate.get(key);
      const normalizedAmount = normalizeAmount(tokenAddress, signedAmount);

      aggregate.set(key, {
        chain: tx.chain,
        token: tokenAddress,
        symbol: metadata?.symbol || 'UNKNOWN',
        amount: (current?.amount || 0) + normalizedAmount,
      });
    }
  }

  const tokenDeltas = [...aggregate.values()];
  const usdcSpent = tokenDeltas
    .filter((delta) => delta.symbol === 'USDC' && delta.amount < 0)
    .reduce((sum, delta) => sum + Math.abs(delta.amount), 0);
  const usdcReceived = tokenDeltas
    .filter((delta) => delta.symbol === 'USDC' && delta.amount > 0)
    .reduce((sum, delta) => sum + delta.amount, 0);

  return {
    status:
      receipts.length === 0
        ? 'no_transfers'
        : receipts.length < attemptedTransactions
          ? 'partial_failure'
          : 'filled',
    realizedPnlUsd: usdcReceived - usdcSpent,
    usdcSpent,
    usdcReceived,
    completedTransactions: receipts.length,
    attemptedTransactions,
    tokenDeltas,
  };
}
