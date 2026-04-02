import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getRuntimeConfig, publicThresholdConfig } from './config';
import { evaluateSnapshot, EvaluateRequestBody } from './evaluator';
import { ApiKeyRecord, ApiKeyStore, DailyRateLimiter } from './keystore';

dotenv.config();

type AuthedRequest = Request & {
  apiClient?: ApiKeyRecord;
  rateLimitRemaining?: number | null;
};

const app = express();
const config = getRuntimeConfig();
const keyStore = new ApiKeyStore(config.keyStorePath);
const rateLimiter = new DailyRateLimiter();

app.use(cors());
app.use(express.json());

function requireApiKey(req: AuthedRequest, res: Response, next: NextFunction) {
  const apiKey = req.header('x-api-key');

  if (!apiKey) {
    return res.status(401).json({ error: 'missing_api_key' });
  }

  const record = keyStore.getByKey(apiKey);

  if (!record) {
    return res.status(401).json({ error: 'invalid_api_key' });
  }

  const usage = rateLimiter.consume(record.key, record.dailyCallLimit);

  if (!usage.allowed) {
    return res.status(429).json({
      error: 'rate_limit_exceeded',
      tier: record.tier,
      dailyCallLimit: record.dailyCallLimit,
    });
  }

  req.apiClient = record;
  req.rateLimitRemaining = usage.remaining;
  return next();
}

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    keyCount: keyStore.count(),
  });
});

app.get('/config', requireApiKey, (req: AuthedRequest, res: Response) => {
  const client = req.apiClient as ApiKeyRecord;

  return res.json({
    thresholds: publicThresholdConfig(),
    client: {
      clientName: client.clientName,
      tier: client.tier,
      aumCapUsd: client.aumCapUsd,
      dailyCallLimit: client.dailyCallLimit,
      callsRemainingToday: req.rateLimitRemaining,
    },
  });
});

app.post('/evaluate', requireApiKey, (req: AuthedRequest, res: Response) => {
  const client = req.apiClient as ApiKeyRecord;
  const body = req.body as Partial<EvaluateRequestBody>;

  if (typeof body.spreadBps !== 'number' || !Number.isFinite(body.spreadBps)) {
    return res.status(400).json({ error: 'spreadBps must be a finite number' });
  }

  if (body.direction !== 'buy_M_sell_E' && body.direction !== 'buy_E_sell_M') {
    return res.status(400).json({ error: 'direction must be buy_M_sell_E or buy_E_sell_M' });
  }

  if (body.clientAumUsd !== undefined && body.clientAumUsd > client.aumCapUsd) {
    return res.status(403).json({
      error: 'aum_cap_exceeded',
      clientAumUsd: body.clientAumUsd,
      aumCapUsd: client.aumCapUsd,
      tier: client.tier,
    });
  }

  const result = evaluateSnapshot({
    direction: body.direction,
    spreadBps: body.spreadBps,
    bridgeDelaySec: body.bridgeDelaySec,
    sizeSuggestionUsd: body.sizeSuggestionUsd,
    clientAumUsd: body.clientAumUsd,
    mode: body.mode,
  });

  return res.json({
    approved: result.approved,
    ev: result.ev,
    sharpeLike: result.sharpeLike,
    kellySizeUsd: result.kellySizeUsd,
    effectiveSpreadBps: result.effectiveSpreadBps,
    cappedSizeUsd: result.cappedSizeUsd,
    mode: result.mode,
    client: {
      clientName: client.clientName,
      tier: client.tier,
      aumCapUsd: client.aumCapUsd,
      callsRemainingToday: req.rateLimitRemaining,
    },
  });
});

app.listen(config.port, () => {
  console.log(`Trading API running on port ${config.port}`);
});
