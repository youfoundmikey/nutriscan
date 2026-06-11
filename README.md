# NutriScan

AI nutrition tracker: scan food photos, get healthier restaurant picks, and log meals manually. Built with Next.js, designed mobile-first, installable as a web app.

## Features
- **Scan** — photograph your food; Claude vision estimates calories and macros, you review and log.
- **Eat Out** — pick a restaurant/chain (+ optional craving and goal); AI suggests healthier menu picks you can log in one tap.
- **Log** — manual entry, with an optional "describe it and let AI estimate" assist.
- **Today** — calorie ring vs. your goal (tap the goal to edit), macro totals, and your meal list. Data is stored on-device (localStorage).

## Run locally
1. `cp .env.local.example .env.local` and paste your Anthropic API key.
2. `npm install`
3. `npm run dev` → http://localhost:3000

## Deploy to Vercel
1. Push this folder to a GitHub repo.
2. On vercel.com → **Add New Project** → import the repo (defaults are fine).
3. In **Settings → Environment Variables**, add `ANTHROPIC_API_KEY` with your key, then deploy.

## Install on your phone
Open your deployed URL in the browser, then:
- **iPhone (Safari):** Share button → **Add to Home Screen**.
- **Android (Chrome):** Menu (⋮) → **Add to Home screen** / **Install app**.

It opens full-screen like a native app.

## Notes
- Nutrition numbers are AI estimates — always editable before logging.
- Your API key stays server-side (used only in the API routes), never shipped to the browser.
