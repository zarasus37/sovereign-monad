import express, { NextFunction, Request, Response } from 'express';
import pino from 'pino';
import { getConfig } from './config';
import { deriveState, loadSourceConfig, validateSourceConfig } from './source-state';
import { SourceHealthResponse } from './types';

const config = getConfig();
const logger = pino({ level: config.logLevel });
const app = express();

// Minimal request logger avoids taking on a pino-http dependency.
app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info({ method: req.method, url: req.url }, 'request');
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'slot-api' });
});

app.get('/slot/source-health', (_req: Request, res: Response) => {
  let sourceConfig;

  try {
    sourceConfig = loadSourceConfig(config.sourceConfigPath);
  } catch (err) {
    logger.error({ err, path: config.sourceConfigPath }, 'Failed to parse slot source config');
    res.status(503).json({
      error: 'slot_config_parse_error',
      message: 'Slot source config exists but could not be parsed.',
      configPath: config.sourceConfigPath,
      configDriven: true,
    });
    return;
  }

  if (!sourceConfig) {
    res.status(503).json({
      error: 'slot_config_missing',
      message:
        'Slot source config file not found. ' +
        'Copy slot-core/config/slot-source.example.json and fill in real values. ' +
        'Do not set stake.active=true until the Stake-linked source exists on-chain.',
      configPath: config.sourceConfigPath,
      configDriven: true,
    });
    return;
  }

  const validationErrors = validateSourceConfig(sourceConfig);
  if (validationErrors.length > 0) {
    logger.error(
      { errors: validationErrors, path: config.sourceConfigPath },
      'Slot source config failed validation',
    );
    res.status(503).json({
      error: 'slot_config_invalid',
      message: 'Slot source config exists but failed validation.',
      validationErrors,
      configPath: config.sourceConfigPath,
      configDriven: true,
    });
    return;
  }

  const state = deriveState(sourceConfig);
  const response: SourceHealthResponse = {
    eventId: 'config-derived',
    eventType: 'SlotSourceHealth',
    timestampMs: Date.now(),
    state,
    sources: {
      bootstrap: sourceConfig.sources.bootstrap,
      stake: sourceConfig.sources.stake,
    },
    configDriven: true,
    note:
      'Source state derived from local config file. ' +
      'This is not an on-chain read. ' +
      'On-chain source registration is managed by sovereign-monad/scripts/slot-source-handoff.js. ' +
      'Update the config file after running the handoff script.',
  };

  res.json(response);
});

app.listen(config.port, () => {
  logger.info(
    { port: config.port, sourceConfigPath: config.sourceConfigPath },
    'slot-api listening',
  );
});

export default app;
