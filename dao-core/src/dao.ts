import fs from 'fs';
import path from 'path';
import constitutionFile from '../config/constitution.example.json';
import { DaoConstitution, DaoProposal, DaoProposalDecision, DaoSnapshot } from './types';

function evaluateProposal(
  proposal: DaoProposal,
  constitution: DaoConstitution,
): DaoProposalDecision {
  const reasons: string[] = [];

  if (proposal.sponsorClasses.length < constitution.minimumSponsorCount) {
    reasons.push('proposal has fewer sponsors than the constitution requires');
  }

  for (const sponsorClass of constitution.requiredSponsorClasses) {
    if (!proposal.sponsorClasses.includes(sponsorClass)) {
      reasons.push(`proposal is missing required sponsor class: ${sponsorClass}`);
    }
  }

  if (
    constitution.handoffRequiresDelegateAgent &&
    proposal.sponsorClasses.includes('delegated_human') &&
    !proposal.delegateAgentPresent
  ) {
    reasons.push('delegated human sponsorship requires a delegate agent handoff surface');
  }

  if (proposal.alignmentNotes.length === 0) {
    reasons.push('proposal includes no alignment notes');
  }

  if (proposal.affectsCapital && constitution.capitalProposalsRemainDeferred) {
    return {
      proposalId: proposal.id,
      title: proposal.title,
      disposition: 'deferred',
      allowedExecutionSurface: 'capital_gated',
      reasons: [...reasons, 'capital-affecting governance remains deferred until funded governance is live'],
    };
  }

  if (proposal.touchesOnchain && constitution.onchainProposalsRemainDeferred) {
    return {
      proposalId: proposal.id,
      title: proposal.title,
      disposition: 'deferred',
      allowedExecutionSurface: 'capital_gated',
      reasons: [...reasons, 'onchain governance remains deferred until the live governance system exists'],
    };
  }

  if (reasons.length > 0) {
    return {
      proposalId: proposal.id,
      title: proposal.title,
      disposition: 'review',
      allowedExecutionSurface: 'operator_review_surface',
      reasons,
    };
  }

  return {
    proposalId: proposal.id,
    title: proposal.title,
    disposition: 'accepted',
    allowedExecutionSurface: 'local_governance_lane',
    reasons: ['proposal is inside the current local governance constitution'],
  };
}

export function buildDaoSnapshot(
  constitution: DaoConstitution,
  proposals: DaoProposal[],
): DaoSnapshot {
  const decisions = proposals.map((proposal) => evaluateProposal(proposal, constitution));

  const nextActions = new Set<string>();
  if (decisions.some((decision) => decision.disposition === 'review')) {
    nextActions.add('route constitution-edge proposals through the operator review surface');
  }
  if (decisions.some((decision) => decision.disposition === 'deferred')) {
    nextActions.add('keep capital and onchain governance proposals in the deferred lane until funded governance exists');
  }
  if (nextActions.size === 0) {
    nextActions.add('continue bounded local governance review and constitution maintenance');
  }

  return {
    implemented: true,
    localAnalysisOnly: true,
    constitutionVersion: constitution.charterVersion,
    governanceAgentStatus: 'local_ready',
    proposalSystemStatus: 'local_ready',
    handoffControlsStatus: 'enforced',
    proposalCount: proposals.length,
    acceptedCount: decisions.filter((decision) => decision.disposition === 'accepted').length,
    reviewCount: decisions.filter((decision) => decision.disposition === 'review').length,
    deferredCount: decisions.filter((decision) => decision.disposition === 'deferred').length,
    decisions,
    nextActions: Array.from(nextActions),
  };
}

export function loadLocalDaoSnapshot(packageRoot: string): DaoSnapshot {
  const filePath = path.resolve(packageRoot, 'dao-core', 'config', 'constitution.example.json');
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
    constitution: DaoConstitution;
    proposals: DaoProposal[];
  };
  return buildDaoSnapshot(parsed.constitution, parsed.proposals);
}

export function loadExampleDaoSnapshot(): DaoSnapshot {
  return buildDaoSnapshot(
    constitutionFile.constitution as DaoConstitution,
    constitutionFile.proposals as DaoProposal[],
  );
}
