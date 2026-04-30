# Claude Handoff

This is the current direct handoff for continuing the Sovereign Monad / `monad-mev` build from the local workspace.

## 1. Repo split

There are two active repos:

- runtime, commercial, deployment repo:
  - `C:\Users\crisc\Dev\agents\monad-mev`
- canonical contracts and sequencing repo:
  - `C:\Users\crisc\Dev\agents\sovereign-monad`

Use `sovereign-monad` as the canonical authority for:

- MOF
- Phase 1a contract and deployment truth
- canonical sequencing

Use `monad-mev` for:

- runtime services
- commercial stack
- GameFi control packages
- speech service

## 2. Canonical files

Canonical MOF:

- `C:\Users\crisc\Dev\agents\sovereign-monad\docs\sovereign_monad_MOF_v2.3.0.md`

Local mirror:

- `C:\Users\crisc\Dev\agents\monad-mev\docs\SOVEREIGN_MONAD_ECOSYSTEM_MASTER_OPERATING_FILE_v2.3.0.md`

Canonical build map:

- `C:\Users\crisc\Dev\agents\sovereign-monad\docs\ECOSYSTEM_BUILD_MAP.md`

Canonical sync rules:

- `C:\Users\crisc\Dev\agents\sovereign-monad\docs\CANONICAL_SYNC_DISCIPLINE.md`

Mirror refresh command from `monad-mev`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sync-canonical-mirrors.ps1
```

## 3. Phase 1a status

What is done:

- reconstructed Phase 1a contract suite exists
- deeper invariant coverage exists
- local deploy sequence runner exists
- local rehearsal exists
- live preflight exists
- live post-deploy verification exists

Current contract signal:

- `13` passing Hardhat tests

Key files:

- `C:\Users\crisc\Dev\agents\sovereign-monad\test\phase1a.reconstruction.js`
- `C:\Users\crisc\Dev\agents\sovereign-monad\test\phase1a.expansion.js`
- `C:\Users\crisc\Dev\agents\sovereign-monad\scripts\phase1a-sequence.js`
- `C:\Users\crisc\Dev\agents\sovereign-monad\scripts\deploy-phase1a.js`
- `C:\Users\crisc\Dev\agents\sovereign-monad\scripts\rehearse-phase1a.js`
- `C:\Users\crisc\Dev\agents\sovereign-monad\scripts\preflight-phase1a.js`
- `C:\Users\crisc\Dev\agents\sovereign-monad\scripts\verify-phase1a.js`
- `C:\Users\crisc\Dev\agents\sovereign-monad\docs\PHASE1A_DEPLOYMENT_SEQUENCE.md`

Current live blocker:

- deployer wallet needs more MON before retrying the live Phase 1a deployment sequence

## 4. Live deployment inputs

Verified RPC:

- `PHASE1A_RPC_URL=https://broken-silent-sun.monad-mainnet.quiknode.pro/fdab66d003756e8c27caf17b5ff16eb233222911`
- verified `eth_chainId = 143`

Current effective local roles in `sovereign-monad`:

- deployer:
  - `0x54D928b0593db01BB46b2A5D0c2e4365C6Ac881F`
- founder:
  - `0xD86Ed529AB21D84eFF8Fe13261eaeC589BA9Ae66`
- bootstrap approved source:
  - `0x9d4fcf7E0Ae5AE994A6eb0bCCbDfAA62E5867352`

Local config files:

- `C:\Users\crisc\Dev\agents\sovereign-monad\.env.phase1a`
- `C:\Users\crisc\Dev\agents\sovereign-monad\config\phase1a.deploy.json`

Current funding guidance:

- hard fail floor: `1 MON`
- recommended deploy budget: `10 MON`

## 5. Approved source truth

Critical rule:

- the Stake-linked source is not deployed yet
- the bootstrap source is the truthful Phase 1a starting point
- do not describe the Stake-linked source as live until it is deployed and registered on-chain

Relevant files:

- `C:\Users\crisc\Dev\agents\sovereign-monad\docs\PHASE1A_DEPLOYMENT_SEQUENCE.md`
- `C:\Users\crisc\Dev\agents\sovereign-monad\docs\sovereign_monad_MOF_v2.3.0.md`
- `C:\Users\crisc\Dev\agents\sovereign-monad\config\phase1a.deploy.example.json`

## 6. GameFi control work status

### 6.1 Slot governance handoff

This landed in `sovereign-monad`.

Files:

- `C:\Users\crisc\Dev\agents\sovereign-monad\docs\SLOT_SOURCE_HANDOFF.md`
- `C:\Users\crisc\Dev\agents\sovereign-monad\scripts\slot-source-handoff.js`
- `C:\Users\crisc\Dev\agents\sovereign-monad\config\slot-source-handoff.example.json`

### 6.2 GameFi control core

This now exists and is verified in the main `monad-mev` workspace.

Files:

- `C:\Users\crisc\Dev\agents\monad-mev\gamefi-control-core\README.md`
- `C:\Users\crisc\Dev\agents\monad-mev\gamefi-control-core\config\gamefi-source.example.json`
- `C:\Users\crisc\Dev\agents\monad-mev\gamefi-control-core\src\source-state.ts`
- `C:\Users\crisc\Dev\agents\monad-mev\gamefi-control-core\src\monitor.ts`
- `C:\Users\crisc\Dev\agents\monad-mev\gamefi-control-core\tests\source-state.test.ts`

Verified:

- `cmd /c npm run build`
- `cmd /c npm test`

### 6.3 GameFi control frontend

This now exists and is verified in the main `monad-mev` workspace.

Files:

- `C:\Users\crisc\Dev\agents\monad-mev\gamefi-control-frontend\README.md`
- `C:\Users\crisc\Dev\agents\monad-mev\gamefi-control-frontend\docs\INTEGRATION.md`
- `C:\Users\crisc\Dev\agents\monad-mev\gamefi-control-frontend\src\App.tsx`
- `C:\Users\crisc\Dev\agents\monad-mev\gamefi-control-frontend\src\components\SourceStatus.tsx`

Modes:

- API mode via `VITE_GAMEFI_API_URL`
- config mode via `VITE_GAMEFI_SOURCE_CONFIG_URL`

Verified:

- `cmd /c npm run build`

### 6.4 GameFi control API

This now exists and is verified in the main `monad-mev` workspace.

Files:

- `C:\Users\crisc\Dev\agents\monad-mev\gamefi-control-api\README.md`
- `C:\Users\crisc\Dev\agents\monad-mev\gamefi-control-api\src\index.ts`
- `C:\Users\crisc\Dev\agents\monad-mev\gamefi-control-api\src\source-state.ts`
- `C:\Users\crisc\Dev\agents\monad-mev\gamefi-control-api\tests\source-state.test.js`

Behavior:

- `GET /health`
- `GET /gamefi/source-health`
- config-driven only
- returns `503` when the source config is missing or invalid

Verified:

- `cmd /c npm run build`
- `cmd /c npm test`
- runtime smoke on a fresh port

## 7. Runtime and commercial state

`monad-mev` includes:

- demo package
- API wrapper
- billing scaffold
- license service
- commercial stack
- runtime execution hardening
- risk-engine stress tooling

Important runtime signals:

- `risk-engine`: `28` passing tests
- `monad-market-agent`: build and tests passing after `ISSUE-003` hardening

## 8. Speech service

The workspace now includes:

- `C:\Users\crisc\Dev\agents\monad-mev\speech-gateway`

Files:

- `C:\Users\crisc\Dev\agents\monad-mev\speech-gateway\src\index.ts`
- `C:\Users\crisc\Dev\agents\monad-mev\speech-gateway\src\azure-speech.ts`
- `C:\Users\crisc\Dev\agents\monad-mev\speech-gateway\src\assistant-adapter.ts`
- `C:\Users\crisc\Dev\agents\monad-mev\speech-gateway\public\index.html`
- `C:\Users\crisc\Dev\agents\monad-mev\speech-gateway\public\app.js`
- `C:\Users\crisc\Dev\agents\monad-mev\speech-gateway\tests\speech-gateway.test.js`

Endpoints:

- `GET /health`
- `POST /speech/transcribe`
- `POST /speech/synthesize`
- `POST /speech/respond`
- `POST /speech/assistant-turn`

Important behavior:

- speech input can return spoken replies
- text input stays silent by default
- browser console is available at `/`
- Azure credentials are still required for live STT and TTS

Verified:

- `cmd /c npm run build`
- `cmd /c npm test`
- runtime smoke on a fresh port

## 9. Known constraints

- Phase 1a contracts are reconstructed, not recovered originals
- live Phase 1a deployment has not completed yet
- Stake-linked source is still not real
- GameFi control packages are config-driven until the on-chain path is live
- speech-gateway is backend-complete for first pass, but not yet wired into the main user-facing chat surface

## 10. Safe next actions

Best immediate actions:

1. keep Phase 1a deploy retry ready for when the deployer wallet is funded
2. if more game-control work is needed, keep `gamefi-control-api`, `gamefi-control-core`, and `gamefi-control-frontend` in sync
3. if speech work continues, wire the actual chat surface to `speech-gateway`
4. once funding arrives, run:

```powershell
cd C:\Users\crisc\Dev\agents\sovereign-monad
cmd /c npm run preflight:phase1a
cmd /c npm run deploy:phase1a
cmd /c npm run verify:phase1a
```

## 11. Local git notes

Current visible local state in `monad-mev` includes untracked work for:

- `gamefi-control-api`
- `gamefi-control-core`
- `gamefi-control-frontend`
- `speech-gateway`
- `docs\CLAUDE_HANDOFF.md`
- `ADR-001_price-feed-infrastructure.md`
- `ADR-002_phase1a-deployment-gate.md`
- `gen_wallets.js`

Do not assume the ADR files or `gen_wallets.js` are canonical or ready to commit without review.
