# Pawelle: Project Overview

> A local-first, offline pet well-being companion. The owner tells Pawelle about their pet; an open-weight model (Gemma via Ollama) turns that into daily food, play and care recommendations. Nothing leaves the laptop.

Hacktoberfest 2026 Weekend Challenge (Build for a Friend). Deadline: **Oct 5, 2026, 6:59 AM UTC**.

## 0. Guiding principle: simple on top, deep underneath

Every screen follows a **depth ladder**. A user never has to climb it, and can always go further.

| Level | Name | What the user sees | Effort |
|---|---|---|---|
| 0 | Glance | Today screen: pet mood and one suggested action | 0 taps |
| 1 | Act | Quick check-in, then "Get today's plan" | 3 to 5 taps |
| 2 | Explore | Plan details, weight chart, history, "Can they eat this?", Ask Pawelle | Opt-in |
| 3 | Tune | Model switcher, tone and units, prompt notes, data export, multi-pet | Settings only |

Rule: **a feature that is not needed for Level 0 or 1 never appears on the Today screen.** It lives one tap deeper.

## 1. Tech architecture

### 1.1 Stack (no extras)

| Layer | Choice | Notes |
|---|---|---|
| Frontend | React + Vite, React Router, Tailwind CSS | No Redux. State is local component state plus a small `fetch` hook. |
| Backend | Node + Express | One process. Bind to `127.0.0.1` only. |
| Database | SQLite via `better-sqlite3` | A single file, `data/pawelle.db`. |
| Validation | `zod` | Validates requests and LLM output. |
| AI | Gemma (open weights) served by **Ollama** at `localhost:11434` | Model name is an env var (`OLLAMA_MODEL`). Confirm the current Gemma tag with `ollama list`. |
| Charts | Hand-rolled SVG or a tiny chart lib | Weight trend only. |
| Fonts | `@fontsource/nunito` | Self-hosted so it works offline. |
| Dev | `concurrently` with one `npm run dev` | npm workspaces: `client/`, `server/`. |

### 1.2 Shape

```
Browser (React, :5173)
   |  fetch /api/*  (Vite proxy to :3001)
Express API (:3001, 127.0.0.1)
   |-- routes/        pets, checkins, plans, weights, ask, food, health
   |-- services/
   |     |-- ollama.js    chat() with JSON schema, timeout, one retry
   |     |-- prompts.js   system prompt + context builders
   |     |-- safety.js    deterministic red-flag rules, run BEFORE the LLM
   |-- db/            schema.sql, queries (better-sqlite3)
   |-- data/          toxic-foods.json (static, curated list)
   |
   |-- SQLite file          Ollama (Gemma, local)
```

### 1.3 Data model (5 tables)

```
pets        id, name, species, breed, birthdate, sex, neutered, weight_kg,
            activity_level, allergies (json), conditions (json), diet_type,
            notes, created_at
checkins    id, pet_id, date, mood, appetite, energy, play_minutes,
            walked, poop_ok, note
plans       id, pet_id, date, kind (daily|weekly), model, content (json),
            created_at
weights     id, pet_id, date, weight_kg
events      id, pet_id, date, type (vet|vaccine|meds|other), title, notes,
            remind_on
```

`plans.content` stores the validated JSON the model returned, so history costs no extra LLM calls.

### 1.4 API

```
GET/POST        /api/pets            GET/PUT/DELETE /api/pets/:id
POST/GET        /api/pets/:id/checkins
POST/GET        /api/pets/:id/weights
POST/GET        /api/pets/:id/events
POST            /api/pets/:id/plan        generate (daily|weekly)
GET             /api/pets/:id/plans       history
POST            /api/pets/:id/ask         free-form question grounded in profile
POST            /api/food/check           "can my pet eat X?"
GET             /api/health               { server, ollama, model }
GET/POST        /api/export  /api/import  JSON backup
```

### 1.5 The AI flow (the core of the project)

1. **Build context.** Collect the pet profile, the last 7 check-ins, the weight trend and any upcoming events. Keep it compact (a few hundred tokens).
2. **Safety pre-check.** Run `safety.js`. It is a plain rules layer: ingested chocolate, xylitol, grapes or lilies, no eating for more than 24 hours, vomiting blood, or labored breathing. If it triggers, return an **urgent vet banner** and skip the LLM, because the model should not improvise on emergencies.
3. **Call Ollama** at `/api/chat` with a JSON schema in `format` (structured output), `temperature` around 0.4, and a timeout.
4. **Validate** with `zod`. On failure, retry once with the error appended. If it still fails, show a graceful fallback.
5. **Persist** the plan and return it.

Plan output schema:

```json
{
  "summary": "one friendly sentence",
  "meals":   [{ "time": "morning", "what": "...", "portion": "...", "why": "..." }],
  "play":    [{ "activity": "...", "minutes": 15, "why": "..." }],
  "watch_outs": ["..."],
  "see_a_vet_if": ["..."]
}
```

Every response is wrapped in a UI-level disclaimer: *Pawelle is not a vet.*

### 1.6 Failure modes to handle (these make it feel finished)

- **Ollama not running or model missing.** `/api/health` drives a friendly "Pawelle's brain is asleep" screen with the exact command to run.
- **Slow generation.** A local model can take 10 to 40 seconds. Use a skeleton and rotating messages, and optionally stream via SSE as a stretch goal.
- **Invalid JSON.** Retry once, then fall back.
- **Allergies.** Include them as hard constraints in the prompt, and post-filter the output against the allergy list, because the model must never suggest a listed allergen.

### 1.7 Privacy and offline

No telemetry, no CDN, no external calls. Fonts and assets are bundled. Wi-Fi off is a first-class demo scenario, and it is the "why open" story.

### 1.8 Testing (just enough)

- Unit tests for `safety.js` and the allergy post-filter (pure functions).
- One integration test with a mocked Ollama.
- Manual pass with the real friend's pet data.

## 2. Features by depth

| Priority | Feature | Level |
|---|---|---|
| **P0** | Onboarding, pet profile, daily check-in, Today's plan (meals, play, watch-outs), plan history, Ollama health screen, vet disclaimer | 0 to 1 |
| **P1** | Weight tracker + chart, "Can they eat this?" (static toxic list first, LLM for the rest), Ask Pawelle (short Q&A grounded in the profile), checkable plan items | 2 |
| **P2** | Weekly meal plan, health events and reminders, printable "vet summary", JSON export and import, multi-pet, model switcher, dark mode | 2 to 3 |
| **Cut** | Accounts, cloud sync, videos, AI vision (photos are never analysed), push notifications, anything agentic | n/a |

Photos: up to 2 local photos per pet are in scope (avatar and profile). Images only, no video, stored on the device, never sent to the model.

P0 and the cheap P1 items are the one-day target. Everything else is mentioned in the post as the roadmap.

## 3. UI and UX plan

### 3.1 Personality

Warm, calm and encouraging, like a friend who knows your pet. Rounded shapes, soft color, plain language, and no medical jargon on the surface.

### 3.2 Color tokens

| Token | Hex | Use |
|---|---|---|
| `bg` | `#FFF9F2` | Page background (warm cream) |
| `surface` | `#FFFFFF` | Cards |
| `ink` | `#2B2623` | Primary text |
| `muted` | `#6F645C` | Secondary text |
| `primary` | `#C2461E` | Main buttons and active tab (white text is about 5:1) |
| `primary-soft` | `#FDE3D6` | Primary tints, selected chips |
| `sage` | `#3F6B4C` | Positive and "good" states (text-safe) |
| `sage-soft` | `#DDEBDF` | Positive backgrounds |
| `butter` | `#FFD98A` | Highlights, streaks, celebration |
| `sky-soft` | `#D9ECF7` | Play and activity cards |
| `attention` | `#9A5B00` on `#FFF1D6` | Needs attention |
| `urgent` | `#B3261E` on `#FDE7E5` | Vet-now banner |

Verify contrast in the browser before finishing. Never rely on color alone, so pair every status with an icon and a word. A dark theme is a P2 token swap.

### 3.3 Type, shape, motion

- **Font:** Nunito (rounded, friendly, self-hosted). Scale 14 / 16 / 20 / 28 / 36.
- **Shape:** 16 to 20px card radius, pill chips, soft layered shadows, an 8px spacing grid.
- **Touch:** targets are at least 44px.
- **Motion:** 150 to 250ms ease-out. Staggered card entrance, chip "pop" on select, a small paw burst when a plan item is checked, a gentle skeleton shimmer while generating. Respect `prefers-reduced-motion`.

### 3.4 Navigation

Mobile-first. A **bottom tab bar** on small screens and a **left rail** on desktop. Four tabs only:

1. **Today** (home)
2. **Plan** (plan history, weekly)
3. **Track** (weight, events, check-in history)
4. **Ask** (Q&A and "Can they eat this?")

The pet avatar in the top corner opens the pet switcher, profile and settings. Nothing else goes in the nav.

### 3.5 Today screen (the whole product at Level 0 to 1)

```
+-------------------------------------+
|  Good morning!              (Milo)  |  <- greeting + pet switcher
|                                     |
|  How's Milo today?                  |  <- check-in card
|  Mood      (:) (:|) (:()            |
|  Appetite  [Great][OK][Low]         |
|  Energy    [High][Chill][Sleepy]    |
|  [ Save check-in ]                  |
|                                     |
|  [   Get today's plan   ]           |  <- single primary CTA
|                                     |
|  Today's plan                       |
|  > Meals       2 meals  [details v] |  <- collapsed by default
|  > Play        25 min   [details v] |
|  > Watch-outs  1 note   [details v] |
|                                     |
|  Pawelle knows Milo 60%  [Add more] |  <- gentle depth nudge
+-------------------------------------+
|  Today   Plan   Track   Ask         |
+-------------------------------------+
```

### 3.6 Key UX decisions

- **Onboarding is 3 short steps:** name and species, basics (age, weight, activity), and health (allergies and conditions, skippable). Three steps, one screen each.
- **Chips and big buttons beat typing.** A check-in takes under 10 seconds.
- **Profile completeness ring.** "Pawelle knows Milo 60%" encourages adding detail without forcing it, and better data gives better plans. This is how deep-dive users find their way in.
- **Plan cards are summaries first.** Tap to expand reasons, portions and alternatives.
- **"Why?" on everything.** Each recommendation has a one-line reason, which builds trust.
- **Empty states are friendly and actionable,** with an illustration, one sentence and one button.
- **Errors never blame the user.** The Ollama-offline screen shows one copyable command.
- **Safety stays visible but calm.** A small footer note on plans, and a full-width urgent banner only for red flags.
- **Settings is the junk drawer for Level 3,** so power features never clutter the main flow.

### 3.7 Accessibility baseline

Semantic HTML, labelled inputs, a visible focus ring, full keyboard operation, contrast of at least 4.5:1 for text, status shown by icon plus text, and reduced-motion support.

## 4. Suggested repo layout

```
pawelle-app/
  docs/OVERVIEW.md
  client/   src/{pages,components,hooks,styles}
  server/   src/{routes,services,db,data}
  data/     pawelle.db (gitignored)
  README.md
```

## 5. Build order (one-day plan)

1. Scaffold the workspaces, Express health route and Ollama ping. Test a raw Gemma prompt in the terminal first.
2. SQLite schema, `pets` and `checkins` routes.
3. `ollama.js`, `prompts.js`, `safety.js` and `POST /plan`, with the JSON schema and `zod`.
4. UI shell, tokens, onboarding and the Today screen.
5. Plan cards, loading and error states, and plan history.
6. P1 extras in this order: "Can they eat this?", weight chart, Ask.
7. Test with the real pet, record the demo (including Wi-Fi off), and write the post.
