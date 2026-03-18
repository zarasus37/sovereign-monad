/**
 * Demo Spread Scanner
 * 
 * ⚠️ DEMO ONLY - Calculates mock spreads for evaluation
 * No real trading signals, no execution
 */

import { Kafka, Consumer, Producer } from 'kafkajs';
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

interface SpreadSignal {
  meta: {
    eventId: string;
    eventType: string;
    version: string;
    timestampMs: number;
    source: string;
  };
  chainA: string;
  chainB: string;
  priceA: number;
  priceB: number;
  spreadBps: number;
  spreadPct: number;
  isViable: boolean;
  signal: string;
}

async function main() {
  const kafkaBrokers = (process.env.KAFKA_BROKERS || 'kafka:29092').split(',');
  const inputTopicA = process.env.INPUT_TOPIC_A || 'market.demo-a.snapshot';
  const inputTopicB = process.env.INPUT_TOPIC_B || 'market.demo-b.snapshot';
  const outputTopic = process.env.OUTPUT_TOPIC || 'market.demo.spread';
  const spreadThresholdBps = parseFloat(process.env.SPREAD_THRESHOLD_BPS || '1');

  console.log('[Scanner] Starting demo spread scanner');
  console.log(`[Scanner] Input topics: ${inputTopicA}, ${inputTopicB}`);
  console.log(`[Scanner] Output topic: ${outputTopic}`);
  console.log(`[Scanner] Spread threshold: ${spreadThresholdBps} bps`);

  const kafka = new Kafka({
    clientId: 'demo-scanner',
    brokers: kafkaBrokers,
    logLevel: 0,
  });

  const consumer = kafka.consumer({ groupId: 'demo-scanner-group' });
  const producer = kafka.producer();

  await Promise.all([consumer.connect(), producer.connect()]);
  console.log('[Scanner] Connected to Kafka');

  await consumer.subscribe({ topic: inputTopicA, fromBeginning: false });
  await consumer.subscribe({ topic: inputTopicB, fromBeginning: false });

  // Store latest prices from each market
  const latestPrices: Record<string, PriceSnapshot> = {};

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) return;

      const snapshot: PriceSnapshot = JSON.parse(message.value.toString());
      latestPrices[topic] = snapshot;

      // Try to calculate spread when we have both prices
      const priceA = latestPrices[inputTopicA];
      const priceB = latestPrices[inputTopicB];

      if (priceA && priceB) {
        const spread = Math.abs(priceA.priceMid - priceB.priceMid);
        const spreadBps = (spread / priceA.priceMid) * 10000;
        const spreadPct = (spread / priceA.priceMid) * 100;
        const isViable = spreadBps >= spreadThresholdBps;

        const signal: SpreadSignal = {
          meta: {
            eventId: uuidv4(),
            eventType: 'DemoSpreadSignal',
            version: '1.0.0',
            timestampMs: Date.now(),
            source: 'demo-scanner',
          },
          chainA: priceA.chainId,
          chainB: priceB.chainId,
          priceA: priceA.priceMid,
          priceB: priceB.priceMid,
          spreadBps,
          spreadPct,
          isViable,
          signal: isViable ? 'SPREAD_DETECTED' : 'NO_OPPORTUNITY',
        };

        await producer.send({
          topic: outputTopic,
          messages: [
            {
              key: `${priceA.chainId}-${priceB.chainId}`,
              value: JSON.stringify(signal),
            },
          ],
        });

        console.log(
          `[Scanner] Spread: ${spreadBps.toFixed(4)} bps (${spreadPct.toFixed(4)}%) - ${signal.signal}`
        );
      }
    },
  });

  console.log('[Scanner] Listening for price updates...');

  process.on('SIGTERM', async () => {
    console.log('[Scanner] Shutting down...');
    await Promise.all([consumer.disconnect(), producer.disconnect()]);
    process.exit(0);
  });
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
