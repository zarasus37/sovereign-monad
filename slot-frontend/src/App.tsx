import { useEffect, useState } from 'react';
import { SourceStatus } from './components/SourceStatus';
import { ApiStatus, SlotSourceConfig, SourceHealthSnapshot } from './types';
import { buildSnapshotFromConfig } from './utils/sourceState';

const API_URL = import.meta.env.VITE_SLOT_API_URL as string | undefined;
const CONFIG_URL =
  (import.meta.env.VITE_SLOT_SOURCE_CONFIG_URL as string | undefined) ||
  '/slot-source.sample.json';

function useSlotHealth(): {
  snapshot: SourceHealthSnapshot | null;
  status: ApiStatus;
  mode: 'api' | 'config' | 'none';
} {
  const [snapshot, setSnapshot] = useState<SourceHealthSnapshot | null>(null);
  const [status, setStatus] = useState<ApiStatus>('loading');
  const [mode, setMode] = useState<'api' | 'config' | 'none'>('none');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (API_URL) {
        setMode('api');
        try {
          const res = await fetch(`${API_URL}/slot/source-health`);
          if (!res.ok) {
            throw new Error(`slot API returned ${res.status}`);
          }

          const data = (await res.json()) as SourceHealthSnapshot;
          if (!cancelled) {
            setSnapshot(data);
            setStatus('ok');
          }
          return;
        } catch {
          if (!cancelled) {
            setStatus('error');
          }
          return;
        }
      }

      if (CONFIG_URL) {
        setMode('config');
        try {
          const res = await fetch(CONFIG_URL);
          if (!res.ok) {
            throw new Error(`slot config returned ${res.status}`);
          }

          const data = (await res.json()) as SlotSourceConfig;
          if (!cancelled) {
            setSnapshot(buildSnapshotFromConfig(data));
            setStatus('ok');
          }
          return;
        } catch {
          if (!cancelled) {
            setStatus('error');
          }
          return;
        }
      }

      if (!cancelled) {
        setMode('none');
        setStatus('unavailable');
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { snapshot, status, mode };
}

export default function App() {
  const { snapshot, status, mode } = useSlotHealth();

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, rgba(88,118,92,0.18), transparent 35%), #0b0f0d',
        color: '#e8e4d9',
        fontFamily: 'monospace',
      }}
    >
      <header
        style={{
          borderBottom: '1px solid #1e2a22',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontWeight: 700, letterSpacing: '0.1em', fontSize: '1rem' }}>
            SLOT CONTROL
          </span>
          <span style={{ opacity: 0.4, fontSize: '0.75rem' }}>Phase 1a</span>
        </div>
        <span style={{ opacity: 0.45, fontSize: '0.75rem' }}>
          mode: {mode === 'none' ? 'unavailable' : mode}
        </span>
      </header>

      <main style={{ padding: '1.5rem', maxWidth: '900px' }}>
        <section style={{ marginBottom: '2rem' }}>
          <h2
            style={{
              fontSize: '0.85rem',
              opacity: 0.5,
              marginBottom: '0.5rem',
              letterSpacing: '0.08em',
            }}
          >
            APPROVED SOURCE STATUS
          </h2>

          {status === 'unavailable' && (
            <div
              style={{
                background: '#141a16',
                border: '1px solid #1e2a22',
                borderRadius: '6px',
                padding: '1rem',
                fontSize: '0.8rem',
                opacity: 0.65,
              }}
            >
              No API or config source is configured.
            </div>
          )}

          {status === 'error' && (
            <div
              style={{
                background: '#1a1414',
                border: '1px solid #3a2222',
                borderRadius: '6px',
                padding: '1rem',
                fontSize: '0.8rem',
                color: '#d38a8a',
              }}
            >
              Failed to load slot source status from the configured data source.
            </div>
          )}

          {(status === 'ok' || status === 'loading') && (
            <div
              style={{
                background: '#141a16',
                border: '1px solid #1e2a22',
                borderRadius: '6px',
              }}
            >
              <SourceStatus snapshot={snapshot} />
            </div>
          )}
        </section>

        <section>
          <h2
            style={{
              fontSize: '0.85rem',
              opacity: 0.5,
              marginBottom: '0.5rem',
              letterSpacing: '0.08em',
            }}
          >
            DEPLOYMENT STATE
          </h2>
          <div
            style={{
              background: '#141a16',
              border: '1px solid #1e2a22',
              borderRadius: '6px',
              padding: '1rem',
              fontSize: '0.8rem',
            }}
          >
            <div style={{ marginBottom: '0.4rem' }}>
              <span style={{ opacity: 0.5 }}>Phase 1a contracts:</span>{' '}
              <span style={{ color: '#c8a84b' }}>
                reconstructed - live deploy paused on deployer funding
              </span>
            </div>
            <div style={{ marginBottom: '0.4rem' }}>
              <span style={{ opacity: 0.5 }}>Bootstrap source:</span>{' '}
              <span style={{ opacity: 0.7 }}>
                {snapshot?.sources.bootstrap.address ||
                  'wallet designated locally - materialize slot-source.json after on-chain registration'}
              </span>
            </div>
            <div>
              <span style={{ opacity: 0.5 }}>Stake-linked source:</span>{' '}
              <span style={{ opacity: 0.7 }}>
                {snapshot?.sources.stake.address || 'not deployed - do not invent'}
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
