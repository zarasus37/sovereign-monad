# eth-market-agent

Ethereum-side market feed for the Sovereign Monad cross-chain MEV path.

## Role

- reads Ethereum venue state
- publishes normalized snapshots to `market.eth.price-snapshot`
- pairs with `monad-market-agent` through `spread-scanner`

Use the MOF for canonical phase and blocker status.
