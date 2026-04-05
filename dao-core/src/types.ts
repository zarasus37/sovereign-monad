export type DaoSponsorClass = 'ecosystem_native' | 'delegated_human' | 'operator_review';

export interface DaoConstitution {
  schemaVersion: string;
  charterVersion: string;
  minimumSponsorCount: number;
  requiredSponsorClasses: DaoSponsorClass[];
  handoffRequiresDelegateAgent: boolean;
  capitalProposalsRemainDeferred: boolean;
  onchainProposalsRemainDeferred: boolean;
}

export interface DaoProposal {
  id: string;
  title: string;
  summary: string;
  sponsorClasses: DaoSponsorClass[];
  delegateAgentPresent: boolean;
  affectsCapital: boolean;
  touchesOnchain: boolean;
  alignmentNotes: string[];
}

export interface DaoProposalDecision {
  proposalId: string;
  title: string;
  disposition: 'accepted' | 'review' | 'deferred';
  allowedExecutionSurface: 'local_governance_lane' | 'operator_review_surface' | 'capital_gated';
  reasons: string[];
}

export interface DaoSnapshot {
  implemented: true;
  localAnalysisOnly: true;
  constitutionVersion: string;
  governanceAgentStatus: 'local_ready';
  proposalSystemStatus: 'local_ready';
  handoffControlsStatus: 'enforced';
  proposalCount: number;
  acceptedCount: number;
  reviewCount: number;
  deferredCount: number;
  decisions: DaoProposalDecision[];
  nextActions: string[];
}
