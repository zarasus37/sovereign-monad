const test = require('node:test');
const assert = require('node:assert/strict');
const { summarizeSettlement } = require('../dist/settlement.js');
const {
  BASE_USDC,
  ARBITRUM_USDC,
  ARBITRUM_WETH,
} = require('../dist/execution.js');

function topicAddress(address) {
  return `0x${address.toLowerCase().replace(/^0x/, '').padStart(64, '0')}`;
}

function transferLog(token, from, to, rawAmount) {
  return {
    address: token,
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      topicAddress(from),
      topicAddress(to),
    ],
    data: `0x${BigInt(rawAmount).toString(16)}`,
  };
}

test('summarizeSettlement computes realized USDC pnl from completed legs', () => {
  const wallet = '0x5555555555555555555555555555555555555555';
  const router = '0x1111111111111111111111111111111111111111';
  const receipts = [
    {
      tx: {
        chain: 'base',
        protocol: 'aerodrome',
        venue: 'aerodrome:ETH/USDC:spot',
      },
      receipt: {
        logs: [
          transferLog(BASE_USDC, wallet, router, 1000_000000n),
        ],
      },
    },
    {
      tx: {
        chain: 'arbitrum',
        protocol: 'camelot',
        venue: 'camelot:ETH/USDC:spot',
      },
      receipt: {
        logs: [
          transferLog(ARBITRUM_WETH, wallet, router, 400000000000000000n),
          transferLog(ARBITRUM_USDC, router, wallet, 1012_500000n),
        ],
      },
    },
  ];

  const summary = summarizeSettlement(wallet, receipts, 2);
  assert.equal(summary.status, 'filled');
  assert.equal(summary.usdcSpent, 1000);
  assert.equal(summary.usdcReceived, 1012.5);
  assert.equal(summary.realizedPnlUsd, 12.5);
});

test('summarizeSettlement marks partial failure when only one receipt completed', () => {
  const wallet = '0x5555555555555555555555555555555555555555';
  const router = '0x1111111111111111111111111111111111111111';
  const receipts = [
    {
      tx: {
        chain: 'base',
        protocol: 'aerodrome',
        venue: 'aerodrome:ETH/USDC:spot',
      },
      receipt: {
        logs: [
          transferLog(BASE_USDC, wallet, router, 1000_000000n),
        ],
      },
    },
  ];

  const summary = summarizeSettlement(wallet, receipts, 2);
  assert.equal(summary.status, 'partial_failure');
  assert.equal(summary.completedTransactions, 1);
  assert.equal(summary.attemptedTransactions, 2);
  assert.equal(summary.realizedPnlUsd, -1000);
});
