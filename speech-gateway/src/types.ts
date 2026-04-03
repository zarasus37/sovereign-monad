export type InputMode = 'speech' | 'text';

export interface SpeechGatewayConfig {
  port: number;
  logLevel: string;
  azureSpeechKey?: string;
  azureSpeechRegion?: string;
  recognitionLanguage: string;
  defaultVoiceName: string;
  defaultTtsFormat: string;
  assistantTextEndpoint?: string;
  assistantTextField: string;
  assistantResponseField: string;
}

export interface HealthResponse {
  ok: true;
  service: 'speech-gateway';
  configured: boolean;
  provider: 'azure-speech';
  assistantConfigured: boolean;
}

export interface TranscribeRequest {
  audioBase64: string;
  contentType?: string;
  language?: string;
}

export interface TranscribeResponse {
  text: string;
  language: string;
  provider: 'azure-speech';
  inputMode: 'speech';
  reason: string;
}

export interface SynthesizeRequest {
  text: string;
  voiceName?: string;
  format?: string;
}

export interface SynthesizeResponse {
  provider: 'azure-speech';
  voiceName: string;
  contentType: string;
  audioBase64: string;
}

export interface RespondRequest {
  text: string;
  inputMode: InputMode;
  voiceName?: string;
  format?: string;
}

export interface RespondResponse {
  text: string;
  inputMode: InputMode;
  speak: boolean;
  provider: 'azure-speech';
  voiceName?: string;
  contentType?: string;
  audioBase64?: string;
}

export interface AssistantTurnRequest {
  text: string;
  inputMode: InputMode;
  voiceName?: string;
  format?: string;
}

export interface AssistantTurnResponse extends RespondResponse {
  userText: string;
}
