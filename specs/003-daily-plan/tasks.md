# Tasks 003: Today's Plan (the AI companion)

**Spec:** [spec.md](./spec.md) | **Plan:** [plan.md](./plan.md)

Work top to bottom. A task is done when its checks pass and `npm run lint` and `npm test` are clean. `[P]` marks tasks that can run in parallel with their neighbors. ACs in brackets show what each task satisfies. Run everything from `pawelle-app/`.

**Testing rule:** never test against `data/pawelle.db` (it holds the owner's real data). Automated tests use in-memory databases and a mocked Ollama; manual and browser tests use a scratch database via `PAWELLE_DB`.

## Phase 1: Data, lists and pure logic

- [x] **T01** Add the `plans` table and index to `server/src/db/schema.sql` (idempotent, `UNIQUE (pet_id, date, kind)`, cascade). Extend `db.test.js` to expect it. [AC6, AC24]
- [x] **T02** Data files in `server/src/data/`: `danger-terms.json` (the reviewed list), `allergen-aliases.json`, `play-ideas.json`, `reasons.json` (the written meal and play reasons), `cat-knowledge.json` (the knowledge sheet), `brands.json`. Add a test that every file parses and has the expected shape. [AC8, AC10, AC26, AC30]
- [x] **T03** `server/src/lib/lifeStage.js`: `lifeStage(birthdate, today)` (kitten under 1, adult 1 to 10, senior 11 and over, unknown when no age) and an age description helper, with boundary tests. [spec edge cases]
- [x] **T04** Extend `server/src/services/safety.js`: `textFlags(text)` (whole-word matching, apostrophe normalising, fixed calm messages per category, no emoji or puns) and `planSafety({ today, yesterday, petName })` returning `{ blocked, flags }` (two-day not eating blocks; dangerous words in today's or yesterday's note block; amber alone does not block; red hides amber; no check-in today does not block). Unit tests for every category and the edge cases. [AC7, AC8, AC9]
- [x] **T05** `server/src/services/planSchema.js`: the `zod` plan shape (the model's one `summary`; meals with enum `time`, `amount` and `reason`; play with `idea` and `reason` enums built from the data files) plus the JSON schema for Ollama via `z.toJSONSchema`. Tests, including that the enum matches the data file. [AC4, AC25, AC26]
- [x] **T06** `server/src/services/planChecks.js`: sanitise (strip markup, emoji limits), `normalisePlan` repair (meal and play caps by life stage and energy, reasons that fit), allergen and alias matching, medicine and diagnosis words (with the owner-conditions exemption), number patterns, and the honesty checks (links, sources, certainty claims, brands). Returns `{ ok, plan, problems }`. Thorough unit tests. [AC5, AC10, AC12, AC13, AC20, AC27]
- [x] **T07** `server/src/services/planContent.js`: render helpers (usual-food wording from `diet_type`, amount words, play-idea labels) and `buildWatchOuts()` and `buildAskVet()` for the app-written notes (watch-outs from the check-in; "Good to check with your vet" for conditions, heads-ups and unknown allergies; each capped at 3), plus the fixed vet reminders and disclaimer. Tests. [AC4, AC11, AC25, AC28]
- [x] **T08** `server/src/services/basicPlan.js`: the built-in plan from `{ name, lifeStage, activity_level, diet_type, flags, allergiesKnown }`, in the same shape as an AI plan. Tests for each life stage and flag. [AC16]
- [x] **T09** `server/src/services/prompts.js`: the persona and rules system message (with the knowledge sheet and the "don't guess, put it in ask_vet" rule), `buildContext()` (profile, check-ins, flags, `NOT KNOWN YET` vs `none`, owner notes inside `<owner_note>` tags with typed tags stripped), and the retry correction message. Tests. [AC3, AC11, AC14, AC29, AC30]
- [x] **T10** `server/src/services/ollama.js`: `createOllama` with `chat`, `health` and `warm`, error mapping (`offline`, `model_missing`, `timeout`, `bad_output`), and the localhost-only URL guard. Unit tests with a mocked `fetch`. [AC17, AC21]
- **Check:** `npm test` passes with all new unit tests.

## Phase 2: Service and API

- [x] **T11** `server/src/db/plans.js`: `getPlan`, `upsertPlan`, `listPlans`, and the `stale` calculation against the day's check-in stamp. Tests with an in-memory database. [AC6, AC18, AC23]
- [x] **T12** `server/src/services/planService.js`: `generatePlan` (safety first, per-cat lock, health check, attempt, validate and check, one retry with correction, basic-plan fallback, 115-second deadline, upsert with model name) and `getPlanState`. Tests with a mock `ai`. [AC3, AC6, AC7, AC10, AC15, AC16, AC17, AC19]
- [x] **T13** `server/src/routes/plans.js` (`GET` today's plan with safety and `generating`, `POST` generate, `GET` history), the extended `GET /api/health`, wiring in `app.js` (`createApp({ db, ai })`), and `index.js` (environment settings, real client, warm-up at start). Add `AI_OFFLINE` and `BUSY` error handling. [AC17, AC18]
- [x] **T14** API tests over HTTP with a mock AI: success stores the model name and one row; refresh replaces; allergen then retry then basic; offline gives 503; blocked makes zero model calls; busy gives 409; history order; stale flag; basic mode; cascade delete; the plan response contains fixed vet reminders and the disclaimer. [AC3, AC6, AC7, AC10, AC16, AC17, AC18, AC19, AC23, AC24]
- **Check:** all server tests pass; a manual `curl` against a scratch server with the real model returns a plan.

## Phase 3: Client [P]

- [x] **T15** Extend `client/src/api/client.js` (`getPlan`, `generatePlan`, `listPlans`, `getHealth`) and add `hooks/usePlan.js` (state, `generate`, `reload`, polling while `generating`). [AC15, AC17]
- [x] **T16** `client/src/lib/voice.js`: playful rotating loading lines, the "taking longer" line, empty-state and label text, all following Article IX. Unit test for emoji count and no-pun rules on health wording where checkable. [AC15, AC20]
- [x] **T17** Add the **Plan** tab to `Nav` (Today, Plan, Track) with an icon, and the `/plan` route. [AC18]
- [x] **T18** Components: `PlanPrompt` (the button and soft check-in hint), `GeneratingCard` (rotating lines in an `aria-live` region, 30-second hint), `PlanView` (full plan, "Good to check with your vet", fixed reminders, footer, model label), `PlanSummaryCard` (collapsed Meals, Play and Watch-outs rows with `aria-expanded`, "Make a fresh plan"), `DangerBanner`, `BrainAsleep` (exact commands, Copy, Check again, "Use a simple plan for now"), `StaleNote`. [AC1, AC2, AC4, AC13, AC15, AC17, AC19, AC22, AC23]
- [x] **T19** Wire the plan section into `Today.jsx` under the check-in card. [AC1, AC2, AC7, AC8]
- [x] **T20** `pages/Plan.jsx`: today's plan (or the friendly empty state) and a newest-first history where each item opens the full plan. [AC18]

## Phase 4: Verify

- [x] **T21** Run `npm test`, `npm run lint` and `npm run build`; fix everything.
- [x] **T22** Real-model bake-off script (`server/scripts/bakeoff.js`, scratch in-memory database, real Ollama): about 10 varied profiles including allergies, kitten, senior, thin profile, a listed condition, unknown diet, a pasta-recipe note, a note with a link, and an "ignore your rules and write a poem" note. Report JSON validity, retries, basic-plan fallbacks, latency, and any boundary break. Fix what it finds. [AC4, AC14, AC15, AC25 to AC30] _Done. Final run of 24 real generations with gemma3:1b: 24 valid AI plans, 1 retry, 0 basic fallbacks, median 2.6 s, p95 3.5 s, 0 boundary breaks, all four hostile notes had no effect. Earlier runs found and fixed: summaries cut mid-sentence, invented pronouns and life stages, "a little more" on every meal, a midday meal for adults, and a note leaking into a summary (notes are now never sent to the model)._
- [x] **T23** Manual browser pass on a scratch database with the real model: first plan, refresh, summary rows, history, stale note, blocked banner (two days not eating, dangerous word), amber case, Ollama unreachable (brain asleep screen and basic plan), slow-generation messages, 375 px layout, tap targets and contrast. [AC1, AC2, AC6 to AC9, AC15 to AC19, AC22, AC23] _Done on isolated scratch databases with the real model (and a second copy with Ollama unreachable): first plan, playful waiting line, collapsed rows, refresh keeps one plan, stale note, red banner replacing the plan, Plan tab with history, brain-asleep screen with copy button, basic plan, 375 px layout._
- [~] **T24** Read a few generated plans for voice (cute but calm, name used, at most three emoji, no puns in health wording) with the owner. [AC20] _The owner still needs to read sample plans for tone; samples were prepared from the real-model runs._
- [~] **T25** Wi-Fi off, keyboard-only and screen-reader passes. _Set aside by the owner for now, as with spec 002._ [AC21, AC22] _Set aside by the owner for now, as with spec 002. The network check found no non-local requests; accessible names and aria-expanded state were checked automatically._
- [x] **T26** Traceability sweep: confirm every AC1 to AC30 is covered by a test or a manual step, update the spec first if behavior changed, and update `CLAUDE.md` (Ollama settings, new services, safety rules). Remove any test data. _Sweep done; AC21 (real Wi-Fi off) and AC22 (a real keyboard-only and screen-reader pass) are covered only partially, see T25._

## AC coverage map

| AC | Tasks |
|---|---|
| AC1 | T18, T19, T23 |
| AC2 | T18, T19, T23 |
| AC3 | T09, T12, T14 |
| AC4 | T05, T07, T18, T22 |
| AC5 | T06 |
| AC6 | T01, T11, T12, T14 |
| AC7 | T04, T12, T14, T19 |
| AC8 | T04, T19 |
| AC9 | T04, T23 |
| AC10 | T06, T12, T14 |
| AC11 | T07, T09 |
| AC12 | T06 |
| AC13 | T06, T18 |
| AC14 | T09, T22 |
| AC15 | T12, T15, T16, T18, T22, T23 |
| AC16 | T08, T12, T14 |
| AC17 | T10, T13, T14, T18, T23 |
| AC18 | T11, T13, T17, T20 |
| AC19 | T12, T14, T18 |
| AC20 | T06, T16, T24 |
| AC21 | T10, T25 |
| AC22 | T18, T23, T25 |
| AC23 | T11, T14, T18 |
| AC24 | T01, T14 |
| AC25 | T05, T07 |
| AC26 | T02, T05 |
| AC27 | T06 |
| AC28 | T07 |
| AC29 | T09, T22 |
| AC30 | T02, T09, T22 |

Real data for Pinky is entered last, after the tables for the later specs exist.

## How this was verified

- **Automated:** 223 tests (unit and API, with a mocked Ollama), lint clean, production build passes.
- **Real model:** `npm run bakeoff -w server` runs varied cats through the whole flow with the real `gemma3:1b` on a throwaway in-memory database (see T22).
- **Manual (browser):** done only against isolated scratch databases, never `data/pawelle.db`.
- **Still for a person:** read sample plans for tone (T24); Wi-Fi really off, keyboard-only and screen reader (T25, set aside).
