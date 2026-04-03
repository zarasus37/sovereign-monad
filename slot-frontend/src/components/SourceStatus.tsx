import { SourceHealthSnapshot, SourceLifecycleState } from '../types';

interface Props {
  snapshot: SourceHealthSnapshot | null;
}

const STATE_LABELS: Record<SourceLifecycleState, string> = {
  BOOTSTRAP_ONLY: 'Bootstrap Only',
  CUTOVER_PENDING: 'Cutover Pending',
  STAKE_ACTIVE: 'Stake Active',
  UNCONFIGURED: 'Unconfigured',
};

const STATE_COLORS: Record<SourceLifecycleState, string> = {
  BOOTSTRAP_ONLY: '#c8a84b',
  CUTOVER_PENDING: '#4b8fc8',
  STAKE_ACTIVE: '#4bc86a',
  UNCONFIGURED: '#c84b4b',
};

function AddressCell({ address }: { address: string | null }) {
  if (!address) {
    return <span style={{ opacity: 0.4 }}>not set</span>;
  }

  return <code style={{ fontSize: '0.8em', wordBreak: 'break-all' }}>{address}</code>;
}

export function SourceStatus({ snapshot }: Props) {
  if (!snapshot) {
    return (
      <div style={{ opacity: 0.5, padding: '1rem' }}>
        No source data available. Waiting for slot source status.
      </div>
    );
  }

  const color = STATE_COLORS[snapshot.state];

  return (
    <div style={{ fontFamily: 'monospace', padding: '1rem' }}>
      <div style={{ marginBottom: '0.75rem' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            borderRadius: '4px',
            background: color,
            color: '#0b0f0d',
            fontWeight: 700,
            fontSize: '0.9rem',
            letterSpacing: '0.05em',
          }}
        >
          {STATE_LABELS[snapshot.state]}
        </span>
      </div>

      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #333' }}>
            <th style={{ textAlign: 'left', padding: '0.4rem 0.75rem', opacity: 0.6 }}>Source</th>
            <th style={{ textAlign: 'left', padding: '0.4rem 0.75rem', opacity: 0.6 }}>Status</th>
            <th style={{ textAlign: 'left', padding: '0.4rem 0.75rem', opacity: 0.6 }}>Address</th>
          </tr>
        </thead>
        <tbody>
          {(['bootstrap', 'stake'] as const).map((key) => {
            const src = snapshot.sources[key];
            return (
              <tr key={key} style={{ borderBottom: '1px solid #1e1e1e' }}>
                <td style={{ padding: '0.4rem 0.75rem', textTransform: 'capitalize' }}>{key}</td>
                <td style={{ padding: '0.4rem 0.75rem' }}>
                  <span style={{ color: src.active ? '#4bc86a' : '#666' }}>
                    {src.active ? 'active' : 'inactive'}
                  </span>
                </td>
                <td style={{ padding: '0.4rem 0.75rem' }}>
                  <AddressCell address={src.address} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', opacity: 0.4 }}>
        Config-driven snapshot · Last updated: {new Date(snapshot.timestampMs).toLocaleTimeString()}
      </div>
    </div>
  );
}
