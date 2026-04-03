const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildEndpointList,
  isRateLimitError,
  normalizeRpcUrl,
} = require('../dist/adapters/rpc-utils.js');

test('normalizeRpcUrl trims whitespace and trailing slashes', () => {
  assert.equal(normalizeRpcUrl(' wss://example.com/// '), 'wss://example.com');
});

test('buildEndpointList deduplicates normalized endpoints', () => {
  const endpoints = buildEndpointList('wss://one.example/', [
    'wss://two.example/',
    'wss://one.example',
    '   ',
  ]);

  assert.deepEqual(endpoints, ['wss://one.example', 'wss://two.example']);
});

test('isRateLimitError detects common provider limit failures', () => {
  assert.equal(isRateLimitError({ code: 429, message: 'Too Many Requests' }), true);
  assert.equal(isRateLimitError({ error: { code: -32003 }, message: 'daily request limit exceeded' }), true);
  assert.equal(isRateLimitError({ message: 'socket closed normally' }), false);
});
