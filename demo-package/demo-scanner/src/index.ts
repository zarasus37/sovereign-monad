/**
 * Demo Spread Scanner
 *
 * DEMO ONLY - Consumes synthetic prices, computes cross-market spreads,
 * and emits opportunity candidates for the demo risk engine.
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

interface OpportunityCandidate {
  meta: {
    eventId: string;
    eventType: string;
    version: number;
    timestampMs: number;
    source: string;
  };
  id: string;
  asset: string;
  direction: 'buy_M_sell_E' | 'buy_E_sell_M';
  sizeSuggestion: string;
  entryMarket: string;
  exitMarket: string;
  modeOptions: readonly ('inventory_based' | 'bridge_based')[];
  timeWindowEstimateMs: number;
  spreadBps: number;
  volM5m: number;
  volE5m: number;
  sourceSignalId: string;
}

async function main() {
  const kafkaBrokers = (process.env.KAFKA_BROKERS || 'kafka:29092').split(',');
  const inputTopicA = process.env.INPUT_TOPIC_A || 'market.demo-a.snapshot';
  const inputTopicB = process.env.INPUT_TOPIC_B || 'market.demo-b.snapshot';
  const outputTopic = process.env.OUTPUT_TOPIC || 'market.demo.spread';
  const candidateTopic = process.env.CANDIDATE_TOPIC || 'risk.demo.opportunity-candidate';
  const spreadThresholdBps = parseFloat(process.env.SPREAD_THRESHOLD_BPS || '1');
  const bridgeDelayMs = parseInt(process.env.BRIDGE_DELAY_MS || '4000', 10);
  const sizeSuggestionUsd = parseFloat(process.env.SIZE_SUGGESTION_USD || '1000');

  console.log('[Scanner] Starting demo spread scanner');
  console.log(`[Scanner] Input topics: ${inputTopicA}, ${inputTopicB}`);
  console.log(`[Scanner] Output topic: ${outputTopic}`);
  console.log(`[Scanner] Candidate topic: ${candidateTopic}`);
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

  const latestPrices: Record<string, PriceSnapshot> = {};

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) {
        return;
      }

      const snapshot: PriceSnapshot = JSON.parse(message.value.toString());
      latestPrices[topic] = snapshot;

      const priceA = latestPrices[inputTopicA];
      const priceB = latestPrices[inputTopicB];

      if (priceA && priceB) {
        const signedSpread = priceB.priceMid - priceA.priceMid;
        const referencePrice = (priceA.priceMid + priceB.priceMid) / 2;
        const spread = Math.abs(signedSpread);
        const spreadBps = (spread / referencePrice) * 10_000;
        const spreadPct = (spread / referencePrice) * 100;
        const isViable = spreadBps >= spreadThresholdBps;
        const direction: OpportunityCandidate['direction'] =
          signedSpread >= 0 ? 'buy_M_sell_E' : 'buy_E_sell_M';
        const entryMarket = signedSpread >= 0 ? priceA.marketId : priceB.marketId;
        const exitMarket = signedSpread >= 0 ? priceB.marketId : priceA.marketId;

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

        const candidate: OpportunityCandidate = {
          meta: {
            eventId: uuidv4(),
            eventType: 'OpportunityCandidate',
            version: 1,
            timestampMs: Date.now(),
            source: 'demo-scanner',
          },
          id: uuidv4(),
          asset: 'ETH/USDC',
          direction,
          sizeSuggestion: sizeSuggestionUsd.toFixed(2),
          entryMarket,
          exitMarket,
          modeOptions: ['inventory_based', 'bridge_based'] as const,
          timeWindowEstimateMs: bridgeDelayMs,
          spreadBps,
          volM5m: 0.28,
          volE5m: 0.25,
          sourceSignalId: signal.meta.eventId,
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

        await producer.send({
          topic: candidateTopic,
          messages: [
            {
              key: candidate.id,
              value: JSON.stringify(candidate),
            },
          ],
        });

        console.log(
          `[Scanner] Spread=${spreadBps.toFixed(2)}bps (${spreadPct.toFixed(3)}%) direction=${direction} candidate=${candidate.id} signal=${signal.signal}`
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
