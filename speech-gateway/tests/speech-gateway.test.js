const test = require('node:test');
const assert = require('node:assert/strict');
const { buildSpeechAwareResponse } = require('../dist/azure-speech.js');
const { getConfig, isAssistantConfigured, isSpeechConfigured } = require('../dist/config.js');

test('buildSpeechAwareResponse stays silent for text input mode', async () => {
  const result = await buildSpeechAwareResponse({
    text: 'hello',
    inputMode: 'text',
  });

  assert.deepEqual(result, {
    text: 'hello',
    inputMode: 'text',
    speak: false,
    provider: 'azure-speech',
  });
});

test('speech config remains false without Azure credentials', () => {
  assert.equal(isSpeechConfigured(getConfig()), false);
});

test('assistant config remains false without assistant endpoint', () => {
  assert.equal(isAssistantConfigured(getConfig()), false);
});
