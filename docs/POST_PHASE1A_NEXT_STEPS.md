# Post-Phase-1a Next Steps

This is the immediate operator sequence once the live Phase 1a deployment completes in `sovereign-monad`.

## 1. Verify the live contracts

From:

`C:\Users\crisc\Dev\agents\sovereign-monad`

Run:

```powershell
cmd /c npm run verify:phase1a
```

## 2. Register the bootstrap approved source on-chain

Fill the handoff config and run the governance handoff from:

`C:\Users\crisc\Dev\agents\sovereign-monad`

Artifacts:

- `config/slot-source-handoff.example.json`
- `scripts/slot-source-handoff.js`
- `docs/SLOT_SOURCE_HANDOFF.md`

The source to register is the current bootstrap wallet:

- `0x9d4fcf7E0Ae5AE994A6eb0bCCbDfAA62E5867352`

## 3. Materialize the local GameFi source config in `monad-mev`

From:

`C:\Users\crisc\Dev\agents\monad-mev`

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\init-gamefi-bootstrap-config.ps1
```

This writes:

- `gamefi-control-core/config/gamefi-source.json`

That file is intentionally local-only and ignored by git.

## 4. Start the GameFi control stack

From:

`C:\Users\crisc\Dev\agents\monad-mev`

Run:

```powershell
cd .\gamefi-control-api
cmd /c npm start
```

In a second terminal:

```powershell
cd .\gamefi-control-frontend
cmd /c npm run dev
```

Expected source state after bootstrap registration:

- `BOOTSTRAP_ONLY`

## 5. Run the active package verification pass

From:

`C:\Users\crisc\Dev\agents\monad-mev`

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-active-packages.ps1
```

This validates the current non-Phase-1a-live packages:

- `risk-engine`
- `monad-market-agent`
- `gamefi-control-core`
- `gamefi-control-api`
- `gamefi-control-frontend`
- `speech-gateway`

## 6. Optional speech service bring-up

If voice I/O is needed for the next phase, configure:

- `speech-gateway/.env`

Then run:

```powershell
cd .\speech-gateway
cmd /c npm start
```

Open:

```text
http://localhost:4030/
```

## 7. Immediate next build frontier after this handoff

Once the live Phase 1a deploy and bootstrap source registration are complete, the next work should be:

1. first live routing proof
2. GameFi control API/UI confirmation
3. resumed runtime execution-truth work and guarded-live sequencing
