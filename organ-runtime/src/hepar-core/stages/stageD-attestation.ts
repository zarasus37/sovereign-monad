import { createHash } from 'crypto';

export interface FinalSynthesis {
    protocolId: string;
    status: string;
    evidence_chain: string[];
    primary_risk_vector: number;
    max_confidence: number;
    decision: 'ALLOW' | 'RESTRICTED' | 'HARDBLOCK';
    timestamp: string;
}

export interface AttestationPayload {
    attestationId: string;
    protocolId: string;
    executionTimestamp: string;
    decision: string;
    confidenceScore: number;
    cryptographicHash: string;
    liabilityCapDisclaimer: string;
    evidenceRoots: string[];
}

export class HeparStageD_Consensus {
    /**
     * Fuses the MCTS synthesis into a commercially viable and cryptographically
     * verifiable attestation payload for Tier 3 NDA delivery.
     */
    public generateAttestation(synthesis: FinalSynthesis): AttestationPayload {
        console.log(`[Hepar Stage D] Fusing consensus for ${synthesis.protocolId}...`);

        // 1. Enforce Action Banding & Thresholds
        let finalDecision = synthesis.decision;
        if (synthesis.primary_risk_vector > 0.75) {
            finalDecision = 'HARDBLOCK';
            console.warn(`[Hepar Stage D] WARNING: 0.75 Rubric breached. Unilateral HARDBLOCK applied.`);
        }

        // 2. Generate Evidence Roots (Merkle-ready array of evidence traces)
        const evidenceRoots = synthesis.evidence_chain.map(evidenceNode => {
            return createHash('sha256').update(evidenceNode).digest('hex');
        });

        // 3. Construct the Cryptographic Attestation String
        const payloadToSign = `${synthesis.protocolId}|${finalDecision}|${synthesis.max_confidence}|${evidenceRoots.join(',')}`;
        const finalHash = createHash('sha256').update(payloadToSign).digest('hex');

        // 4. Assemble the Commercial Liability Shield (The Sellable Asset)
        const attestation: AttestationPayload = {
            attestationId: `HEP-ATT-${Date.now()}`,
            protocolId: synthesis.protocolId,
            executionTimestamp: new Date().toISOString(),
            decision: finalDecision,
            confidenceScore: synthesis.max_confidence,
            cryptographicHash: finalHash,
            liabilityCapDisclaimer: "This attestation is a Stage D forensic output provided under NDA. It constitutes bounded symbolic and Monte Carlo execution evidence, not a guarantee against all future exploit topologies. Refer to §15 Legal Posture.",
            evidenceRoots: evidenceRoots
        };

        console.log(`[Hepar Stage D] Attestation Generated: ${attestation.attestationId} [HASH: ${finalHash.substring(0,8)}...]`);
        return attestation;
    }
}
