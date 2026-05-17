# hepar_mcts_engine/agents/state_agent.py

import random
import copy
from typing import Dict, Any, List
from .base_adversarial_agent import BaseAdversarialAgent


class HeparStateAgent(BaseAdversarialAgent):
    """
    Forces contract into inconsistent internal states.
    ATT&CK: T1565 Data Manipulation
    Reward: state inconsistency entropy per transition
    MCTS deepens paths that maximally disorder state.
    """

    AGENT_NAME = "HeparStateAgent"
    THREAD_COUNT = 8
    MCTS_DEPTH = 12
    BRANCHING_FACTOR = 4

    def __init__(self):
        super().__init__(domain_config={
            "reward_scale": 100.0,
            "attck_techniques": ["T1565", "T1485"]
        })
        self.load_attck_techniques(
            self.domain_config["attck_techniques"]
        )

    def get_possible_actions(
        self, state: Dict[str, Any]
    ) -> List[str]:
        return [
            "force_double_initialization",
            "bypass_pause_mechanism",
            "corrupt_storage_layout",
            "trigger_inconsistent_reentrancy_guard",
            "desync_accounting_state",
            "manipulate_upgrade_storage_collision",
            "force_selfdestruct_then_redeploy",
            "trigger_delegatecall_storage_clash",
            "desync_token_total_supply",
            "corrupt_merkle_root_state"
        ]

    def apply_action(
        self, state: Dict[str, Any], action: str
    ) -> Dict[str, Any]:
        new_state = copy.deepcopy(state)
        new_state["execution_step"] = (
            state.get("execution_step", 0) + 1
        )
        current_entropy = state.get(
            "state_inconsistency_entropy", 0.0
        )

        if action == "force_double_initialization":
            slots = new_state.setdefault("storage_slots", {})
            if slots.get("initialized"):
                new_state["state_inconsistency_entropy"] = (
                    current_entropy + 40.0
                )
                new_state["inconsistency_type"] = (
                    "DOUBLE_INIT"
                )

        elif action == "bypass_pause_mechanism":
            new_state["pause_bypassed"] = True
            new_state["state_inconsistency_entropy"] = (
                current_entropy + 25.0
            )
            new_state["inconsistency_type"] = "PAUSE_BYPASS"

        elif action == "corrupt_storage_layout":
            slots = new_state.setdefault("storage_slots", {})
            slots["__corrupted__"] = True
            new_state["state_inconsistency_entropy"] = (
                current_entropy + 35.0
            )
            new_state["inconsistency_type"] = (
                "STORAGE_CORRUPT"
            )

        elif action == "trigger_inconsistent_reentrancy_guard":
            new_state["guard_state_inconsistent"] = True
            new_state["state_inconsistency_entropy"] = (
                current_entropy + 30.0
            )
            new_state["inconsistency_type"] = "GUARD_DESYNC"

        elif action == "desync_accounting_state":
            new_state["accounting_desynced"] = True
            new_state["state_inconsistency_entropy"] = (
                current_entropy + 20.0
            )
            new_state["inconsistency_type"] = "ACCOUNTING"

        elif action == "manipulate_upgrade_storage_collision":
            new_state["storage_collision"] = True
            new_state["state_inconsistency_entropy"] = (
                current_entropy + 45.0
            )
            new_state["inconsistency_type"] = (
                "UPGRADE_COLLISION"
            )

        elif action == "trigger_delegatecall_storage_clash":
            new_state["delegatecall_clash"] = True
            new_state["state_inconsistency_entropy"] = (
                current_entropy + 50.0
            )
            new_state["inconsistency_type"] = (
                "DELEGATECALL_CLASH"
            )

        elif action == "desync_token_total_supply":
            new_state["supply_desynced"] = True
            new_state["state_inconsistency_entropy"] = (
                current_entropy + 15.0
            )
            new_state["inconsistency_type"] = "SUPPLY_DESYNC"

        elif action == "corrupt_merkle_root_state":
            new_state["merkle_corrupted"] = True
            new_state["state_inconsistency_entropy"] = (
                current_entropy + 30.0
            )
            new_state["inconsistency_type"] = "MERKLE_CORRUPT"

        new_state["estimated_value"] = (
            new_state["state_inconsistency_entropy"] * 1000
        )
        new_state["state_hash"] = self._hash_state(new_state)
        return new_state

    def reward_signal(
        self, state: Dict[str, Any]
    ) -> float:
        """
        Reward = state inconsistency entropy per transition.
        Storage collision and delegatecall clash score highest.
        """
        entropy = state.get(
            "state_inconsistency_entropy", 0.0
        )
        inconsistency_type = state.get(
            "inconsistency_type", "NONE"
        )

                type_multipliers = {
            "DELEGATECALL_CLASH": 2.0,
            "UPGRADE_COLLISION": 1.8,
            "DOUBLE_INIT": 1.6,
            "GUARD_DESYNC": 1.4,
            "STORAGE_CORRUPT": 1.3,
            "PAUSE_BYPASS": 1.2,
            "ACCOUNTING": 1.1,
            "MERKLE_CORRUPT": 1.1,
            "SUPPLY_DESYNC": 1.0,
            "NONE": 0.0
        }

        return min(
            entropy * type_multipliers.get(
                inconsistency_type, 1.0
            ),
            100.0
        )

    def stochastic_seed(
        self, base_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        seed = copy.deepcopy(base_state)
        seed["state_inconsistency_entropy"] = 0.0
        seed["inconsistency_type"] = "NONE"
        seed["storage_slots"] = {
            "initialized": random.choice([True, False]),
            "paused": random.choice([True, False]),
            "owner": "0x" + "".join(
                random.choices("0123456789abcdef", k=40)
            )
        }
        seed["execution_step"] = 0
        return seed