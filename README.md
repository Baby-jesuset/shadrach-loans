# LoanFlow Admin

SACCO loan management admin dashboard — members, loans, repayments, reports, and settings. Built with React, TanStack Start/Router, and Tailwind CSS. Demo data is stored in-memory in the browser.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080).

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Use **Build command:** `npm run build` and **Install command:** `npm install`.

Vercel sets `VERCEL=1` during build, which enables the Nitro adapter (required for TanStack Start on Vercel). No environment variables are needed for the mock demo.

## Deploy to Cloudflare (optional)

```bash
npm run build
npx wrangler deploy
```
