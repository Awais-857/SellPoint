# SellPoint React frontend

## Development

This frontend uses Vite.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

## Environment variables

Vite exposes client-side environment variables prefixed with `VITE_`. Do not put secrets in these values.

Create a local `.env.local` file in this directory:

### Demo Mode

```env
VITE_DATA_MODE=demo
```

### API Mode

```env
VITE_DATA_MODE=api
VITE_API_URL=https://your-api-host
```

Use the actual API base URL for your environment. Do not include a guessed URL. API Mode remains the default; when no mode is supplied, configure `VITE_API_URL`.

## Tests and production build

```bash
npm test
npm run build
npm run preview
```

The production build is written to `dist/`.
