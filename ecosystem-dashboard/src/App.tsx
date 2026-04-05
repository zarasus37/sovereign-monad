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
              <span>Activation Decision</span>
              <strong>{data.summary.activationDecisionStatus}</strong>
            </div>
            <div className="metric-card">
              <span>Phase 1a Live Proof</span>
              <strong>{data.summary.phase1aLiveProofRecorded ? 'recorded' : 'pending'}</strong>
            </div>
            <div className="metric-card">
              <span>Bootstrap Source</span>
              <strong>{data.summary.bootstrapSourceRegistered ? 'registered' : 'pending'}</strong>
            </div>
            <div className="metric-card">
              <span>Execution Truth</span>
              <strong>{data.summary.executionTruthStatus}</strong>
            </div>
            <div className="metric-card">
              <span>Cardia Activation</span>
              <strong>{data.summary.cardiaActivationStatus}</strong>
            </div>
            <div className="metric-card">
              <span>Public Activation</span>
              <strong>{data.summary.publicActivationStatus}</strong>
            </div>
            <div className="metric-card">
              <span>Externalization Active</span>
              <strong>{data.summary.dataRailExternalizationActivated ? 'yes' : 'no'}</strong>
            </div>
            <div className="metric-card">
              <span>Emergence Readiness</span>
              <strong>{data.summary.emergenceReadiness}</strong>
            </div>
            <div className="metric-card">
              <span>Externalization Readiness</span>
              <strong>{data.summary.externalizationReadiness}</strong>
            </div>
            <div className="metric-card">
              <span>Population Expansion</span>
              <strong>{data.summary.populationExpansionStatus}</strong>
            </div>
            <div className="metric-card">
              <span>Emergence Accumulation</span>
              <strong>{data.summary.emergenceAccumulationStatus}</strong>
            </div>
            <div className="metric-card">
              <span>DAO</span>
              <strong>{data.summary.daoStatus}</strong>
            </div>
            <div className="metric-card">
              <span>Keys NFT</span>
              <strong>{data.summary.keysNftStatus}</strong>
            </div>
            <div className="metric-card">
              <span>Narrative</span>
              <strong>{data.summary.narrativeStatus}</strong>
            </div>
            <div className="metric-card">
              <span>Dove</span>
              <strong>{data.summary.doveStatus}</strong>
            </div>
            <div className="metric-card">
              <span>Gnosis Eval</span>
              <strong>{data.summary.gnosisEvaluationStatus}</strong>
            </div>
            <div className="metric-card">
              <span>Data Product</span>
              <strong>{data.summary.dataProductStatus}</strong>
            </div>
            <div className="metric-card">
              <span>Emergent Protocol</span>
              <strong>{data.summary.emergentProtocolStatus}</strong>
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
                <p>Expansion Status: {data.surfaces.populationExpansion.status}</p>
                <p>
                  Next Wave:{' '}
                  {data.surfaces.populationExpansion.remainingEventCount} events /{' '}
                  {data.surfaces.populationExpansion.remainingActorCount} actors remaining
                </p>
                {data.surfaces.populationExpansion.nextWaveTargets.length > 0 ? (
                  <ul>
                    {data.surfaces.populationExpansion.nextWaveTargets.map((item) => (
                      <li key={item}>{item}</li>
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
                <h3>Activation Discipline</h3>
                <p>Readiness: {data.surfaces.externalizationReadiness.status}</p>
                <p>Decision Status: {data.surfaces.activationDecision.status}</p>
                <p>Structurally Eligible: {data.surfaces.activationDecision.structurallyEligible ? 'yes' : 'no'}</p>
                <p>Activated: {data.surfaces.activationDecision.activationAllowed ? 'yes' : 'no'}</p>
                <p>Recommended Scope: {data.surfaces.activationDecision.recommendedScope}</p>
                {data.surfaces.activationDecision.pendingActions.length > 0 ? (
                  <ul>
                    {data.surfaces.activationDecision.pendingActions.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                ) : (
                  <ul>
                    {data.surfaces.activationDecision.reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                )}
              </article>
            </div>
          </Section>

          <Section title="Capital-Gated Frontier">
            <div className="triple-grid">
              <article className="subpanel">
                <h3>Execution Truth</h3>
                <p>Status: {data.surfaces.executionTruth.status}</p>
                <p>Phase 1a Live Proof: {data.surfaces.executionTruth.phase1aLiveProofRecorded ? 'yes' : 'no'}</p>
                <p>Bootstrap Source: {data.surfaces.executionTruth.bootstrapSourceRegistered ? 'yes' : 'no'}</p>
                <p>Guarded-Live Session: {data.surfaces.executionTruth.observedGuardedLiveSession ? 'yes' : 'no'}</p>
                <p>Receipt Truth: {data.surfaces.executionTruth.receiptTruthValidated ? 'yes' : 'no'}</p>
                <ul>
                  {data.surfaces.executionTruth.blockers.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
              <article className="subpanel">
                <h3>Cardia Activation</h3>
                <p>Status: {data.surfaces.cardiaActivation.status}</p>
                <p>Runtime Mode: {data.surfaces.cardiaActivation.cardiaDeploymentMode}</p>
                <p>Reserve Healthy: {data.surfaces.cardiaActivation.reserveHealthy ? 'yes' : 'no'}</p>
                <p>Wallet Funded: {data.surfaces.cardiaActivation.walletFunded ? 'yes' : 'no'}</p>
                <p>Multisig Defined: {data.surfaces.cardiaActivation.multisigDefined ? 'yes' : 'no'}</p>
                <p>Cap Approved: {data.surfaces.cardiaActivation.guardedLiveCapApproved ? 'yes' : 'no'}</p>
                <p>Recommended First Funding: {data.surfaces.cardiaActivation.recommendedFirstFundingMon} MON</p>
                <ul>
                  {data.surfaces.cardiaActivation.nextActions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
              <article className="subpanel">
                <h3>Production / Public Activation</h3>
                <p>Status: {data.surfaces.publicActivation.status}</p>
                <p>Infra Configured: {data.surfaces.publicActivation.productionInfraConfigured ? 'yes' : 'no'}</p>
                <p>Licensed Path Validated: {data.surfaces.publicActivation.licensedPrivatePathValidated ? 'yes' : 'no'}</p>
                <p>Operator Monitoring: {data.surfaces.publicActivation.operatorMonitoringReady ? 'yes' : 'no'}</p>
                <p>Public Surface Ready: {data.surfaces.publicActivation.publicSurfaceReady ? 'yes' : 'no'}</p>
                <p>Activation Approved: {data.surfaces.publicActivation.activationApproved ? 'yes' : 'no'}</p>
                <ul>
                  {data.surfaces.publicActivation.nextActions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>
          </Section>

          <Section title="Governance / Keys / Narrative">
            <div className="triple-grid">
              <article className="subpanel">
                <h3>DAO</h3>
                <p>Constitution: {data.surfaces.dao.constitutionVersion}</p>
                <p>Governance Agent: {data.surfaces.dao.governanceAgentStatus}</p>
                <p>Proposals: {data.surfaces.dao.proposalCount}</p>
                <p>
                  Accepted / Review / Deferred: {data.surfaces.dao.acceptedCount} / {data.surfaces.dao.reviewCount} /{' '}
                  {data.surfaces.dao.deferredCount}
                </p>
                <ul>
                  {data.surfaces.dao.nextActions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
              <article className="subpanel">
                <h3>Keys NFT</h3>
                <p>Collection: {data.surfaces.keysNft.collectionName}</p>
                <p>Defined: {data.surfaces.keysNft.collectionDefined ? 'yes' : 'no'}</p>
                <p>Metadata Ready: {data.surfaces.keysNft.readyCount} / {data.surfaces.keysNft.metadataCount}</p>
                <p>Mint Live: {data.surfaces.keysNft.mintLive ? 'yes' : 'no'}</p>
                <ul>
                  {data.surfaces.keysNft.roleCoverage.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
              <article className="subpanel">
                <h3>Narrative</h3>
                <p>Infrastructure: {data.surfaces.narrative.infrastructureStatus}</p>
                <p>Surface: {data.surfaces.narrative.publicSurfaceStatus}</p>
                <p>{data.surfaces.narrative.headline}</p>
                <p>{data.surfaces.narrative.internalMemo}</p>
                <ul>
                  {data.surfaces.narrative.blockers.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
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
                <h3>Accumulation</h3>
                <p>Status: {data.surfaces.emergenceAccumulation.status}</p>
                <p>
                  Windows: {data.surfaces.emergenceAccumulation.currentWindowCount} /{' '}
                  {data.surfaces.emergenceAccumulation.targetWindowCount}
                </p>
                <p>Observable Windows: {data.surfaces.emergenceAccumulation.observableWindowCount}</p>
                <p>Current Streak: {data.surfaces.emergenceAccumulation.currentStreak}</p>
                <ul>
                  {data.surfaces.emergenceAccumulation.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </article>
              <article className="subpanel">
                <h3>Observation Targets</h3>
                <ul>
                  {data.surfaces.emergenceAccumulation.nextCollectionTargets.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </article>
            </div>
          </Section>

          <Section title="Dove / Gnosis Evaluation / Emergent Protocol">
            <div className="triple-grid">
              <article className="subpanel">
                <h3>Dove Integration</h3>
                <p>Observer: {data.surfaces.doveIntegration.observerStatus}</p>
                <p>Drift: {data.surfaces.doveIntegration.driftStatus}</p>
                <p>Signals: {data.surfaces.doveIntegration.signalCount}</p>
                <ul>
                  {data.surfaces.doveIntegration.recommendedActions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
              <article className="subpanel">
                <h3>Gnosis Evaluation</h3>
                <p>Overall Score: {data.surfaces.gnosisEvaluation.overallScore}</p>
                <p>Posture: {data.surfaces.gnosisEvaluation.posture}</p>
                <ul>
                  {data.surfaces.gnosisEvaluation.organScores.map((item) => (
                    <li key={item.organ}>
                      {item.organ}: {item.score} ({item.posture})
                    </li>
                  ))}
                </ul>
              </article>
              <article className="subpanel">
                <h3>Emergent Protocol</h3>
                <p>Status: {data.surfaces.emergentProtocol.validationStatus}</p>
                <p>
                  Candidates: {data.surfaces.emergentProtocol.validatedPatternCount} /{' '}
                  {data.surfaces.emergentProtocol.patternCount}
                </p>
                <ul>
                  {data.surfaces.emergentProtocol.protocolCandidates.map((item) => (
                    <li key={item.id}>
                      {item.id}: {item.status}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </Section>

          <Section title="Data Productization">
            <div className="triple-grid">
              <article className="subpanel">
                <h3>Status</h3>
                <p>Productization: {data.surfaces.dataProduct.productizationStatus}</p>
                <p>Scope: {data.surfaces.dataProduct.recommendedScope}</p>
                <p>External Active: {data.surfaces.dataProduct.externalActivationLive ? 'yes' : 'no'}</p>
              </article>
              <article className="subpanel">
                <h3>Available Bundles</h3>
                <ul>
                  {data.surfaces.dataProduct.availableBundles.map((item) => (
                    <li key={item.bundleId}>
                      {item.bundleId}: {item.reason}
                    </li>
                  ))}
                </ul>
              </article>
              <article className="subpanel">
                <h3>Blocked Bundles</h3>
                <ul>
                  {data.surfaces.dataProduct.blockedBundles.map((item) => (
                    <li key={item.bundleId}>
                      {item.bundleId}: {item.reason}
                    </li>
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
