import express, { Request, Response } from 'express';
import pino from 'pino';
import path from 'path';
import { buildSpeechAwareResponse, synthesizeSpeech, transcribeAudio } from './azure-speech';
import { requestAssistantText } from './assistant-adapter';
import { getConfig, isAssistantConfigured, isSpeechConfigured } from './config';
import {
  AssistantTurnRequest,
  HealthResponse,
  RespondRequest,
  SynthesizeRequest,
  TranscribeRequest,
} from './types';

const config = getConfig();
const logger = pino({ level: config.logLevel }).child({ service: 'speech-gateway' });
const app = express();
const publicDir = path.resolve(__dirname, '..', 'public');

app.use(express.json({ limit: '25mb' }));
app.use(express.static(publicDir));

app.get('/', (_req: Request, res: Response) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/health', (_req: Request, res: Response<HealthResponse>) => {
  res.json({
    ok: true,
    service: 'speech-gateway',
    configured: isSpeechConfigured(config),
    provider: 'azure-speech',
    assistantConfigured: isAssistantConfigured(config),
  });
});

function ensureConfigured(res: Response): boolean {
  if (isSpeechConfigured(config)) {
    return true;
  }

  res.status(503).json({
    error: 'Azure Speech is not configured',
    provider: 'azure-speech',
  });
  return false;
}

app.post('/speech/transcribe', async (req: Request<{}, {}, TranscribeRequest>, res: Response) => {
  if (!ensureConfigured(res)) {
    return;
  }

  try {
    const result = await transcribeAudio(req.body);
    res.json(result);
  } catch (error) {
    logger.warn({ err: error instanceof Error ? error.message : String(error) }, 'Transcription failed');
    res.status(400).json({ error: error instanceof Error ? error.message : 'Transcription failed' });
  }
});

app.post('/speech/synthesize', async (req: Request<{}, {}, SynthesizeRequest>, res: Response) => {
  if (!ensureConfigured(res)) {
    return;
  }

  try {
    const result = await synthesizeSpeech(req.body);
    res.json(result);
  } catch (error) {
    logger.warn({ err: error instanceof Error ? error.message : String(error) }, 'Synthesis failed');
    res.status(400).json({ error: error instanceof Error ? error.message : 'Synthesis failed' });
  }
});

app.post('/speech/respond', async (req: Request<{}, {}, RespondRequest>, res: Response) => {
  if (req.body.inputMode === 'speech' && !ensureConfigured(res)) {
    return;
  }

  try {
    const result = await buildSpeechAwareResponse(req.body);
    res.json(result);
  } catch (error) {
    logger.warn({ err: error instanceof Error ? error.message : String(error) }, 'Speech-aware response failed');
    res.status(400).json({ error: error instanceof Error ? error.message : 'Speech-aware response failed' });
  }
});

app.post('/speech/assistant-turn', async (req: Request<{}, {}, AssistantTurnRequest>, res: Response) => {
  if (req.body.inputMode === 'speech' && !ensureConfigured(res)) {
    return;
  }

  if (!isAssistantConfigured(config)) {
    res.status(503).json({ error: 'Assistant endpoint is not configured' });
    return;
  }

  try {
    const assistantText = await requestAssistantText(req.body.text, req.body.inputMode);
    const result = await buildSpeechAwareResponse({
      text: assistantText,
      inputMode: req.body.inputMode,
      voiceName: req.body.voiceName,
      format: req.body.format,
    });

    res.json({
      userText: req.body.text,
      ...result,
    });
  } catch (error) {
    logger.warn(
      { err: error instanceof Error ? error.message : String(error) },
      'Assistant turn failed',
    );
    res.status(400).json({ error: error instanceof Error ? error.message : 'Assistant turn failed' });
  }
});

app.listen(config.port, () => {
  logger.info(
    { port: config.port, configured: isSpeechConfigured(config) },
    'speech-gateway listening',
  );
});
