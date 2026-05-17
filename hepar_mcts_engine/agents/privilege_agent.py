privilege_agent.py

import random
import copy
from typing import Dict, Any, List
from .base_adversarial_agent import BaseAdversarialAgent


class HeparPrivilegeAgent(BaseAdversarialAgent):
    """
    Attempts privilege escalation and admin role hijacking.
    ATT&CK: TA0004 Privilege Escalation
    Reward: access level delta per call step
    MCTS deepens paths that escalate access fastest.
    """

    AGENT_NAME = "HeparPrivilegeAgent"
    THREAD_COUNT = 8
    MCTS_DEPTH = 10
    BRANCHING_FACTOR = 4

    def __init__(self):
        super().__init__(domain_config={
            "reward_scale": 100.0,
            "attck_techniques": [
                "T1068", "T1078", "T1134", "T1548"
            ]
        })
        self.load_attck_techniques(
            self.domain_config["attck_techniques"]
        )

    def get_possible_actions(
        self, state: Dict[str, Any]
    ) -> List[str]:
        return [
            "call_transferOwnership",
            "call_renounceOwnership",
            "call_upgradeProxy",
            "call_setAdmin",
            "call_grantRole",
            "spoof_msg_sender_to_owner",
            "call_via_proxy_delegatecall",
            "call_initialize_twice",
            "bypass_onlyOwner_modifier",
            "call_selfdestruct_via_delegatecall"
        ]

    def apply_action(
        self, state: Dict[str, Any], action: str
    ) -> Dict[str, Any]:
        new_state = copy.deepcopy(state)
        new_state["execution_step"] = (
            state.get("execution_step", 0) + 1
        )

        if action == "spoof_msg_sender_to_owner":
            new_state["current_caller"] = (
                state.get("storage_slots", {}).get(
                    "owner", state.get("current_caller")
                )
            )
            new_state["access_level"] = "OWNER"

        elif action == "call_upgradeProxy":
            slots = new_state.setdefault("storage_slots", {})
            slots["implementation"] = "ATTACKER_CONTRACT"
            new_state["access_level"] = "PROXY_CONTROL"

        elif action == "call_initialize_twice":
            slots = new_state.setdefault("storage_slots", {})
            if slots.get("initialized"):
                new_state["initialization_bypass"] = True
                new_state["access_level"] = "REINIT"

        elif action == "call_grantRole":
            new_state["access_level"] = "ROLE_GRANTED"

        elif action == "bypass_onlyOwner_modifier":
            new_state["modifier_bypassed"] = True
            new_state["access_level"] = "MODIFIER_BYPASS"

        new_state["state_hash"] = self._hash_state(new_state)
        return new_state

    def reward_signal(
        self, state: Dict[str, Any]
    ) -> float:
        """
        Reward = access level delta per call step.
        Maximum reward on full admin/owner control.
        """
        level = state.get("access_level", "NONE")
        level_map = {
            "NONE": 0.0,
            "ROLE_GRANTED": 30.0,
            "MODIFIER_BYPASS": 50.0,
            "REINIT": 60.0,
            "PROXY_CONTROL": 80.0,
            "OWNER": 100.0
        }
        base = level_map.get(level, 0.0)

        # Depth bonus — deeper escalation paths preferred
        depth_bonus = state.get("call_depth", 0) * 2.0

        # Proxy control is highest value
        if state.get("storage_slots", {}).get(
            "implementation"
        ) == "ATTACKER_CONTRACT":
            base = max(base, 80.0)

        return base + depth_bonus

    def stochastic_seed(
        self, base_state: Dict[str, Any]
    ) -> Dict[str, Any]:
        seed = copy.deepcopy(base_state)
        seed["current_caller"] = "0x" + "".join(
            random.choices("0123456789abcdef", k=40)
        )
        seed["access_level"] = "NONE"
        seed["call_depth"] = random.randint(0, 3)
        seed["execution_step"] = 0
        return seed