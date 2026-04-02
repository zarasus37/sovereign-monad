# monad-market-agent

Monad-side market feed for the Sovereign Monad cross-chain MEV path.

## Role

- reads Monad venue state
- publishes normalized snapshots to `market.monad.price-snapshot`
- feeds the spread scanner in the canonical Monad/Ethereum runtime path

Use the MOF for canonical phase and blocker status.
