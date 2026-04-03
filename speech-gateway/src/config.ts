import dotenv from 'dotenv';
import { SpeechGatewayConfig } from './types';

dotenv.config();

let configInstance: SpeechGatewayConfig | null = null;

export function getConfig(): SpeechGatewayConfig {
  if (configInstance) {
    return configInstance;
  }

  configInstance = {
    port: parseInt(process.env.PORT || '4030', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
    azureSpeechKey: process.env.AZURE_SPEECH_KEY,
    azureSpeechRegion: process.env.AZURE_SPEECH_REGION,
    recognitionLanguage: process.env.AZURE_SPEECH_RECOGNITION_LANGUAGE || 'en-US',
    defaultVoiceName: process.env.AZURE_SPEECH_VOICE_NAME || 'en-US-JennyNeural',
    defaultTtsFormat:
      process.env.AZURE_SPEECH_TTS_FORMAT || 'audio-16khz-32kbitrate-mono-mp3',
    assistantTextEndpoint: process.env.ASSISTANT_TEXT_ENDPOINT,
    assistantTextField: process.env.ASSISTANT_TEXT_FIELD || 'text',
    assistantResponseField: process.env.ASSISTANT_RESPONSE_FIELD || 'text',
  };

  return configInstance;
}

export function isSpeechConfigured(config: SpeechGatewayConfig = getConfig()): boolean {
  return Boolean(config.azureSpeechKey && config.azureSpeechRegion);
}

export function isAssistantConfigured(config: SpeechGatewayConfig = getConfig()): boolean {
  return Boolean(config.assistantTextEndpoint);
}
