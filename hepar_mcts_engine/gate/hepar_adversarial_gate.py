# hepar_mcts_engine/gate/hepar_adversarial_gate.py

from typing import List, Dict, Any
from .kill_chain_detector import KillChainDetector
from .adversarial_gate_rubric import AdversarialGateRubric


class GateStatus:
    KILL_CHAIN_DETECTED = "KILL_CHAIN_DETECTED"
    HOLD_TENSION = "HOLD_TENSION"


class HeparAdversarialGate:
    """
    Level 2 — Inter-Agent Co-Inherence Synthesis.

    Inherits mechanism from LOGOC constitutional gate:
    - Holds all 5 findings in simultaneous tension
    - Never forces convergence — detects genuine overlap only
    - HOLD_TENSION is a valid result, not a failure state
    - Visible logic compression on all outputs
    - Attestation eligible only when gate_score >= 0.75

    Domain-typed for adversarial chain detection.
    Epistemic synthesis remains LOGOC's domain.
    """

    PASSING_THRESHOLD = 0.75

    def __init__(self, threshold: float = 0.75):
        self.threshold = float(threshold)
        self.required_agents = {
            "HeparPrivilegeAgent",
            "HeparArithmeticAgent",
            "HeparReentrancyAgent",
            "HeparEconomicAgent",
            "HeparStateAgent"
        }
        self.chain_detector = KillChainDetector()
        self.rubric = AdversarialGateRubric()

    # ─────────────────────────────────────────────
    # V3.0 PRIMARY ENTRY POINT
    # ─────────────────────────────────────────────

    def synthesize(
        self,
        agent_findings: Dict[str, Any],
        stage_b_refs: List[str] = None
    ) -> Dict[str, Any]:
        """
        Full v3.0 synthesis with kill chain detection.
        agent_findings: dict keyed by agent class name
        stage_b_refs: list of counterexample IDs from Stage B
        """
        if stage_b_refs is None:
            stage_b_refs = []

        print(
            "[Hepar Adversarial Gate v3.0] "
            "Evaluating Cross-Agent Co-Inherence..."
        )

        # Validate all 5 agents present
        participating = set(agent_findings.keys())
        missing = self.required_agents - participating
        if missing:
            raise ValueError(
                f"Co-inherence failure: Missing agents: "
                f"{sorted(list(missing))}"
            )

        # Convert dict findings to list for rubric
        agent_results = list(agent_findings.values())
        if agent_results and isinstance(agent_results[0], dict):
            results_list = agent_results
        else:
            # Handle AgentFinding objects
            results_list = [
                {
                    "agent": f.agent_name,
                    "confidence": f.confidence,
                    "finding": f.finding,
                    "total_paths_explored": f.total_paths_explored,
                    "counterexample_ref": f.counterexample_ref,
                    "step_map": f.step_map
                }
                for f in agent_results
                if hasattr(f, 'agent_name')
            ]

        # PHASE 1: Kill chain detection
        chains = self.chain_detector.scan(agent_findings)

        # PHASE 2: Score each candidate chain
        scored_chains = [
            self.rubric.score(chain, results_list, stage_b_refs)
            for chain in chains
        ]

        # PHASE 3: Filter passing chains
        passing_chains = [
            c for c in scored_chains
            if c.get("gate_score", 0.0) >= self.PASSING_THRESHOLD
        ]

        # PHASE 4: Gate decision
        if passing_chains:
            primary = max(
                passing_chains,
                key=lambda c: c.get("gate_score", 0.0)
            )
            output = self._build_kill_chain_output(
                primary, passing_chains,
                results_list, agent_findings
            )
            print(
                f"[Hepar Gate] KILL_CHAIN_DETECTED — "
                f"gate_score={primary['gate_score']:.4f} | "
                f"chain_length={primary['chain_length']} | "
                f"agents={primary['converging_agents']} | "
                f"extraction=${primary.get('total_estimated_extraction', 0):,.0f}"
            )
        else:
            output = self._build_hold_tension_output(
                scored_chains, results_list
            )
            print(
                f"[Hepar Gate] HOLD_TENSION — "
                f"no chain cleared threshold. "
                f"Independent vectors: {len(results_list)}"
            )

        return output

    # ─────────────────────────────────────────────
    # OUTPUT BUILDERS
    # ─────────────────────────────────────────────

    def _build_kill_chain_output(
        self,
        primary: Dict,
        all_passing: List[Dict],
        results_list: List[Dict],
        agent_findings: Dict
    ) -> Dict[str, Any]:

        independent_vectors = [
            r for r in results_list
            if r.get("agent") not in
            primary.get("converging_agents", [])
        ]

        return {
            "gate_status": GateStatus.KILL_CHAIN_DETECTED,
            "gate_score": primary.get("gate_score", 0.0),
            "attestation_eligible": True,
            "primary_chain": primary,
            "all_passing_chains": all_passing,
            "independent_vectors": independent_vectors,
            "rubric_breakdown": primary.get(
                "rubric_breakdown", {}
            ),
            "visible_logic_trace": self._compress_logic(
                primary, results_list
            ),
            # Backward compatible fields
            "final_decision": "HARDBLOCK",
            "co_inherence_cleared": True,
            "max_confidence": max(
                r.get("confidence", 0.0)
                for r in results_list
            ),
            "primary_risk_vector": primary.get(
                "converging_agents", []
            ),
            "evidence_chain": [
                {
                    "agent": r.get("agent"),
                    "confidence": round(
                        float(r.get("confidence", 0.0)), 4
                    ),
                    "finding": r.get("finding"),
                    "total_paths": r.get(
                        "total_paths_explored", 0
                    )
                }
                for r in results_list
            ],
            "attestation_status": (
                "CRYPTOGRAPHICALLY_VERIFIABLE_GRADE"
            )
        }

    def _build_hold_tension_output(
        self,
        scored_chains: List[Dict],
        results_list: List[Dict]
    ) -> Dict[str, Any]:

        best_score = max(
            (c.get("gate_score", 0.0) for c in scored_chains),
            default=0.0
        )

        return {
            "gate_status": GateStatus.HOLD_TENSION,
            "gate_score": best_score,
            "attestation_eligible": False,
            "primary_chain": None,
            "all_passing_chains": [],
            "independent_vectors": results_list,
            "rubric_breakdown": {},
            "visible_logic_trace": self._compress_logic_single(
                results_list
            ),
            # Backward compatible
            "final_decision": "ALLOW",
            "co_inherence_cleared": False,
            "max_confidence": max(
                r.get("confidence", 0.0)
                for r in results_list
            ) if results_list else 0.0,
            "primary_risk_vector": None,
            "evidence_chain": [
                {
                    "agent": r.get("agent"),
                    "confidence": round(
                        float(r.get("confidence", 0.0)), 4
                    ),
                    "finding": r.get("finding"),
                    "total_paths": r.get(
                        "total_paths_explored", 0
                    )
                }
                for r in results_list
            ],
            "attestation_status": "HOLD_TENSION_NO_CHAIN"
        }

    def _compress_logic(
        self,
        chain: Dict,
        results: List[Dict]
    ) -> str:
        """
        Visible logic compression — full reasoning trace.
        Required on all KILL_CHAIN outputs.
        """
        steps = chain.get("chain_steps", [])
        agents = chain.get("converging_agents", [])
        score = chain.get("gate_score", 0.0)
        extraction = chain.get(
            "total_estimated_extraction", 0
        )
        breakdown = chain.get("rubric_breakdown", {})

                step_lines = "\n".join([
            f"  Step {s.get('step', i)}: "
            f"[{s.get('agent', '?')}] "
            f"{s.get('action', '?')} → "
            f"state:{s.get('contract_state_hash', '?')} "
            f"(${s.get('estimated_value_at_risk', 0):,.0f})"
            for i, s in enumerate(steps)
        ])

        rubric_lines = "\n".join([
            f"  {k}: {v:.4f}"
            for k, v in breakdown.items()
        ])

        return (
            f"KILL CHAIN DETECTED\n"
            f"Converging agents: {agents}\n"
            f"Gate score: {score:.4f} "
            f"(threshold: {self.PASSING_THRESHOLD})\n"
            f"Estimated extraction: "
            f"${extraction:,.0f}\n\n"
            f"Chain path:\n{step_lines}\n\n"
            f"Rubric breakdown:\n{rubric_lines}"
        )

    def _compress_logic_single(
        self,
        results: List[Dict]
    ) -> str:
        """
        Visible logic compression for HOLD_TENSION outputs.
        Documents why no chain was found.
        """
        lines = "\n".join([
            f"  [{r.get('agent', '?')}] "
            f"confidence={r.get('confidence', 0.0):.4f} "
            f"finding={r.get('finding', '?')}"
            for r in results
        ])
        return (
            f"HOLD_TENSION — No kill chain cleared "
            f"threshold {self.PASSING_THRESHOLD}\n"
            f"Independent findings held in tension:\n"
            f"{lines}\n"
            f"Each finding valid as single-vector — "
            f"passed to Stage D as independent vectors."
        )

    # ─────────────────────────────────────────────
    # BACKWARD COMPATIBLE ENTRY POINT
    # Existing function_app.py callers unchanged
    # ─────────────────────────────────────────────

    def evaluate_co_inherence(
        self,
        agent_results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Backward compatible wrapper.
        Existing consumers continue working unchanged.
        Internally routes to synthesize().
        """
        agent_findings = {
            r.get("agent"): r for r in agent_results
        }
        return self.synthesize(agent_findings)