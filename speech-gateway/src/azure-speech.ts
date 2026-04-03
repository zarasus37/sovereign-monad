import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { getConfig, isSpeechConfigured } from './config';
import {
  RespondRequest,
  RespondResponse,
  SynthesizeRequest,
  SynthesizeResponse,
  TranscribeRequest,
  TranscribeResponse,
} from './types';

function requireSpeechConfig() {
  const config = getConfig();
  if (!isSpeechConfigured(config)) {
    throw new Error('Azure Speech is not configured');
  }

  return config;
}

function createSpeechConfig(): sdk.SpeechConfig {
  const config = requireSpeechConfig();
  return sdk.SpeechConfig.fromSubscription(
    config.azureSpeechKey as string,
    config.azureSpeechRegion as string,
  );
}

function resolveOutputFormat(format: string): {
  sdkFormat: sdk.SpeechSynthesisOutputFormat;
  contentType: string;
} {
  switch (format) {
    case 'riff-16khz-16bit-mono-pcm':
      return {
        sdkFormat: sdk.SpeechSynthesisOutputFormat.Riff16Khz16BitMonoPcm,
        contentType: 'audio/wav',
      };
    case 'audio-24khz-48kbitrate-mono-mp3':
      return {
        sdkFormat: sdk.SpeechSynthesisOutputFormat.Audio24Khz48KBitRateMonoMp3,
        contentType: 'audio/mpeg',
      };
    case 'audio-16khz-32kbitrate-mono-mp3':
    default:
      return {
        sdkFormat: sdk.SpeechSynthesisOutputFormat.Audio16Khz32KBitRateMonoMp3,
        contentType: 'audio/mpeg',
      };
  }
}

export async function transcribeAudio(
  request: TranscribeRequest,
): Promise<TranscribeResponse> {
  const config = requireSpeechConfig();

  if (!request.audioBase64?.trim()) {
    throw new Error('audioBase64 is required');
  }

  const contentType = request.contentType || 'audio/wav';
  if (!contentType.toLowerCase().includes('wav')) {
    throw new Error('Only WAV audio is supported in this first-pass speech gateway');
  }

  const speechConfig = createSpeechConfig();
  speechConfig.speechRecognitionLanguage =
    request.language || config.recognitionLanguage;

  const audioBuffer = Buffer.from(request.audioBase64, 'base64');
  const audioConfig = sdk.AudioConfig.fromWavFileInput(audioBuffer);
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

  try {
    const result = await new Promise<sdk.SpeechRecognitionResult>((resolve, reject) => {
      recognizer.recognizeOnceAsync(resolve, reject);
    });

    if (result.reason !== sdk.ResultReason.RecognizedSpeech) {
      throw new Error(result.errorDetails || `Speech recognition failed: ${result.reason}`);
    }

    return {
      text: result.text,
      language: speechConfig.speechRecognitionLanguage,
      provider: 'azure-speech',
      inputMode: 'speech',
      reason: sdk.ResultReason[result.reason] || 'RecognizedSpeech',
    };
  } finally {
    recognizer.close();
  }
}

export async function synthesizeSpeech(
  request: SynthesizeRequest,
): Promise<SynthesizeResponse> {
  const config = requireSpeechConfig();

  if (!request.text?.trim()) {
    throw new Error('text is required');
  }

  const output = resolveOutputFormat(request.format || config.defaultTtsFormat);
  const speechConfig = createSpeechConfig();
  const voiceName = request.voiceName || config.defaultVoiceName;

  speechConfig.speechSynthesisVoiceName = voiceName;
  speechConfig.speechSynthesisOutputFormat = output.sdkFormat;

  const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

  try {
    const result = await new Promise<sdk.SpeechSynthesisResult>((resolve, reject) => {
      synthesizer.speakTextAsync(request.text, resolve, reject);
    });

    if (result.reason !== sdk.ResultReason.SynthesizingAudioCompleted) {
      throw new Error(result.errorDetails || `Speech synthesis failed: ${result.reason}`);
    }

    return {
      provider: 'azure-speech',
      voiceName,
      contentType: output.contentType,
      audioBase64: Buffer.from(result.audioData).toString('base64'),
    };
  } finally {
    synthesizer.close();
  }
}

export async function buildSpeechAwareResponse(
  request: RespondRequest,
): Promise<RespondResponse> {
  if (!request.text?.trim()) {
    throw new Error('text is required');
  }

  if (request.inputMode === 'text') {
    return {
      text: request.text,
      inputMode: request.inputMode,
      speak: false,
      provider: 'azure-speech',
    };
  }

  const synthesized = await synthesizeSpeech({
    text: request.text,
    voiceName: request.voiceName,
    format: request.format,
  });

  return {
    text: request.text,
    inputMode: request.inputMode,
    speak: true,
    provider: 'azure-speech',
    voiceName: synthesized.voiceName,
    contentType: synthesized.contentType,
    audioBase64: synthesized.audioBase64,
  };
}
