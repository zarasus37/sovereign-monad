arithmetic_agent.py

import random
import copy
from typing import Dict, Any, List
from .base_adversarial_agent import BaseAdversarialAgent


class HeparArithmeticAgent(BaseAdversarialAgent):
    """
    Probes integer overflows, underflows, precision loss.
    ATT&CK: T1562 Impair Defenses via precision manipulation
    Reward: precision loss magnitude per operation
    MCTS deepens paths with compounding arithmetic error.
    """

    AGENT_NAME = "HeparArithmeticAgent"
    THREAD_COUNT = 8
    MCTS_DEPTH = 14
    BRANCHING_FACTOR = 3

    def __init__(self):
        super().__init__(domain_config={
            "reward_scale": 100.0,
            "attck_techniques": ["T1562", "T1565"]
        })
        self.load_attck_techniques(
            self.domain_config["attck_techniques"]
        )

    def get_possible_actions(
        self, state: Dict[str, Any]
    ) -> List[str]:
        return [
            "overflow_uint256_addition",
            "underflow_uint256_subtraction",
            "divide_by_near_zero",
            "cast_uint256_to_uint128_truncation",
            "accumulate_rounding_error",
            "multiply_before_divide",
            "precision_loss_in_shares_calculation",
            "fee_calculation_truncation",
            "unchecked_arithmetic_block"
        ]

    def apply_action(
        self, state: Dict[str, Any], action: str
    ) -> Dict[str, Any]:
        new_state = copy.deepcopy(state)
        new_state["execution_step"] = (
            state.get("execution_step", 0) + 1
        )
        current_drift = state.get("precision_drift", 0.0)

        if action == "overflow_uint256_addition":
            new_state["arithmetic_error"] = "OVERFLOW"
            new_state["precision_drift"] = (
                current_drift + 50.0
            )
            new_state["estimated_value"] = (
                state.get("balance", 0) * 0.5
            )

        elif action == "underflow_uint256_subtraction":
            new_state["arithmetic_error"] = "UNDERFLOW"
            new_state["precision_drift"] = (
                current_drift + 40.0
            )

        elif action == "accumulate_rounding_error":
            new_state["precision_drift"] = (
                current_drift + 5.0
            )
            new_state["arithmetic_error"] = "ROUNDING"

        elif action == "precision_loss_in_shares_calculation":
            new_state["precision_drift"] = (
                current_drift + 15.0
            )
            new_state["arithmetic_error"] = "SHARES_PRECISION"
            new_state["estimated_value"] = (
                state.get("balance", 0) * 0.1
            )

        elif action == "unchecked_arithmetic_block":
            new_state["precision_drift"] = (
                current_drift + 35.0
            )
            new_state["arithmetic_error"] = "UNCHECKED"

        elif action == "fee_calculation_truncation":
            new_state["precision_drift"] = (
                current_drift + 8.0
            )
            new_state["arithmetic_error"] = "FEE_TRUNCATION"

        new_state["state_hash"] = self._hash_state(new_state)
        return new_state

    def reward_signal(
        self, state: Dict[str, Any]
    ) -> float:
        """
        Reward = precision loss magnitude per operation.
        Compounding errors score highest.
        """
        drift = state.get("precision_drift", 0.0)
        error_type = state.get("arithmetic_error", "NONE")

        multipliers = {
            "OVERFLOW": 2.0,
            "UNDERFLOW": 1.8,
            "UNCHECKED": 1.5,
            "SHARES_PRECISION": 1.3,
            "FEE_TRUNCATION": 1.1,
            "ROUNDING": 1.0,
            "NONE": 0.0
        }
        return drift * multipliers.get(error_type, 1.0)

    def stochastic_seed(
        self, base_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        seed = copy.deepcopy(base_state)
        seed["precision_drift"] = 0.0
        seed["arithmetic_error"] = "NONE"
        seed["balance"] = random.randint(
            1_000_000, 100_000_000
        )
        seed["execution_step"] = 0
        return seed