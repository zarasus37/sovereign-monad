import fs from 'fs';
import path from 'path';
import { MonteCarloParams, MonteCarloResult, runMonteCarlo } from '../engine/montecarlo';
import { OpportunityCandidate } from '../models/events';
import stressGates from './stress-gates.json';

type ExecutionMode = 'inventory_based' | 'bridge_based';

interface StressScenario {
  name: string;
  mode: ExecutionMode;
  description: string;
  opportunity: OpportunityCandidate;
  params?: Partial<MonteCarloParams>;
  seedBase?: number;
}

interface ScenarioAggregate {
  name: string;
  mode: ExecutionMode;
  description: string;
  evMean: number;
  evStd: number;
  sharpeLike: number;
  pLossGt10Pct: number;
  p01Pnl: number;
  maxDrawdownEstimate: number;
  approvals: number;
  trials: number;
  pass: boolean;
  gateStatus: 'match' | 'mismatch' | 'unguarded';
  gateNotes: string[];
}

interface StressMatrixReport {
  generatedAt: string;
  trials: number;
  simulationsPerTrial: number;
  riskGate: typeof RISK_CONFIG;
  fieldNotes: {
    p01Pnl: string;
  };
  gateNotes: string;
  results: ScenarioAggregate[];
}

interface ScenarioGate {
  expectedPass?: boolean;
  minEvMean?: number;
  maxEvMean?: number;
  minSharpeLike?: number;
  maxSharpeLike?: number;
  maxPLossGt10Pct?: number;
  maxApprovals?: number;
}

const SCENARIO_GATES = stressGates.scenarios as Record<string, ScenarioGate>;

const TRIALS = 4;
const SIMULATIONS_PER_TRIAL = 2000;
const BASE_SEED = 424242;
const RISK_CONFIG = {
  evMinThreshold: 100,
  sharpeLikeThreshold: 0.5,
  maxTailLossPercent: 20,
};

const BASE_OPPORTUNITY: OpportunityCandidate = {
  meta: {
    eventId: 'stress-matrix-base',
    eventType: 'OpportunityCandidate',
    version: 1,
    timestampMs: Date.now(),
    source: 'stress-matrix',
  },
  id: 'stress-opp-base',
  asset: 'ETH',
  direction: 'buy_M_sell_E',
  sizeSuggestion: '50000',
  entryMarket: 'aerodrome:ETH/USDC:spot',
  exitMarket: 'camelot:ETH/USDC:spot',
  entryPrice: 2500,
  exitPrice: 2510,
  modeOptions: ['inventory_based', 'bridge_based'],
  timeWindowEstimateMs: 30000,
  spreadBps: 25,
  volM5m: 0.5,
  volE5m: 0.3,
  sourceSignalId: 'stress-signal-base',
};

function makeOpportunity(
  scenarioId: string,
  mode: ExecutionMode,
  overrides: Partial<OpportunityCandidate> = {}
): OpportunityCandidate {
  return {
    ...BASE_OPPORTUNITY,
    ...overrides,
    meta: {
      ...BASE_OPPORTUNITY.meta,
      eventId: `stress-${scenarioId}`,
      timestampMs: Date.now(),
    },
    id: `stress-${scenarioId}`,
    modeOptions: [mode, mode],
  };
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatNumber(value: number): string {
  return value.toFixed(2);
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(3)}%`;
}

function printDivider(lengths: number[]): void {
  console.log(lengths.map((length) => '-'.repeat(length)).join('-+-'));
}

function printTable(rows: string[][]): void {
  const columnWidths = rows[0].map((_, columnIndex) =>
    Math.max(...rows.map((row) => row[columnIndex].length))
  );

  rows.forEach((row, rowIndex) => {
    const line = row
      .map((cell, columnIndex) => cell.padEnd(columnWidths[columnIndex]))
      .join(' | ');
    console.log(line);
    if (rowIndex === 0) {
      printDivider(columnWidths);
    }
  });
}

export function evaluateScenario(
  scenario: StressScenario
): ScenarioAggregate {
  const metrics: MonteCarloResult[] = [];
  let approvals = 0;
  const seedBase = scenario.seedBase ?? BASE_SEED;

  for (let trial = 0; trial < TRIALS; trial++) {
    const result = runMonteCarlo(
      scenario.opportunity,
      {
        ...scenario.params,
        seed: seedBase + trial,
      },
      SIMULATIONS_PER_TRIAL
    );
    metrics.push(result);
    if (isApproved(result, scenario.opportunity)) {
      approvals += 1;
    }
  }

  const evMeans = metrics.map((metric) => metric.evMean);
  const evStds = metrics.map((metric) => metric.evStd);
  const sharpeLikes = metrics.map((metric) => metric.sharpeLike);
  const pLossValues = metrics.map((metric) => metric.pLossGtX);
  const tailPnls = metrics.map((metric) => metric.p01Pnl);
  const pass = approvals === TRIALS;
  const gateAssessment = assessScenarioGate(
    scenario.name,
    {
      name: scenario.name,
      mode: scenario.mode,
      description: scenario.description,
      evMean: average(evMeans),
      evStd: average(evStds),
      sharpeLike: average(sharpeLikes),
      pLossGt10Pct: average(pLossValues),
      p01Pnl: average(tailPnls),
      maxDrawdownEstimate: average(tailPnls),
      approvals,
      trials: TRIALS,
      pass,
      gateStatus: 'unguarded',
      gateNotes: [],
    }
  );

  return gateAssessment;
}

function isApproved(result: MonteCarloResult, opportunity: OpportunityCandidate): boolean {
  const maxAllowedLoss =
    (RISK_CONFIG.maxTailLossPercent / 100) * parseFloat(opportunity.sizeSuggestion);

  return (
    result.evMean > RISK_CONFIG.evMinThreshold &&
    result.sharpeLike > RISK_CONFIG.sharpeLikeThreshold &&
    Math.abs(result.p01Pnl) < maxAllowedLoss
  );
}

function assessScenarioGate(
  scenarioName: string,
  result: ScenarioAggregate
): ScenarioAggregate {
  const gate = SCENARIO_GATES[scenarioName];
  if (!gate) {
    return result;
  }

  const notes: string[] = [];

  if (gate.expectedPass !== undefined && result.pass !== gate.expectedPass) {
    notes.push(`expected pass=${gate.expectedPass} but saw ${result.pass}`);
  }
  if (gate.minEvMean !== undefined && result.evMean < gate.minEvMean) {
    notes.push(`evMean ${result.evMean.toFixed(2)} < min ${gate.minEvMean}`);
  }
  if (gate.maxEvMean !== undefined && result.evMean > gate.maxEvMean) {
    notes.push(`evMean ${result.evMean.toFixed(2)} > max ${gate.maxEvMean}`);
  }
  if (gate.minSharpeLike !== undefined && result.sharpeLike < gate.minSharpeLike) {
    notes.push(`sharpe ${result.sharpeLike.toFixed(2)} < min ${gate.minSharpeLike}`);
  }
  if (gate.maxSharpeLike !== undefined && result.sharpeLike > gate.maxSharpeLike) {
    notes.push(`sharpe ${result.sharpeLike.toFixed(2)} > max ${gate.maxSharpeLike}`);
  }
  if (gate.maxPLossGt10Pct !== undefined && result.pLossGt10Pct > gate.maxPLossGt10Pct) {
    notes.push(`pLoss10 ${result.pLossGt10Pct.toFixed(4)} > max ${gate.maxPLossGt10Pct}`);
  }
  if (gate.maxApprovals !== undefined && result.approvals > gate.maxApprovals) {
    notes.push(`approvals ${result.approvals} > max ${gate.maxApprovals}`);
  }

  return {
    ...result,
    gateStatus: notes.length === 0 ? 'match' : 'mismatch',
    gateNotes: notes,
  };
}

export function buildScenarios(): StressScenario[] {
  return [
    {
      name: 'baseline_inventory',
      mode: 'inventory_based',
      description: 'Current base fixture with inventory close.',
      opportunity: makeOpportunity('baseline-inventory', 'inventory_based'),
      seedBase: 1000,
    },
    {
      name: 'baseline_bridge',
      mode: 'bridge_based',
      description: 'Current base fixture with bridge exposure.',
      opportunity: makeOpportunity('baseline-bridge', 'bridge_based'),
      seedBase: 2000,
    },
    {
      name: 'low_spread_inventory',
      mode: 'inventory_based',
      description: 'Spread compressed to 5 bps on smaller notional.',
      opportunity: makeOpportunity('low-spread-inventory', 'inventory_based', {
        spreadBps: 5,
        sizeSuggestion: '10000',
      }),
      seedBase: 3000,
    },
    {
      name: 'high_vol_inventory',
      mode: 'inventory_based',
      description: 'Volatility spike with still-decent spread.',
      opportunity: makeOpportunity('high-vol-inventory', 'inventory_based', {
        spreadBps: 50,
        volM5m: 2.0,
        volE5m: 1.5,
      }),
      seedBase: 4000,
    },
    {
      name: 'large_size_inventory',
      mode: 'inventory_based',
      description: 'Large inventory clip with explicit market-impact cost.',
      opportunity: makeOpportunity('large-size-inventory', 'inventory_based', {
        spreadBps: 30,
        sizeSuggestion: '500000',
      }),
      params: {
        inventorySlippageBps: 2,
        marketImpactBpsPer100k: 3,
        liquidityShockMultiplier: 1.5,
      },
      seedBase: 5000,
    },
    {
      name: 'long_bridge_delay',
      mode: 'bridge_based',
      description: 'Bridge delay doubles and settlement window stretches.',
      opportunity: makeOpportunity('long-bridge-delay', 'bridge_based', {
        timeWindowEstimateMs: 60000,
      }),
      params: {
        bridgeLatencyMs: { median: 30000, p95: 60000 },
        bridgeSlippageBps: 6,
        liquidityShockMultiplier: 1.25,
      },
      seedBase: 6000,
    },
    {
      name: 'fee_shock_bridge',
      mode: 'bridge_based',
      description: 'Bridge fees, gas, and slippage all widen materially.',
      opportunity: makeOpportunity('fee-shock-bridge', 'bridge_based'),
      params: {
        gasCostUsd: 20,
        bridgeFeeBps: 15,
        bridgeSlippageBps: 10,
        liquidityShockMultiplier: 1.75,
      },
      seedBase: 7000,
    },
    {
      name: 'bridge_failure_shock',
      mode: 'bridge_based',
      description: 'Bridge failure probability is stressed above baseline.',
      opportunity: makeOpportunity('bridge-failure-shock', 'bridge_based', {
        spreadBps: 30,
        sizeSuggestion: '60000',
      }),
      params: {
        bridgeFailureRate: 0.02,
        bridgeSlippageBps: 6,
        liquidityShockMultiplier: 1.2,
      },
      seedBase: 7500,
    },
    {
      name: 'thin_liquidity_inventory',
      mode: 'inventory_based',
      description: 'Thin liquidity regime with elevated taker slippage.',
      opportunity: makeOpportunity('thin-liquidity-inventory', 'inventory_based', {
        spreadBps: 28,
        sizeSuggestion: '120000',
      }),
      params: {
        inventorySlippageBps: 6,
        marketImpactBpsPer100k: 5,
        liquidityShockMultiplier: 2.5,
      },
      seedBase: 8000,
    },
    {
      name: 'bridge_stress_extreme',
      mode: 'bridge_based',
      description: 'High vol, bigger notional, low correlation, long delay, thin liquidity.',
      opportunity: makeOpportunity('bridge-stress-extreme', 'bridge_based', {
        spreadBps: 35,
        sizeSuggestion: '100000',
        timeWindowEstimateMs: 90000,
        volM5m: 2.5,
        volE5m: 2.0,
      }),
      params: {
        correlation: 0.25,
        gasCostUsd: 25,
        bridgeFeeBps: 20,
        bridgeSlippageBps: 12,
        marketImpactBpsPer100k: 6,
        liquidityShockMultiplier: 2.5,
        bridgeLatencyMs: { median: 45000, p95: 120000 },
      },
      seedBase: 9000,
    },
  ];
}

function printSummary(results: ScenarioAggregate[]): void {
  const rows: string[][] = [
    ['scenario', 'mode', 'pass', 'gate', 'approvals', 'ev_mean', 'ev_std', 'sharpe', 'p_loss_10%', 'p01_pnl'],
    ...results.map((result) => [
      result.name,
      result.mode,
      result.pass ? 'PASS' : 'FAIL',
      result.gateStatus.toUpperCase(),
      `${result.approvals}/${result.trials}`,
      formatNumber(result.evMean),
      formatNumber(result.evStd),
      formatNumber(result.sharpeLike),
      formatPercent(result.pLossGt10Pct),
      formatNumber(result.p01Pnl),
    ]),
  ];

  printTable(rows);
  console.log('');
  results.forEach((result) => {
    console.log(`[${result.name}] ${result.description}`);
    if (result.gateNotes.length > 0) {
      console.log(`  gate_notes: ${result.gateNotes.join('; ')}`);
    }
  });
}

export function buildReport(results: ScenarioAggregate[]): StressMatrixReport {
  return {
    generatedAt: new Date().toISOString(),
    trials: TRIALS,
    simulationsPerTrial: SIMULATIONS_PER_TRIAL,
    riskGate: RISK_CONFIG,
    fieldNotes: {
      p01Pnl: '1st-percentile PnL. maxDrawdownEstimate is a legacy compatibility alias for the same value.',
    },
    gateNotes: stressGates.notes,
    results,
  };
}

function parseArgs(argv: string[]): { json: boolean; outPath?: string } {
  let json = false;
  let outPath: string | undefined;

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (arg === '--json') {
      json = true;
      continue;
    }
    if (arg === '--out') {
      outPath = argv[index + 1];
      index += 1;
    }
  }

  return { json, outPath };
}

function writeJsonReport(report: StressMatrixReport, outPath?: string): void {
  const payload = JSON.stringify(report, null, 2);
  if (outPath) {
    const resolvedPath = path.resolve(outPath);
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    fs.writeFileSync(resolvedPath, payload);
    console.log(`Wrote stress matrix JSON to ${resolvedPath}`);
    return;
  }

  console.log(payload);
}

export function main(): void {
  const options = parseArgs(process.argv.slice(2));
  const scenarios = buildScenarios();
  const results = scenarios.map(evaluateScenario);
  const report = buildReport(results);

  if (options.json) {
    writeJsonReport(report, options.outPath);
    return;
  }

  console.log(
    `Stress matrix: ${TRIALS} trials x ${SIMULATIONS_PER_TRIAL} simulations per trial`
  );
  console.log(
    `Risk gate: EV > ${RISK_CONFIG.evMinThreshold}, Sharpe > ${RISK_CONFIG.sharpeLikeThreshold}, max tail loss < ${RISK_CONFIG.maxTailLossPercent}% notional`
  );
  console.log('Note: p01_pnl is the canonical 1st-percentile PnL. maxDrawdownEstimate remains as a compatibility alias.');
  console.log('');

  printSummary(results);
}

if (require.main === module) {
  main();
}
