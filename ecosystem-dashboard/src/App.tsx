import { useEffect, useState, type ReactNode } from 'react';
import { EcosystemStateSnapshot } from './types';
import './styles.css';

const apiBaseUrl = import.meta.env.VITE_ECOSYSTEM_STATE_API_URL || 'http://localhost:4040';

function Section(props: { title: string; children: ReactNode }) {
  return (
    <section className="panel">
      <h2>{props.title}</h2>
      {props.children}
    </section>
  );
}

function Pill(props: { children: ReactNode; tone?: 'neutral' | 'warn' | 'critical' | 'good' }) {
  return <span className={`pill pill-${props.tone || 'neutral'}`}>{props.children}</span>;
}

export default function App() {
  const [data, setData] = useState<EcosystemStateSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiBaseUrl}/ecosystem/state`);
        if (!response.ok) {
          const body = await response.json().catch(() => null);
          throw new Error(body?.message || `Request failed with status ${response.status}`);
        }

        const snapshot = (await response.json()) as EcosystemStateSnapshot;
        if (!cancelled) {
          setData(snapshot);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Sovereign Monad / Internal Surface</p>
          <h1>Ecosystem State Dashboard</h1>
          <p className="lede">
            Local zero-capital posture across organ runtime, signal, Oracle, Gnosis, and boundary stress.
          </p>
        </div>
        <div className="hero-meta">
          <Pill tone="neutral">API {apiBaseUrl}</Pill>
          <Pill tone="warn">Local Analysis Only</Pill>
        </div>
      </header>

      {loading && <section className="panel">Loading ecosystem state...</section>}
      {error && <section className="panel error-panel">State load failed: {error}</section>}

      {data && (
        <>
          <section className="summary-grid">
            <div className="metric-card">
              <span>Deployment</span>
              <strong>{data.summary.deploymentPosture}</strong>
            </div>
            <div className="metric-card">
              <span>Commercialization</span>
              <strong>{data.summary.commercializationPosture}</strong>
            </div>
            <div className="metric-card">
              <span>Integrity</span>
              <strong>{data.summary.integrityStatus}</strong>
            </div>
            <div className="metric-card">
              <span>Escalation</span>
              <strong>{data.summary.escalationTier}</strong>
            </div>
            <div className="metric-card">
              <span>Data Rail Externalization</span>
              <strong>{data.summary.dataRailExternalizationAllowed ? 'allowed' : 'blocked'}</strong>
            </div>
            <div className="metric-card">
              <span>Emergence Readiness</span>
              <strong>{data.summary.emergenceReadiness}</strong>
            </div>
            <div className="metric-card">
              <span>Externalization Readiness</span>
              <strong>{data.summary.externalizationReadiness}</strong>
            </div>
          </section>

          <Section title="Summary">
            <div className="list-grid">
              <div>
                <h3>Implemented Surfaces</h3>
                <ul>
                  {data.summary.implementedSurfaces.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Next Frontier</h3>
                <ul>
                  {data.summary.nextFrontier.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          <Section title="Organ Runtime">
            <div className="organ-grid">
              {data.surfaces.organRuntime.organs.map((organ) => (
                <article key={organ.name} className="organ-card">
                  <div className="organ-topline">
                    <h3>{organ.name}</h3>
                    <Pill tone={organ.zeroCapitalReady ? 'good' : organ.capitalRequired ? 'warn' : 'critical'}>
                      {organ.zeroCapitalReady ? 'zero-capital ready' : organ.capitalRequired ? 'capital-gated' : 'blocked'}
                    </Pill>
                  </div>
                  <p>{organ.biologicalAnalog}</p>
                  <p>{organ.ecosystemRole}</p>
                  <p className="muted">{organ.primaryOutput}</p>
                  {organ.blockedReasons.length > 0 && (
                    <>
                      <h4>Blocked Reasons</h4>
                      <ul>
                        {organ.blockedReasons.map((reason) => (
                          <li key={reason}>{reason}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </article>
              ))}
            </div>
          </Section>

          <Section title="Oracle / Gnosis / Boundary">
            <div className="triple-grid">
              <article className="subpanel">
                <h3>Oracle</h3>
                <p>Regime: {data.surfaces.oracle.regime}</p>
                <p>Confidence: {data.surfaces.oracle.confidence}</p>
                <ul>
                  {data.surfaces.oracle.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </article>
              <article className="subpanel">
                <h3>Gnosis</h3>
                <p>Decompression: {data.surfaces.gnosis.decompressionStatus}</p>
                <p>Hollow Convergence: {data.surfaces.gnosis.hollowConvergenceRisk}</p>
                <ul>
                  {data.surfaces.gnosis.reviewFlags.map((flag) => (
                    <li key={flag}>{flag}</li>
                  ))}
                </ul>
              </article>
              <article className="subpanel">
                <h3>Boundary Stress</h3>
                <p>Sheath Pressure: {data.surfaces.boundaryStress.sheathPressure}</p>
                <p>Turbulence: {data.surfaces.boundaryStress.turbulence}</p>
                <p>Pause Suggested: {data.surfaces.boundaryStress.pauseSuggested ? 'yes' : 'no'}</p>
              </article>
            </div>
          </Section>

          <Section title="Data Rail / Emergence">
            <div className="triple-grid">
              <article className="subpanel">
                <h3>Data Rail</h3>
                <p>Normalized Events: {data.surfaces.dataRail.normalizedCount}</p>
                <p>Reward Eligible: {data.surfaces.dataRail.rewardEligibleCount}</p>
                <p>Ledger Entries: {data.surfaces.rewardLedger.entryCount}</p>
                <p>
                  Externalization:{' '}
                  {data.surfaces.dataRailRouting.externalizationAllowed ? 'allowed' : 'blocked'}
                </p>
              </article>
              <article className="subpanel">
                <h3>Governance Gates</h3>
                <p>Thresholds Defined: {data.surfaces.dataRailGovernance.thresholdsDefined ? 'yes' : 'no'}</p>
                <p>Thresholds Met: {data.surfaces.dataRailGovernance.thresholdsMet ? 'yes' : 'no'}</p>
                <ul>
                  {data.surfaces.dataRailGovernance.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </article>
              <article className="subpanel">
                <h3>Emergence Observation</h3>
                <p>Readiness: {data.surfaces.emergenceObservation.readiness}</p>
                <p>Evidence Window: {data.surfaces.emergenceObservation.evidenceWindow}</p>
                <ul>
                  {data.surfaces.emergenceObservation.blockedBy.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </article>
            </div>
          </Section>

          <Section title="Growth / Rights / Activation">
            <div className="triple-grid">
              <article className="subpanel">
                <h3>Population Growth</h3>
                <p>Thresholds Met: {data.surfaces.populationGrowth.thresholdsMet ? 'yes' : 'no'}</p>
                <p>
                  Population:{' '}
                  {data.surfaces.populationGrowth.metrics.totalEvents} events /{' '}
                  {data.surfaces.populationGrowth.metrics.distinctActors} actors
                </p>
                <p>Gap Count: {data.surfaces.populationGrowth.gapCount}</p>
                {data.surfaces.populationGrowth.recommendations.length > 0 ? (
                  <ul>
                    {data.surfaces.populationGrowth.recommendations.map((item, index) => (
                      <li key={`${item.priority}-${index}`}>{item.priority}: {item.action}</li>
                    ))}
                  </ul>
                ) : (
                  <ul>
                    {data.surfaces.populationGrowth.executedActions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </article>
              <article className="subpanel">
                <h3>Rights Review</h3>
                <p>Review Cases: {data.surfaces.rightsReview.reviewCaseCount}</p>
                <p>Open Queue: {data.surfaces.rightsReview.openCaseCount}</p>
                <p>Resolved: {data.surfaces.rightsReview.resolvedCaseCount}</p>
                <p>Blocked: {data.surfaces.rightsReview.blockedCount}</p>
                <p>Conditional: {data.surfaces.rightsReview.conditionalCount}</p>
                <p>Manual Review: {data.surfaces.rightsReview.manualReviewCount}</p>
              </article>
              <article className="subpanel">
                <h3>Activation Readiness</h3>
                <p>Status: {data.surfaces.externalizationReadiness.status}</p>
                {data.surfaces.externalizationReadiness.blockers.length > 0 ? (
                  <ul>
                    {data.surfaces.externalizationReadiness.blockers.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                ) : (
                  <ul>
                    {data.surfaces.externalizationReadiness.clearedGates.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                )}
              </article>
            </div>
          </Section>

          <Section title="Longitudinal Baseline">
            <div className="triple-grid">
              <article className="subpanel">
                <h3>Baseline</h3>
                <p>Windows: {data.surfaces.emergenceBaseline.windowCount}</p>
                <p>Status: {data.surfaces.emergenceBaseline.baselineStatus}</p>
                <p>Readiness Trend: {data.surfaces.emergenceBaseline.readinessTrend}</p>
                <p>Continuity Trend: {data.surfaces.emergenceBaseline.continuityTrend}</p>
              </article>
              <article className="subpanel">
                <h3>Observation Targets</h3>
                <ul>
                  {data.surfaces.emergenceObservation.nextCollectionTargets.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </article>
              <article className="subpanel">
                <h3>Baseline Notes</h3>
                <ul>
                  {data.surfaces.emergenceBaseline.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              </article>
            </div>
          </Section>

          <Section title="Mandate and Orchestration">
            <div className="list-grid">
              <div>
                <h3>{data.surfaces.organRuntime.mandate?.title || 'No mandate title'}</h3>
                <ul>
                  {(data.surfaces.organRuntime.mandate?.sequence || []).map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3>Orchestration Bottlenecks</h3>
                <ul>
                  {(data.surfaces.organRuntime.orchestration?.bottlenecks || []).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>
        </>
      )}
    </main>
  );
}
