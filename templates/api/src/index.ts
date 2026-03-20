/**
 * Trading API
 * 
 * RESTful API for trading data
 */

import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get prices
app.get('/api/prices', (req, res) => {
  res.json({
    base: { eth: 2131 },
    arbitrum: { eth: 2132 },
    spread: { bps: 4.7, usd: 1 },
  });
});

// Get positions
app.get('/api/positions', (req, res) => {
  res.json({
    positions: [
      { pair: 'ETH/USDC', size: '1.5 ETH', entry: 2130, current: 2131, pnl: 1.5 },
    ],
  });
});

// Get trades
app.get('/api/trades', (req, res) => {
  res.json({
    trades: [
      { id: '1', time: '2026-03-20T10:30:00Z', pair: 'ETH/USDC', side: 'buy', size: '0.5 ETH', price: 2130 },
      { id: '2', time: '2026-03-20T10:31:00Z', pair: 'ETH/USDC', side: 'sell', size: '0.5 ETH', price: 2131 },
    ],
  });
});

// Get stats
app.get('/api/stats', (req, res) => {
  res.json({
    totalTrades: 42,
    totalVolume: '15.5 ETH',
    totalPnl: '2.5 ETH',
    winRate: 0.65,
  });
});

app.listen(port, () => {
  console.log(`🚀 Trading API running on port ${port}`);
});
