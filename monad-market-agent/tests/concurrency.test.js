const test = require('node:test');
const assert = require('node:assert/strict');

const { mapWithConcurrency } = require('../dist/utils/concurrency.js');

test('mapWithConcurrency preserves order', async () => {
  const result = await mapWithConcurrency([1, 2, 3], 1, async (value) => value * 2);
  assert.deepEqual(result, [2, 4, 6]);
});

test('mapWithConcurrency rejects invalid concurrency', async () => {
  await assert.rejects(
    () => mapWithConcurrency([1], 0, async (value) => value),
    /concurrency must be at least 1/
  );
});
