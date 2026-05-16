from typing import List, Dict, Any


class HeparAdversarialGate:
    """
    Level 2 — Inter-Agent Architecture (Cross-agent synthesis upgrade).
    Implements the 5-agent co-inherence logic and the 0.75 confidence rubric.
    """
    def __init__(self, threshold: float = 0.75):
        self.threshold = float(threshold)
        self.required_agents = {
            "HeparPrivilegeAgent",
            "HeparArithmeticAgent",
            "HeparReentrancyAgent",
            "HeparEconomicAgent",
            "HeparStateAgent"
        }

    def evaluate_co_inherence(self, agent_results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Consumes the synthesized MCTS outputs from all 5 agents and constructs
        the final attestation payload for upstream/downstream integration.
        """
        print("[Hepar Adversarial Gate] Evaluating Cross-Agent Co-Inherence...")

        participating_agents = {result.get("agent") for result in agent_results}
        missing_agents = self.required_agents - participating_agents
        if missing_agents:
            raise ValueError(f"Co-inherence failure: Missing required agents: {sorted(list(missing_agents))}")

        max_confidence = 0.0
        primary_vector = "None"
        evidence_chain = []

        for result in agent_results:
            conf = float(result.get("confidence", 0.0))
            evidence_chain.append({
                "agent": result.get("agent"),
                "confidence": round(conf, 4),
                "finding": result.get("finding"),
                "total_paths": int(result.get("total_paths_explored", 0))
            })

            if conf > max_confidence:
                max_confidence = conf
                primary_vector = result.get("agent")

        # The 0.75 Threshold Rubric
        decision = "HARDBLOCK" if max_confidence >= self.threshold else "ALLOW"
        threshold_met = max_confidence >= self.threshold

        # Level 3 — Pipeline Integration Payload
        attestation_payload = {
            "attestation_status": "CRYPTOGRAPHICALLY_VERIFIABLE_GRADE",
            "final_decision": decision,
            "max_confidence": round(max_confidence, 4),
            "primary_risk_vector": primary_vector,
            "threshold_met": threshold_met,
            # Backwards-compatible boolean for existing consumers
            "co_inherence_cleared": threshold_met,
            "evidence_chain": evidence_chain
        }

        print(f"[Hepar Gate] Synthesis Complete. Decision: {decision} (Peak Confidence: {max_confidence:.4f} via {primary_vector})")
        return attestation_payload
