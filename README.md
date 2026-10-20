# My Glow-Up ♡

A private, mobile-first wellness planner: meals & portions, chocolate dessert planner, guided workouts with a background-safe timer, weight/measurement/photo progress, habits, groceries generated from your meal plan, and Sunday/Wednesday meal prep.

React + TypeScript + Tailwind + Recharts, installable PWA, all data stored on-device in IndexedDB.

## Run locally
```bash
npm install
npm run dev        # http://localhost:5173
npm test           # nutrition, grocery, date, weight & timer tests
npm run build      # production build in dist/
```

## Deploy to Netlify
Netlify site already created: **my-glow-up-shauna** → https://my-glow-up-shauna.netlify.app

**Option A — drag & drop (fastest):** open https://app.netlify.com/projects/my-glow-up-shauna/deploys and drag the `dist` folder (unzipped `my-glow-up-dist.zip`) onto the page.

**Option B — GitHub (auto-deploys on every push):**
1. Create an empty repo (e.g. `lollisworldlw-hub/my-glow-up`) and push this folder.
2. Netlify → my-glow-up-shauna → Project configuration → Build & deploy → Link repository.
3. Settings come from `netlify.toml` (build `npm run build`, publish `dist`, Node 20).

## Install on iPhone
Open the site in **Safari** → Share → **Add to Home Screen**. It then opens full-screen and works offline.

## Your data
Everything stays on your phone (IndexedDB) — nothing is uploaded, including photos. It can be lost if you clear Safari website data, delete the Home Screen app, or change phones, so use **Settings → Export backup** regularly and save the file to Files/iCloud Drive. **Import backup** restores everything.

Note: data in Safari and in the Home Screen app are separate storage on iOS — pick one (the Home Screen app is recommended) and use it daily.

## Nutrition
Recipes compute calories/protein from per-ingredient values (generic USDA-style estimates, labeled "≈"). Edit any food from its package label in **Settings → Food library**; every recipe using it updates. Cooked vs raw weights are labeled, and grocery lists convert cooked amounts back to raw purchase amounts.
