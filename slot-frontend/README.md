# slot-frontend

Frontend scaffold for the slot/stake approved-source lifecycle.

## Modes

`slot-frontend` supports two honest data modes:

1. API mode
   - set `VITE_SLOT_API_URL`
   - reads `GET /slot/source-health`

2. Config mode
   - set `VITE_SLOT_SOURCE_CONFIG_URL` or use the default sample
   - reads a `slot-source.json` file shaped like `slot-core/config/slot-source.example.json`
   - derives lifecycle state client-side

If neither source is available, the UI reports that explicitly.

## Usage

```powershell
cmd /c npm install
cmd /c npm run build
cmd /c npm run dev
```

Copy `.env.example` to `.env` if you want to point the UI at a real API or a different config file.
