# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Pawelle is a local-first, offline pet well-being companion built for the Hacktoberfest 2026 Weekend Challenge ("Build for a Friend"). An open-weight model (Gemma served by Ollama) turns the owner's pet profile and check-ins into daily food, play and care recommendations. Nothing leaves the laptop.

`pawelle-app/docs/OVERVIEW.md` is the source of truth for architecture, data model, API, AI flow, feature priorities (P0/P1/P2/Cut) and UI tokens. Read it before designing anything. Do not add scope from the "Cut" list (accounts, cloud sync, videos, AI vision, push, agentic orchestration). Up to 2 local photos per pet are allowed; they are never sent to the model.

## Current state

Everything lives in `pawelle-app/`, an npm-workspaces repo: `client/` (Vite + React 19 + Tailwind v4) and `server/` (Express + `better-sqlite3`). Features 001 (pet profile, onboarding, photos) and 002 (daily check-in, Track history, two-tab nav) are implemented per `specs/`. Not built yet: the AI plan flow (Ollama, text-based safety rules, plan history), weights, events, and the Plan and Ask tabs.

Spec-driven workflow: the constitution is `.specify/memory/constitution.md`; each feature has `specs/NNN-name/{spec,plan,tasks}.md`. Update the spec first if behavior changes.

## Commands (run from `pawelle-app/`)

```bash
npm run dev                          # server (127.0.0.1:3001) + client (Vite, :5173, proxies /api)
npm run build                        # production build of the client
npm run lint                         # ESLint for client and server
npm test                             # all Vitest tests (client + server)
npx vitest run server/src/routes/api.test.js   # a single test file
npx vitest run -t "completeness"     # tests by name
```

`PORT` sets the Vite port; `PAWELLE_PORT` sets the API port (default 3001); `PAWELLE_DB` points the server at a different SQLite file. Do not mix them up.

**Never test against `data/pawelle.db`:** it holds the owner's real data. For manual or browser testing run a second copy with its own database, e.g. `PAWELLE_DB=/tmp/test.db PAWELLE_PORT=3011 PORT=5181 npm run dev`.

## Architecture notes

- **Database:** one SQLite file at `pawelle-app/data/pawelle.db` (gitignored). On every start `db/index.js` copies it to `data/backups/` (newest 5 kept) and applies numbered upgrade steps tracked by `PRAGMA user_version`. Photos are BLOBs in `pet_photos`, so deleting a pet cascades.
- **"Not answered" vs "none":** `pets.allergies` and `pets.conditions` are `NULL` when unanswered and `[]` when the owner said none. Never treat `NULL` as "no allergies" in AI code.
- **One error shape:** every API failure is `{ error: { code, message, fields? } }` with a friendly message; the client's `api/client.js` turns it into `ApiFailure`.
- **Validation lives in the server** (`server/src/lib/petSchema.js`, zod). `client/src/lib/petForm.js` mirrors it for inline messages; keep the wording in sync.
- **Photos:** the browser resizes to 800px and re-encodes via canvas (this also strips GPS); the server checks real file bytes (`lib/image.js`), max 1 MB, 2 per cat, never sent to the model.
- **Onboarding draft** is kept in `localStorage` (`lib/draft.js`) so a half-finished setup resumes; the pet is created once at the end.
- **Single pet:** `POST /api/pets` returns 409 if one exists. Routes keep the `/api/pets/:id` shape for later multi-pet.

## Constraints that shape every change

- **Offline and private:** no CDN, telemetry or external calls. Fonts and assets must be bundled (`@fontsource/nunito`). The Express server binds to `127.0.0.1` only.
- **Safety runs before the LLM:** `server/src/services/safety.js` is a deterministic red-flag rules layer. If it triggers, return the urgent vet banner and skip the model.
- **LLM output is untrusted:** request Ollama structured output (JSON schema in `format`), validate with `zod`, retry once, then fall back. Post-filter plans against the pet's allergy list. Allergies are hard constraints.
- **Model name comes from the `OLLAMA_MODEL` env var**; confirm the Gemma tag with `ollama list`.
- **Depth ladder:** anything not needed for Level 0 or 1 stays off the Today screen.
- Pawelle is not a vet; every plan carries that disclaimer.
- **Check-ins:** one per cat per local day (`UNIQUE (pet_id, date)`), saved with an idempotent `PUT /api/pets/:id/checkins/:date`. The date is the owner's local date sent by the client; `useToday()` rolls it over after midnight. `null` = unanswered, never a default. `listRecentCheckins(db, petId, 7)` in `server/src/db/checkins.js` is the entry point for the AI plan feature.
- **Safety rules:** `server/src/services/safety.js` holds deterministic flags `{ code, level, message }` (`attention` amber, `urgent` red). Only two consecutive "Not eating" days are red. Feature 003 should extend this file, not add a parallel one.
