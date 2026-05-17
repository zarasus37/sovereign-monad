# BaseAdversarialAgent

def seed_threads(
    self,
    base_state: 'ContractState',
    counterexamples: List[str],
    attck_techniques: List[str],
    n: int
) -> List['ContractState']:
    """
    Divergent seeding — three priority tiers:
    1. Stage B counterexample seeds (proven math failures)
    2. ATT&CK technique seeds (documented patterns)
    3. Domain stochastic seeds (unexplored state space)
    Zero-days live in tier 3 — tiers 1+2 calibrate MCTS globally.
    """
    seeds = []

    # Tier 1: Stage B counterexample seeds
    for cex_id in counterexamples:
        if len(seeds) >= n:
            break
        seed = base_state.copy()
        seed.counterexample_ref = cex_id
        seed.execution_step = 0
        seeds.append(seed)

    # Tier 2: ATT&CK technique seeds
    for technique_id in attck_techniques:
        if len(seeds) >= n:
            break
        seed = base_state.copy()
        seed.attck_technique_id = technique_id
        seed.execution_step = 0
        seeds.append(seed)

    # Tier 3: Domain stochastic (fill remaining slots)
    while len(seeds) < n:
        seeds.append(self.stochastic_seed(base_state))

    return seeds[:n]

def extract_best_path(self, root: 'MCTSNode') -> List['StepRecord']:
    """
    Walks highest-value path from root to terminal/leaf.
    Produces the step_map that KillChainDetector indexes.
    """
    from .models.contract_state import StepRecord
    path = []
    node = root
    step = 0

    while node.children:
        best = max(node.children, key=lambda c: c.value)
        if best.action and best.state:
            path.append(StepRecord(
                step=step,
                action=best.action,
                state_hash=self._hash_state(best.state),
                reward=best.value / max(best.visits, 1),
                execution_context=dict(best.state),
                attck_technique_id=best.state.get(
                    "attck_technique_id"
                ),
                estimated_value=best.state.get(
                    "estimated_value", 0.0
                )
            ))
        node = best
        step += 1

    return path

def _hash_state(self, state: Dict[str, Any]) -> str:
    import hashlib, json
    hashable = {
        k: state[k] for k in [
            "contract_address", "storage_slots",
            "current_caller", "call_depth",
            "balance", "execution_step"
        ] if k in state
    }
    return hashlib.sha256(
        json.dumps(hashable, sort_keys=True).encode()
    ).hexdigest()[:16]

def stochastic_seed(
    self, base_state: 'ContractState'
) -> 'ContractState':
    """
    Override in each domain agent for domain-specific
    stochastic entry point generation.
    Default: randomize caller address.
    """
    seed = base_state.copy()
    import random
    seed.current_caller = "0x" + "".join(
        random.choices("0123456789abcdef", k=40)
    )
    seed.execution_step = 0
    return seed
