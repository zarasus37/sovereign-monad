/**
 * Price Alert Bot
 * 
 * Monitors prices and sends alerts when thresholds are crossed
 */

import fetch from 'node-fetch';

interface PriceAlert {
  symbol: string;
  above?: number;
  below?: number;
  message: string;
  sent: boolean;
}

const PRICE_API = 'https://api.coingecko.com/api/v3/simple/price';

async function checkPrices(alerts: PriceAlert[]): Promise<void> {
  const symbols = [...new Set(alerts.map(a => a.symbol))];
  
  const prices: Record<string, number> = {};
  
  for (const symbol of symbols) {
    try {
      const response = await fetch(
        `${PRICE_API}?ids=${symbol}&vs_currencies=usd`
      );
      const data = await response.json();
      prices[symbol] = data[symbol]?.usd || 0;
    } catch (error) {
      console.error(`Failed to fetch ${symbol}:`, error);
    }
  }
  
  for (const alert of alerts) {
    if (alert.sent) continue;
    
    const price = prices[alert.symbol];
    if (!price) continue;
    
    const triggered = 
      (alert.above && price >= alert.above) ||
      (alert.below && price <= alert.below);
    
    if (triggered) {
      console.log(`🔔 ALERT: ${alert.message} (${alert.symbol}: $${price})`);
      alert.sent = true;
    }
  }
}

// Example usage
const alerts: PriceAlert[] = [
  { symbol: 'ethereum', above: 3000, message: 'ETH crossed $3,000', sent: false },
  { symbol: 'ethereum', below: 1500, message: 'ETH dropped below $1,500', sent: false },
  { symbol: 'bitcoin', above: 50000, message: 'BTC crossed $50,000', sent: false },
];

// Check every 60 seconds
setInterval(() => checkPrices(alerts), 60000);
