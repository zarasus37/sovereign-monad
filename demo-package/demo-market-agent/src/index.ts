/**
 * Demo Market Agent
 *
 * DEMO ONLY - Publishes synthetic price data for evaluation.
 * The goal is to produce realistic-but-safe spread behavior without
 * requiring private market connectors or live RPC access.
 */

import { Kafka } from 'kafkajs';
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
  const basePrice = parseFloat(process.env.MOCK_PRICE || '2500.00');
  const publishInterval = parseInt(process.env.PUBLISH_INTERVAL_MS || '2000', 10);
  const venueSpreadBps = parseFloat(process.env.VENUE_SPREAD_BPS || '8');
  const volatilityBps = parseFloat(process.env.VOLATILITY_BPS || '14');
  const driftBpsPerTick = parseFloat(process.env.DRIFT_BPS_PER_TICK || '0');
  const waveAmplitudeBps = parseFloat(process.env.WAVE_AMPLITUDE_BPS || '10');
  const wavePeriodTicks = parseInt(process.env.WAVE_PERIOD_TICKS || '18', 10);
  const liquidity10bps = process.env.LIQUIDITY_10BPS || '1500000';
  const liquidity50bps = process.env.LIQUIDITY_50BPS || '6000000';

  console.log(`[${marketName}] Starting demo market agent`);
  console.log(`[${marketName}] Base price: ${basePrice}`);
  console.log(`[${marketName}] Publish interval: ${publishInterval}ms`);

  const kafka = new Kafka({
    clientId: `demo-market-${marketName}`,
    brokers: kafkaBrokers,
    logLevel: 0,
  });

  const producer = kafka.producer();
  await producer.connect();
  console.log(`[${marketName}] Connected to Kafka`);

  let blockNumber = 1_000_000;
  let price = basePrice;
  let tick = 0;

  const interval = setInterval(async () => {
    try {
      tick += 1;
      const shockFrac = ((Math.random() - 0.5) * volatilityBps) / 10_000;
      const driftFrac = driftBpsPerTick / 10_000;
      const waveFrac =
        (waveAmplitudeBps / 10_000) * Math.sin((tick / Math.max(wavePeriodTicks, 1)) * Math.PI * 2);

      price = Math.max(100, price * (1 + shockFrac + driftFrac + waveFrac * 0.15));

      const halfSpread = price * ((venueSpreadBps / 10_000) / 2);

      const snapshot: PriceSnapshot = {
        meta: {
          eventId: uuidv4(),
          eventType: 'SyntheticPriceSnapshot',
          version: '1.0.0',
          timestampMs: Date.now(),
          source: `demo-${marketName}`,
        },
        chainId: marketName,
        marketId: `demo:${marketName}:ETH/USDC`,
        baseAsset: 'ETH',
        quoteAsset: 'USDC',
        priceMid: price,
        bestBid: price - halfSpread,
        bestAsk: price + halfSpread,
        liquidity10bps,
        liquidity50bps,
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

      console.log(
        `[${marketName}] Published mid=${price.toFixed(2)} bid=${snapshot.bestBid.toFixed(2)} ask=${snapshot.bestAsk.toFixed(2)} block=${blockNumber}`
      );
    } catch (error) {
      console.error(`[${marketName}] Error publishing:`, error);
    }
  }, publishInterval);

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
