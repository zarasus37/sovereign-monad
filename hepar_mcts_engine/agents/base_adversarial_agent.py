import asyncio
import math
import random
import copy
import inspect
from typing import List, Dict, Any, Optional


class MCTSNode:
    def __init__(self, state: Dict[str, Any], parent: Optional['MCTSNode'] = None, action: Optional[str] = None):
        self.state = state
        self.parent = parent
        self.action = action
        self.children: List['MCTSNode'] = []
        self.visits = 0
        self.value = 0.0


class BaseAdversarialAgent:
    """
    Universal internal architecture for all Hepar agents.
    Minimal safety hardening: per-worker state isolation, awaitable reward handling,
    and guarded UCB1 computation.
    """
    def __init__(self, domain_config: Dict[str, Any]):
        self.domain_config = domain_config or {}
        self.agent_id = self.__class__.__name__

    async def run_campaign(self, initial_state: Dict[str, Any], n_threads: int = 10, time_limit_sec: int = 30) -> Dict[str, Any]:
        """Runs N parallel reasoning threads using asynchronous MCTS."""
        print(f"[{self.agent_id}] Initiating adversarial campaign with {n_threads} parallel MCTS threads.")

        # Each worker must operate on an isolated copy of the initial state
        tasks = [self._mcts_worker(copy.deepcopy(initial_state), time_limit_sec) for _ in range(n_threads)]
        results = await asyncio.gather(*tasks)

        return self._synthesize_results(results)

    async def _mcts_worker(self, initial_state: Dict[str, Any], time_limit_sec: int) -> MCTSNode:
        # Isolate the root state per worker to avoid shared mutations
        root = MCTSNode(state=copy.deepcopy(initial_state))
        loop = asyncio.get_running_loop()
        end_time = loop.time() + float(time_limit_sec)

        while loop.time() < end_time:
            # 1. Select
            node = self._select(root)

            # 2. Expand
            if not self._is_terminal(node.state):
                node = self._expand(node)

            # 3. Simulate
            reward = await self._simulate(node.state)

            # 4. Backpropagate
            self._backpropagate(node, float(reward))

            # Yield control back to event loop to ensure parallel thread concurrency
            await asyncio.sleep(0)

        return root

    def _select(self, node: MCTSNode) -> MCTSNode:
        current = node
        while current.children:
            current = max(current.children, key=self._ucb1)
        return current

    def _expand(self, node: MCTSNode) -> MCTSNode:
        actions = self.get_possible_actions(node.state) or []
        random.shuffle(actions)
        for action in actions:
            # Apply action to a deep copy of the state to avoid in-place mutations
            new_state = self.apply_action(copy.deepcopy(node.state), action)
            child = MCTSNode(state=new_state, parent=node, action=action)
            node.children.append(child)
        return random.choice(node.children) if node.children else node

    async def _simulate(self, state: Dict[str, Any]) -> float:
        """Stochastic simulation phase. Accepts sync or async reward_signal implementations."""
        result = self.reward_signal(state)
        if inspect.isawaitable(result):
            return await result
        return result

    def _backpropagate(self, node: MCTSNode, reward: float):
        current = node
        while current is not None:
            current.visits += 1
            current.value += reward
            current = current.parent

    def _ucb1(self, node: MCTSNode, c: float = 1.414) -> float:
        # If node has not been visited, prioritize it for exploration
        if node.visits == 0:
            return float('inf')

        parent_visits = 1
        if node.parent is not None:
            parent_visits = max(1, node.parent.visits)

        # Safe log computation and classic UCB1 formula
        try:
            exploration = c * math.sqrt(math.log(parent_visits) / node.visits)
        except Exception:
            exploration = 0.0

        exploitation = node.value / node.visits
        return exploitation + exploration

    def _synthesize_results(self, roots: List[MCTSNode]) -> Dict[str, Any]:
        """Synthesizes parallel tree searches into a typed finding with confidence."""
        total_visits = sum(root.visits for root in roots)
        total_value = sum(root.value for root in roots)

        avg_reward = total_value / max(total_visits, 1)

        # Allow agents to provide a domain-specific reward scaling value
        reward_scale = float(self.domain_config.get('reward_scale', 100.0))

        confidence = min(1.0, max(0.0, avg_reward / reward_scale))

        return {
            "agent": self.agent_id,
            "confidence": confidence,
            "total_paths_explored": int(total_visits),
            "finding": "Counterexample Identified" if confidence > 0.75 else "Proved Safe / Unknown",
            "metadata": {"avg_reward": avg_reward, "reward_scale": reward_scale}
        }

    def _is_terminal(self, state: Dict[str, Any]) -> bool:
        return bool(state.get("is_terminal", False))

    # --- Methods to be overridden by the specific Hepar Agents ---
    def get_possible_actions(self, state: Dict[str, Any]) -> List[str]:
        """Domain-specific state mutations."""
        return []

    def apply_action(self, state: Dict[str, Any], action: str) -> Dict[str, Any]:
        """Applies mutation to generate child states."""
        return state

    def reward_signal(self, state: Dict[str, Any]) -> float:
        """Agent specializes this to define what a successful exploit looks like.
        May be either sync (return float) or async (return awaitable).
        """
        return 0.0
