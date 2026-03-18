/**
 * Demo Market Agent
 * 
 * ⚠️ DEMO ONLY - Publishes mock price data for evaluation
 * No real market data, no trading logic
 */

import { Kafka, Producer } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';

interface PriceSnapshot {
  meta: {
    eventId: string;
    eventType: string;
    version: string;
    timestampMs: number;
    source: string;
  };
  chainId: string;
  marketId: string;
  baseAsset: string;
  quoteAsset: string;
  priceMid: number;
  bestBid: number;
  bestAsk: number;
  liquidity10bps: string;
  liquidity50bps: string;
  blockNumber: number;
}

async function main() {
  const kafkaBrokers = (process.env.KAFKA_BROKERS || 'kafka:29092').split(',');
  const topic = process.env.KAFKA_TOPIC || 'market.demo.snapshot';
  const marketName = process.env.MARKET_NAME || 'CHAIN_A';
  const mockPrice = parseFloat(process.env.MOCK_PRICE || '2500.00');
  const publishInterval = parseInt(process.env.PUBLISH_INTERVAL_MS || '5000');
  const logLevel = process.env.LOG_LEVEL || 'info';

  console.log(`[${marketName}] Starting demo market agent`);
  console.log(`[${marketName}] Mock price: ${mockPrice}`);
  console.log(`[${marketName}] Publish interval: ${publishInterval}ms`);

  const kafka = new Kafka({
    clientId: `demo-market-${marketName}`,
    brokers: kafkaBrokers,
    logLevel: 0, // Reduce noise
  });

  const producer = kafka.producer();
  await producer.connect();
  console.log(`[${marketName}] Connected to Kafka`);

  let blockNumber = 1000000;

  // Publish mock prices at intervals
  const interval = setInterval(async () => {
    try {
      // Add small random variation to simulate market movement
      const variation = (Math.random() - 0.5) * 10; // ±$5
      const price = mockPrice + variation;
      const spread = price * 0.001; // 0.1% spread
      
      const snapshot: PriceSnapshot = {
        meta: {
          eventId: uuidv4(),
          eventType: 'DemoPriceSnapshot',
          version: '1.0.0',
          timestampMs: Date.now(),
          source: `demo-${marketName}`,
        },
        chainId: marketName,
        marketId: `demo:${marketName}:ETH/USDC`,
        baseAsset: 'ETH',
        quoteAsset: 'USDC',
        priceMid: price,
        bestBid: price - spread / 2,
        bestAsk: price + spread / 2,
        liquidity10bps: '1000000',
        liquidity50bps: '5000000',
        blockNumber: ++blockNumber,
      };

      await producer.send({
        topic,
        messages: [
          {
            key: marketName,
            value: JSON.stringify(snapshot),
          },
        ],
      });

      console.log(`[${marketName}] Published: price=${price.toFixed(2)}, block=${blockNumber}`);
    } catch (error) {
      console.error(`[${marketName}] Error publishing:`, error);
    }
  }, publishInterval);

  // Handle graceful shutdown
  process.on('SIGTERM', async () => {
    console.log(`[${marketName}] Shutting down...`);
    clearInterval(interval);
    await producer.disconnect();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
