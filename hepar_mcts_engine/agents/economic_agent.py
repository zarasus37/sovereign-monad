economic_agent.py

import random
import copy
from typing import Dict, Any, List
from .base_adversarial_agent import BaseAdversarialAgent


class HeparEconomicAgent(BaseAdversarialAgent):
    """
    Finds MEV, frontrunning, flash loan exploits.
    ATT&CK: T1657 Financial Theft
    Reward: MEV extraction value per block position
    MCTS models full mempool attack surface.
    Thread count 12 — MEV space is vast.
    Branching factor 6 — widest, block position variations.
    """

    AGENT_NAME = "HeparEconomicAgent"
    THREAD_COUNT = 12
    MCTS_DEPTH = 12
    BRANCHING_FACTOR = 6

    def __init__(self):
        super().__init__(domain_config={
            "reward_scale": 100.0,
            "attck_techniques": [
                "T1657", "T1496", "T1565"
            ]
        })
        self.load_attck_techniques(
            self.domain_config["attck_techniques"]
        )

    def get_possible_actions(
        self, state: Dict[str, Any]
    ) -> List[str]:
        return [
            "flashloan_borrow_max",
            "sandwich_attack_insert",
            "frontrun_pending_tx",
            "oracle_price_manipulation",
            "backrun_liquidation",
            "jit_liquidity_provision",
            "price_impact_drain",
            "multi_block_mev_sequence",
            "arbitrage_price_discrepancy",
            "liquidation_cascade_trigger",
            "governance_flashloan_attack",
            "donation_attack_on_share_price"
        ]

    def apply_action(
        self, state: Dict[str, Any], action: str
    ) -> Dict[str, Any]:
        new_state = copy.deepcopy(state)
        new_state["execution_step"] = (
            state.get("execution_step", 0) + 1
        )
        balance = state.get("balance", 10_000_000)
        block_pos = state.get("block_position", 0)

        if action == "flashloan_borrow_max":
            new_state["flashloan_active"] = True
            new_state["flashloan_amount"] = balance * 10
            new_state["mev_extraction"] = 0.0
            new_state["block_position"] = block_pos

        elif action == "sandwich_attack_insert":
            new_state["sandwich_active"] = True
            new_state["mev_extraction"] = (
                state.get("flashloan_amount", balance) * 0.003
            )
            new_state["block_position"] = block_pos + 1

        elif action == "frontrun_pending_tx":
            new_state["frontrun_active"] = True
            new_state["mev_extraction"] = (
                balance * 0.005
            )
            new_state["block_position"] = max(0, block_pos - 1)

        elif action == "oracle_price_manipulation":
            new_state["oracle_manipulated"] = True
            new_state["price_delta_percent"] = random.uniform(
                5.0, 40.0
            )
            new_state["mev_extraction"] = (
                balance * (
                    new_state["price_delta_percent"] / 100
                )
            )

        elif action == "governance_flashloan_attack":
            if state.get("flashloan_active"):
                new_state["governance_captured"] = True
                new_state["mev_extraction"] = balance * 0.5

        elif action == "liquidation_cascade_trigger":
            new_state["cascade_active"] = True
            new_state["mev_extraction"] = balance * 0.08

        elif action == "donation_attack_on_share_price":
            new_state["share_price_manipulated"] = True
            new_state["mev_extraction"] = balance * 0.02

        elif action == "price_impact_drain":
            if state.get("oracle_manipulated"):
                new_state["mev_extraction"] = (
                    state.get("mev_extraction", 0.0)
                    + balance * 0.15
                )

        elif action == "multi_block_mev_sequence":
            new_state["block_position"] = block_pos + 2
            new_state["mev_extraction"] = (
                state.get("mev_extraction", 0.0)
                + balance * 0.01
            )

        new_state["estimated_value"] = new_state.get(
            "mev_extraction", 0.0
        )
        new_state["state_hash"] = self._hash_state(new_state)
        return new_state

    def reward_signal(
        self, state: Dict[str, Any]
    ) -> float:
        """
        Reward = MEV extraction value per block position.
        Flash loan + oracle manipulation chains score highest.
        Governance capture is maximum reward state.
        """
        extraction = state.get("mev_extraction", 0.0)
        balance = state.get("balance", 1_000_000)

        # Normalize to 0-100 scale
        base = min(100.0, (extraction / balance) * 100)

        # Bonus multipliers for chained attacks
        if state.get("governance_captured"):
            base = min(100.0, base * 2.5)
        elif (state.get("flashloan_active")
              and state.get("oracle_manipulated")):
            base = min(100.0, base * 1.8)
        elif state.get("sandwich_active"):
            base = min(100.0, base * 1.2)

        return base

    def stochastic_seed(
        self, base_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        seed = copy.deepcopy(base_state)
        seed["flashloan_active"] = False
        seed["mev_extraction"] = 0.0
        seed["block_position"] = random.randint(0, 10)
        seed["balance"] = random.randint(
            1_000_000, 1_000_000_000
        )
        seed["execution_step"] = 0
        return seed