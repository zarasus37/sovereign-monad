import express, { NextFunction, Request, Response } from 'express';
import pino from 'pino';
import { getConfig } from './config';
import { SharedStateError, loadEcosystemState } from './state';

const config = getConfig();
const logger = pino({ level: config.logLevel });
const app = express();

app.use((req: Request, _res: Response, next: NextFunction) => {
  logger.info({ method: req.method, url: req.url }, 'request');
  next();
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true, service: 'ecosystem-state-api' });
});

app.get('/ecosystem/state', (_req: Request, res: Response) => {
  try {
    const snapshot = loadEcosystemState(config.packageRoot, config.runtimeConfigPath);
    res.json(snapshot);
  } catch (err) {
    if (err instanceof SharedStateError) {
      logger.error({ err, code: err.code }, 'Failed to build ecosystem state snapshot');
      res.status(err.statusCode).json({
        error: err.code,
        message: err.message,
        details: err.details,
        localAnalysisOnly: true,
      });
      return;
    }

    logger.error({ err }, 'Unexpected ecosystem state failure');
    res.status(500).json({
      error: 'internal_error',
      message: 'Unexpected ecosystem state failure.',
      localAnalysisOnly: true,
    });
  }
});

app.get('/ecosystem/state/summary', (_req: Request, res: Response) => {
  try {
    const snapshot = loadEcosystemState(config.packageRoot, config.runtimeConfigPath);
    res.json(snapshot.summary);
  } catch (err) {
    if (err instanceof SharedStateError) {
      logger.error({ err, code: err.code }, 'Failed to build ecosystem summary');
      res.status(err.statusCode).json({
        error: err.code,
        message: err.message,
        details: err.details,
        localAnalysisOnly: true,
      });
      return;
    }

    logger.error({ err }, 'Unexpected ecosystem summary failure');
    res.status(500).json({
      error: 'internal_error',
      message: 'Unexpected ecosystem summary failure.',
      localAnalysisOnly: true,
    });
  }
});

app.listen(config.port, () => {
  logger.info(
    { port: config.port, runtimeConfigPath: config.runtimeConfigPath },
    'ecosystem-state-api listening',
  );
});

export default app;
