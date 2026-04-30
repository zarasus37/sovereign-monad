import { deriveState, validateSourceConfig } from '../src/source-state';
import { GameFiSourceConfig } from '../src/types';

function buildConfig(overrides: Partial<GameFiSourceConfig> = {}): GameFiSourceConfig {
  return {
    sources: {
      bootstrap: {
        address: '0x1111111111111111111111111111111111111111',
        label: 'Bootstrap',
        active: true,
      },
      stake: {
        address: null,
        label: 'Stake',
        active: false,
      },
    },
    cutover: {
      revokeBootstrapOnCutover: false,
    },
    ...overrides,
  };
}

describe('deriveState', () => {
  test('returns BOOTSTRAP_ONLY when only bootstrap is active', () => {
    expect(deriveState(buildConfig())).toBe('BOOTSTRAP_ONLY');
  });

  test('returns CUTOVER_PENDING when both sources are active', () => {
    expect(
      deriveState({
        ...buildConfig(),
        sources: {
          bootstrap: {
            address: '0x1111111111111111111111111111111111111111',
            label: 'Bootstrap',
            active: true,
          },
          stake: {
            address: '0x2222222222222222222222222222222222222222',
            label: 'Stake',
            active: true,
          },
        },
      }),
    ).toBe('CUTOVER_PENDING');
  });

  test('returns STAKE_ACTIVE when only Stake source is active', () => {
    expect(
      deriveState({
        ...buildConfig(),
        sources: {
          bootstrap: {
            address: '0x1111111111111111111111111111111111111111',
            label: 'Bootstrap',
            active: false,
          },
          stake: {
            address: '0x2222222222222222222222222222222222222222',
            label: 'Stake',
            active: true,
          },
        },
      }),
    ).toBe('STAKE_ACTIVE');
  });
});

describe('validateSourceConfig', () => {
  test('accepts the baseline bootstrap-only config', () => {
    expect(validateSourceConfig(buildConfig())).toEqual([]);
  });

  test('rejects active Stake source without a real address', () => {
    const errors = validateSourceConfig({
      ...buildConfig(),
      sources: {
        bootstrap: {
          address: '0x1111111111111111111111111111111111111111',
          label: 'Bootstrap',
          active: true,
        },
        stake: {
          address: null,
          label: 'Stake',
          active: true,
        },
      },
    });

    expect(errors).toContain(
      'config.sources.stake.address must be a valid 0x address when active=true. Do not set active=true until the Stake-linked source is real.',
    );
  });
});
