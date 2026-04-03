import { getConfig, isAssistantConfigured } from './config';

function extractText(payload: unknown, field: string): string | null {
  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  const direct = candidate[field];
  if (typeof direct === 'string' && direct.trim()) {
    return direct;
  }

  const fallbackFields = ['response', 'reply', 'message', 'output'];
  for (const key of fallbackFields) {
    const value = candidate[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }

  return null;
}

export async function requestAssistantText(text: string, inputMode: 'speech' | 'text'): Promise<string> {
  const config = getConfig();
  if (!isAssistantConfigured(config)) {
    throw new Error('Assistant endpoint is not configured');
  }

  const response = await fetch(config.assistantTextEndpoint as string, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      [config.assistantTextField]: text,
      inputMode,
    }),
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(
      `Assistant endpoint returned ${response.status}: ${
        typeof payload === 'string' ? payload : JSON.stringify(payload)
      }`,
    );
  }

  const extracted = extractText(payload, config.assistantResponseField);
  if (!extracted) {
    throw new Error('Assistant response did not contain a usable text field');
  }

  return extracted;
}
