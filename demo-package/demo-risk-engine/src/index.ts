import { Kafka } from 'kafkajs';

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

interface OpportunityEvaluation {
  opportunityId: string;
  mode: 'inventory_based' | 'bridge_based';
  approved: boolean;
  evMean: number;
  evStd: number;
  sharpeLike: number;
  maxDrawdownEstimate: number;
  effectiveSpreadBps: number;
  kellySizeUsd: number;
  sizeUsd: number;
}

class DemoRiskEngine {
  private readonly bpsToFrac = 0.0001;
  private readonly secsPerYear = 31_557_600;

  constructor(
    private readonly portfolioUsd: number,
    private readonly annualVol: number,
    private readonly fixedCostBps: number,
    private readonly minEffectiveSpreadBps: number
  ) {}

  effectiveSpread(rawSpreadBps: number, bridgeDelaySec: number): number {
    const rawSpread = rawSpreadBps * this.bpsToFrac;
    const t = Math.max(bridgeDelaySec, 0) / this.secsPerYear;
    const decay = this.annualVol * Math.sqrt(t);
    const compounding = 0.5 * decay * decay;
    const effectiveFrac = rawSpread - decay - compounding - this.fixedCostBps * this.bpsToFrac;
    return effectiveFrac / this.bpsToFrac;
  }

  positionSize(rawSpreadBps: number, bridgeDelaySec: number): number {
    const effectiveBps = this.effectiveSpread(rawSpreadBps, bridgeDelaySec);

    if (effectiveBps < this.minEffectiveSpreadBps) {
      return 0;
    }

    const edge = effectiveBps * this.bpsToFrac;
    const t = Math.max(bridgeDelaySec, 1) / this.secsPerYear;
    const variance = Math.pow(this.annualVol * Math.sqrt(t), 2);
    const kellyFrac = Math.max((edge / variance) * 0.25, 0);
    const rawSize = this.portfolioUsd * kellyFrac;

    return Math.min(rawSize, this.portfolioUsd * 0.1);
  }
}

function shouldApprove(
  evaluation: OpportunityEvaluation,
  evMinThreshold: number,
  sharpeLikeThreshold: number,
  maxTailLossPercent: number
): boolean {
  if (evaluation.sizeUsd <= 0 || evaluation.kellySizeUsd <= 0) {
    return false;
  }

  const maxAllowedLossUsd = evaluation.sizeUsd * (maxTailLossPercent / 100);

  return (
    evaluation.evMean > 0 &&
    evaluation.evMean >= evMinThreshold &&
    evaluation.sharpeLike >= sharpeLikeThreshold &&
    Math.abs(evaluation.maxDrawdownEstimate) <= maxAllowedLossUsd
  );
}

async function main() {
  const kafka = new Kafka({
    clientId: 'demo-risk-engine',
    brokers: (process.env.KAFKA_BROKERS || 'kafka:29092').split(','),
    logLevel: 0,
  });

  const inputTopic = process.env.INPUT_TOPIC || 'risk.demo.opportunity-candidate';
  const outputTopic = process.env.OUTPUT_TOPIC || 'risk.demo.opportunity-evaluation';
  const gasCostUsd = parseFloat(process.env.DEMO_GAS_COST_USD || '6.5');
  const evMinThreshold = parseFloat(process.env.EV_MIN_THRESHOLD || '0');
  const sharpeLikeThreshold = parseFloat(process.env.SHARPE_LIKE_THRESHOLD || '0.15');
  const maxTailLossPercent = parseFloat(process.env.MAX_TAIL_LOSS_PERCENT || '20');

  const engine = new DemoRiskEngine(
    parseFloat(process.env.RISK_PORTFOLIO_USD || '10000'),
    parseFloat(process.env.RISK_ANNUAL_VOL || '0.30'),
    parseFloat(process.env.RISK_FIXED_COST_BPS || '8'),
    parseFloat(process.env.RISK_MIN_EFFECTIVE_SPREAD_BPS || '12')
  );

  const consumer = kafka.consumer({ groupId: 'demo-risk-engine-group' });
  const producer = kafka.producer();

  await Promise.all([consumer.connect(), producer.connect()]);
  await consumer.subscribe({ topic: inputTopic, fromBeginning: false });

  console.log(`[Demo Risk Engine] Listening on ${inputTopic}`);

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) {
        return;
      }

      const candidate: OpportunityCandidate = JSON.parse(message.value.toString());

      for (const mode of candidate.modeOptions) {
        const bridgeDelaySec = mode === 'inventory_based' ? 0 : candidate.timeWindowEstimateMs / 1000;
        const kellySizeUsd = engine.positionSize(candidate.spreadBps, bridgeDelaySec);
        const sizeUsd = Math.min(kellySizeUsd, parseFloat(candidate.sizeSuggestion));
        const effectiveSpreadBps = engine.effectiveSpread(candidate.spreadBps, bridgeDelaySec);
        const edgeFrac = Math.max(effectiveSpreadBps, 0) * 0.0001;
        const timeScale = Math.sqrt(Math.max(bridgeDelaySec, 1) / 31_557_600);
        const totalGasCostUsd = mode === 'bridge_based' ? gasCostUsd * 2 : gasCostUsd;
        const evMean = sizeUsd * edgeFrac * 0.65 - totalGasCostUsd;
        const evStd = sizeUsd > 0 ? Math.max(sizeUsd * 0.30 * timeScale, 0.01) : 0;
        const sharpeLike = evStd > 0 ? evMean / evStd : 0;
        const maxDrawdownEstimate = sizeUsd > 0 ? -(sizeUsd * 0.30 * timeScale * 2) : 0;

        const baseEvaluation: OpportunityEvaluation = {
          opportunityId: candidate.id,
          mode,
          approved: false,
          evMean,
          evStd,
          sharpeLike,
          maxDrawdownEstimate,
          effectiveSpreadBps,
          kellySizeUsd,
          sizeUsd,
        };

        const approved = shouldApprove(
          baseEvaluation,
          evMinThreshold,
          sharpeLikeThreshold,
          maxTailLossPercent
        );

        const evaluation: OpportunityEvaluation = {
          ...baseEvaluation,
          approved,
        };

        await producer.send({
          topic: outputTopic,
          messages: [
            {
              key: `${candidate.id}:${mode}`,
              value: JSON.stringify({
                meta: {
                  eventId: candidate.meta.eventId,
                  eventType: 'OpportunityEvaluation',
                  version: 1,
                  timestampMs: Date.now(),
                  source: 'demo-risk-engine',
                },
                ...evaluation,
              }),
            },
          ],
        });

        console.log(
          `[Demo Risk Engine] ${approved ? 'ACCEPT' : 'REJECT'} opportunity=${candidate.id} mode=${mode} eff=${effectiveSpreadBps.toFixed(2)}bps ev=${evMean.toFixed(2)} sharpe=${sharpeLike.toFixed(2)} size=$${sizeUsd.toFixed(2)}`
        );
      }
    },
  });
}

main().catch((error) => {
  console.error('[Demo Risk Engine] Fatal error:', error);
  process.exit(1);
});
