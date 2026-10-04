# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Pawelle is a local-first, offline pet well-being companion built for the Hacktoberfest 2026 Weekend Challenge ("Build for a Friend"). An open-weight model (Gemma served by Ollama) turns the owner's pet profile and check-ins into daily food, play and care recommendations. Nothing leaves the laptop.

`pawelle-app/docs/OVERVIEW.md` is the source of truth for architecture, data model, API, AI flow, feature priorities (P0/P1/P2/Cut) and UI tokens. Read it before designing anything. Do not add scope from the "Cut" list (accounts, cloud sync, videos, AI vision, push, agentic orchestration). Up to 2 local photos per pet are allowed; they are never sent to the model.

## Current state

Everything lives in `pawelle-app/`. Only the Vite + React 19 client scaffold exists (`src/App.jsx` is still template code). The planned `server/` (Express + SQLite + Ollama) and npm-workspaces layout (`client/`, `server/`) described in the overview are **not created yet**. The app currently lives at the repo root of `pawelle-app/`, so the workspace restructure is a pending decision.

Known gap: `vite.config.js` and `src/index.css` use Tailwind (`@tailwindcss/vite`, `@import "tailwindcss"`), but `tailwindcss` and `@tailwindcss/vite` are not in `package.json` and not installed. `npm run dev` and `npm run build` will fail until they are added.

## Commands (run from `pawelle-app/`)

```bash
npm run dev       # Vite dev server (client, :5173)
npm run build     # production build to dist/
npm run lint      # ESLint (flat config, JS/JSX)
npm run preview   # serve the built bundle
```

No test runner is configured yet. The overview plans unit tests for `safety.js` and the allergy post-filter, plus one integration test with a mocked Ollama.

## Constraints that shape every change

- **Offline and private:** no CDN, telemetry or external calls. Fonts and assets must be bundled (`@fontsource/nunito`). The Express server binds to `127.0.0.1` only.
- **Safety runs before the LLM:** `server/src/services/safety.js` is a deterministic red-flag rules layer. If it triggers, return the urgent vet banner and skip the model.
- **LLM output is untrusted:** request Ollama structured output (JSON schema in `format`), validate with `zod`, retry once, then fall back. Post-filter plans against the pet's allergy list. Allergies are hard constraints.
- **Model name comes from the `OLLAMA_MODEL` env var**; confirm the Gemma tag with `ollama list`.
- **Depth ladder:** anything not needed for Level 0 or 1 stays off the Today screen.
- Pawelle is not a vet; every plan carries that disclaimer.
