const test = require('node:test');
const assert = require('node:assert/strict');
const {
  deriveState,
  validateSourceConfig,
} = require('../dist/source-state.js');

function makeConfig(overrides = {}) {
  return {
    sources: {
      bootstrap: {
        address: '0xd730b17EC7237cdf9707105D453166308B35383a',
        label: 'Bootstrap Revenue Source',
        active: true,
      },
      stake: {
        address: null,
        label: 'Stake-Linked Revenue Source',
        active: false,
      },
    },
    cutover: {
      revokeBootstrapOnCutover: false,
    },
    ...overrides,
  };
}

test('deriveState reports BOOTSTRAP_ONLY for bootstrap-only config', () => {
  assert.equal(deriveState(makeConfig()), 'BOOTSTRAP_ONLY');
});

test('deriveState reports CUTOVER_PENDING when both sources are active', () => {
  const config = makeConfig({
    sources: {
      bootstrap: {
        address: '0xd730b17EC7237cdf9707105D453166308B35383a',
        label: 'Bootstrap Revenue Source',
        active: true,
      },
      stake: {
        address: '0x1111111111111111111111111111111111111111',
        label: 'Stake-Linked Revenue Source',
        active: true,
      },
    },
  });

  assert.equal(deriveState(config), 'CUTOVER_PENDING');
});

test('validateSourceConfig rejects active stake entries without a real address', () => {
  const config = makeConfig({
    sources: {
      bootstrap: {
        address: '0xd730b17EC7237cdf9707105D453166308B35383a',
        label: 'Bootstrap Revenue Source',
        active: true,
      },
      stake: {
        address: null,
        label: 'Stake-Linked Revenue Source',
        active: true,
      },
    },
  });

  const errors = validateSourceConfig(config);
  assert.ok(errors.some((error) => error.includes('stake.address must be a valid 0x address')));
});
