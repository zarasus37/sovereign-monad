/**
 * Sovereign MEV Engine — RGE v2 API
 * Cloudflare Worker implementation
 * Canonical per MOF v2.3.0
 *
 * Endpoints:
 *   GET  /health   — no auth required
 *   GET  /config   — returns engine params + client info
 *   POST /evaluate — evaluate a spread opportunity
 */

// ─── TIER DEFINITIONS ───────────────────────────────────────────────────────
const TIERS = {
  starter:    { dailyLimit: 1_000,  aumCapUsd: 5_000_000 },
  pro:        { dailyLimit: 10_000, aumCapUsd: 25_000_000 },
  fund:       { dailyLimit: null,   aumCapUsd: 100_000_000 },
  enterprise: { dailyLimit: null,   aumCapUsd: null },
};

// ─── RGE v2 CANONICAL CONSTANTS (MOF v2.3.0) ────────────────────────────────
const RHO                    = 0.70;   // chain-pair correlation (Cholesky)
const BRIDGE_FAILURE_RATE    = 0.001;  // 0.1% per execution
const BRIDGE_LATENCY_MEDIAN  = 15;     // seconds (log-normal median)
const BRIDGE_LATENCY_P95     = 30;     // seconds (log-normal p95)
const MC_RUNS                = 1_000;  // Monte Carlo simulations per call
const MIN_EFF_SPREAD_BPS     = 20;     // minimum effective spread gate
const FIXED_COST             = 0.0015; // 15 bps execution + gas cost
const KELLY_FRACTION         = 0.25;   // 25% of full Kelly
const MAX_TRADE_PCT          = 0.10;   // 10% portfolio cap per trade
const EV_GATE_USD            = 10;     // minimum expected value ($)
const SHARPE_GATE            = 0.30;   // minimum Sharpe-like score
const TAIL_LOSS_GATE         = 0.30;   // maximum tail-loss fraction (P5)

// ─── MATH PRIMITIVES ────────────────────────────────────────────────────────

/** Box-Muller transform — standard normal sample */
function standardNormal() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Log-normal bridge latency sampler.
 * median=15s, p95=30s → mu=ln(15), sigma=(ln(30)−ln(15))/1.645
 * Returns latency in seconds.
 */
function sampleBridgeLatency() {
  const mu    = Math.log(BRIDGE_LATENCY_MEDIAN);
  const sigma = (Math.log(BRIDGE_LATENCY_P95) - Math.log(BRIDGE_LATENCY_MEDIAN)) / 1.645;
  return Math.exp(mu + sigma * standardNormal());
}

// ─── RGE v2 CORE ────────────────────────────────────────────────────────────

/**
 * Evaluate a spread opportunity through the full RGE v2 pipeline:
 *   1. Effective spread computation
 *   2. Fractional Kelly sizing
 *   3. Monte Carlo (1,000 correlated GBM paths)
 *   4. Decision gate
 *
 * @param {object} p
 * @param {number} p.spreadBps        Raw spread in basis points
 * @param {number} p.vol              Annualised asset volatility (e.g. 0.80 = 80%)
 * @param {number} p.portfolioUsd     Total portfolio value in USD
 * @param {number} [p.bridgeWindowSec] Bridge window override (default: 15s median)
 */
function evaluateOpportunity({ spreadBps, vol, portfolioUsd, bridgeWindowSec }) {
  const t = (bridgeWindowSec ?? BRIDGE_LATENCY_MEDIAN) / 3600; // hours

  // ── Step 1: Effective spread ──────────────────────────────────────────────
  // effectiveSpread = rawSpread − vol×√t − 0.5×(vol×√t)² − 0.0015
  const volSqrtT          = vol * Math.sqrt(t);
  const effectiveRaw      = (spreadBps / 10_000) - volSqrtT - 0.5 * volSqrtT ** 2 - FIXED_COST;
  const effectiveSpreadBps = effectiveRaw * 10_000;

  if (effectiveSpreadBps < MIN_EFF_SPREAD_BPS) {
    return {
      decision: 'REJECT',
      reason: 'effective_spread_below_threshold',
      effectiveSpreadBps: +effectiveSpreadBps.toFixed(2),
      threshold: MIN_EFF_SPREAD_BPS,
      monteCarloRuns: 0,
    };
  }

  // ── Step 2: Fractional Kelly sizing ──────────────────────────────────────
  // kellyFrac = (edge / variance) × 0.25
  // size = min(portfolio × kellyFrac, portfolio × 10%)
  const edge      = effectiveRaw;
  const variance  = vol ** 2 * t;
  const kellyFull = variance > 0 ? edge / variance : 0;
  const kellyFrac = Math.max(kellyFull * KELLY_FRACTION, 0);
  const sizeUsd   = Math.min(portfolioUsd * kellyFrac, portfolioUsd * MAX_TRADE_PCT);

  if (sizeUsd <= 0) {
    return {
      decision: 'REJECT',
      reason: 'zero_kelly_size',
      effectiveSpreadBps: +effectiveSpreadBps.toFixed(2),
      kellyFraction: 0,
      monteCarloRuns: 0,
    };
  }

  // ── Step 3: Monte Carlo ───────────────────────────────────────────────────
  // Correlated GBM via Cholesky decomposition (ρ = 0.70)
  // L = [[1, 0], [ρ, √(1−ρ²)]]
  const sqrtOneMinusRhoSq = Math.sqrt(1 - RHO ** 2);
  const pvs = new Float64Array(MC_RUNS);

  for (let i = 0; i < MC_RUNS; i++) {
    // Bridge failure (0.1%)
    if (Math.random() < BRIDGE_FAILURE_RATE) {
      pvs[i] = -sizeUsd * 0.02; // partial loss on failed bridge
      continue;
    }

    // Correlated standard normals
    const z1 = standardNormal();
    const z2 = standardNormal();
    const w1 = z1;
    const w2 = RHO * z1 + sqrtOneMinusRhoSq * z2;

    // Sample bridge latency and derive simulation window
    const latencySec = sampleBridgeLatency();
    const tSim       = latencySec / 3600;

    // Price return shocks
    const dP1 = vol * Math.sqrt(tSim) * w1;
    const dP2 = vol * Math.sqrt(tSim) * w2;

    // Spread erosion = divergence between the two chains during transit
    const erosion = Math.abs(dP1 - dP2);

    // P&L on this path
    pvs[i] = sizeUsd * (edge - erosion - FIXED_COST);
  }

  // ── Step 4: Statistics ────────────────────────────────────────────────────
  let sum = 0;
  for (let i = 0; i < MC_RUNS; i++) sum += pvs[i];
  const evMean = sum / MC_RUNS;

  let varSum = 0;
  for (let i = 0; i < MC_RUNS; i++) varSum += (pvs[i] - evMean) ** 2;
  const stdDev    = Math.sqrt(varSum / MC_RUNS);
  const sharpeLike = stdDev > 0 ? evMean / stdDev : 0;

  // Tail loss: P5 of the distribution (worst 5%)
  const sorted      = Array.from(pvs).sort((a, b) => a - b);
  const tailLossP95 = sorted[Math.floor(MC_RUNS * 0.05)]; // negative = loss
  const tailLossPct = sizeUsd > 0 ? Math.abs(Math.min(tailLossP95, 0)) / sizeUsd : 0;

  // ── Decision gate ─────────────────────────────────────────────────────────
  const evPassed    = evMean    >= EV_GATE_USD;
  const sharpePassed = sharpeLike >= SHARPE_GATE;
  const tailPassed  = tailLossPct <= TAIL_LOSS_GATE;
  const decision    = (evPassed && sharpePassed && tailPassed) ? 'APPROVE' : 'REJECT';

  return {
    decision,
    effectiveSpreadBps:  +effectiveSpreadBps.toFixed(2),
    kellyFraction:       +kellyFrac.toFixed(4),
    recommendedSizeUsd:  +sizeUsd.toFixed(2),
    expectedValueUsd:    +evMean.toFixed(2),
    sharpeLike:          +sharpeLike.toFixed(4),
    tailLossP95Usd:      +tailLossP95.toFixed(2),
    tailLossPct:         +tailLossPct.toFixed(4),
    bridgeFailureAdjusted: true,
    monteCarloRuns:      MC_RUNS,
    decisionGate: { evPassed, sharpePassed, tailPassed },
  };
}

// ─── REQUEST HANDLER ────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    const method = request.method;

    // Preflight
    if (method === 'OPTIONS') return new Response(null, { headers: CORS });

    // ── GET /health ─────────────────────────────────────────────────────────
    if (pathname === '/health' && method === 'GET') {
      return json({
        status:    'ok',
        engine:    'RGE v2',
        mofVersion: '2.3.0',
        timestamp: new Date().toISOString(),
      });
    }

    // ── API key auth ────────────────────────────────────────────────────────
    const apiKey = request.headers.get('x-api-key');
    if (!apiKey) return json({ error: 'missing_api_key' }, 401);

    const clientRaw = await env.SOVEREIGN_API_KEYS.get(apiKey);
    if (!clientRaw) return json({ error: 'invalid_api_key' }, 401);

    let client;
    try { client = JSON.parse(clientRaw); }
    catch { return json({ error: 'key_data_corrupt' }, 500); }

    const tier = TIERS[client.tier];
    if (!tier) return json({ error: 'unknown_tier' }, 500);

    // ── Daily rate limiting ─────────────────────────────────────────────────
    let callsRemainingToday = null;
    if (tier.dailyLimit !== null) {
      const today  = new Date().toISOString().slice(0, 10);
      const rlKey  = `rl:${apiKey}:${today}`;
      const raw    = await env.SOVEREIGN_API_KEYS.get(rlKey);
      const count  = raw ? parseInt(raw, 10) : 0;

      if (count >= tier.dailyLimit) {
        return json({
          error:       'rate_limit_exceeded',
          tier:        client.tier,
          dailyLimit:  tier.dailyLimit,
          resetsAt:    `${today}T24:00:00Z`,
        }, 429);
      }

      const secsUntilMidnight = 86_400 - Math.floor((Date.now() / 1_000) % 86_400);
      env.SOVEREIGN_API_KEYS.put(rlKey, String(count + 1), {
        expirationTtl: secsUntilMidnight + 60,
      });
      callsRemainingToday = tier.dailyLimit - count - 1;
    }

    // ── GET /config ─────────────────────────────────────────────────────────
    if (pathname === '/config' && method === 'GET') {
      return json({
        engine: 'RGE v2',
        mofVersion: '2.3.0',
        parameters: {
          minEffectiveSpreadBps: MIN_EFF_SPREAD_BPS,
          kellyFraction:         KELLY_FRACTION,
          maxTradePct:           MAX_TRADE_PCT,
          bridgeFailureRate:     BRIDGE_FAILURE_RATE,
          correlation:           RHO,
          monteCarloRuns:        MC_RUNS,
          fixedCostBps:          FIXED_COST * 10_000,
          decisionGate: {
            evMeanUsd:   EV_GATE_USD,
            sharpeLike:  SHARPE_GATE,
            tailLossPct: TAIL_LOSS_GATE,
          },
        },
        client: {
          clientName:         client.clientName,
          tier:               client.tier,
          aumCapUsd:          tier.aumCapUsd,
          dailyCallLimit:     tier.dailyLimit,
          callsRemainingToday,
        },
      });
    }

    // ── POST /evaluate ──────────────────────────────────────────────────────
    if (pathname === '/evaluate' && method === 'POST') {
      let body;
      try { body = await request.json(); }
      catch { return json({ error: 'invalid_json_body' }, 400); }

      const { spreadBps, vol, portfolioUsd, aumUsd, bridgeWindowSec } = body;

      if (typeof spreadBps !== 'number' || !isFinite(spreadBps))
        return json({ error: 'spreadBps must be a finite number' }, 400);
      if (typeof vol !== 'number' || vol <= 0 || !isFinite(vol))
        return json({ error: 'vol must be a positive finite number (annualised, e.g. 0.80)' }, 400);
      if (typeof portfolioUsd !== 'number' || portfolioUsd <= 0)
        return json({ error: 'portfolioUsd must be a positive number' }, 400);

      // AUM cap enforcement
      if (tier.aumCapUsd !== null && typeof aumUsd === 'number' && aumUsd > tier.aumCapUsd) {
        return json({ error: 'aum_cap_exceeded', tierAumCapUsd: tier.aumCapUsd }, 403);
      }

      const result = evaluateOpportunity({ spreadBps, vol, portfolioUsd, bridgeWindowSec });
      return json({ ...result, callsRemainingToday });
    }

    return json({ error: 'not_found', hint: 'Valid endpoints: GET /health, GET /config, POST /evaluate' }, 404);
  },
};
