# Pawelle Constitution

Project-wide rules. Every spec, plan, task and line of code must comply. If a spec conflicts with this file, the constitution wins; change it here deliberately, never silently in a spec.

**Purpose:** a local-first, offline pet well-being companion, built for Shontu and their pet Pinky. Open-weight AI (Gemma via Ollama) turns what the owner tells us into daily food, play and care suggestions.

---

## I. Local-first and private (non-negotiable)

1. All data lives in one local SQLite file. No accounts, no cloud sync, no analytics, no telemetry.
2. No external network calls at runtime: no CDNs, hosted fonts, remote APIs or closed-model APIs. The only allowed network target is Ollama on `localhost`.
3. The server binds to `127.0.0.1` only.
4. The app must be fully usable with Wi-Fi off. This is a demo scenario and the core "why open" argument.
5. Users can export all their data as JSON and delete it.

## II. AI guardrails (non-negotiable)

1. **Safety before the model.** A deterministic rules layer checks for red flags (toxic ingestion, no eating for more than 24h, vomiting blood, labored breathing, collapse, seizures) before any LLM call. If triggered, show the urgent vet banner and skip the model. The model never improvises on emergencies.
2. **Not a vet.** Pawelle gives general wellness suggestions, never diagnoses, never names medication or dosages, never replaces a vet. Every AI output is shown with a short "Pawelle is not a vet" note.
3. **Allergies and conditions are hard constraints.** They go into the prompt as rules and are enforced again by a post-filter on the output. A plan containing a listed allergen is rejected, never shown.
4. **Untrusted output.** Model responses must be requested as structured JSON, validated with `zod`, retried once on failure, then replaced by a safe fallback message. Raw model text is never rendered as HTML.
5. **Grounded, not invented.** The model only receives the pet profile, recent check-ins, weight trend and upcoming events. If the data is thin, say so and suggest what to add rather than guess.
6. **Explainable.** Each recommendation carries a one-line "why".
7. **Uncertainty is honest.** For health worries beyond the rules layer, the answer is "check with your vet", not a guess.
8. **Prompts are inputs, not instructions.** User-entered text (notes, questions) is passed as data and cannot change system rules. No tool use, no autonomous actions, no agent orchestration: one prompt in, one validated answer out.
9. **Reproducible.** Store the model name with every saved plan. Model name comes from `OLLAMA_MODEL`, never hard-coded.

## III. Simple on top, deep underneath

1. Follow the depth ladder: Glance (0 taps), Act (3 to 5 taps), Explore (opt-in), Tune (settings only).
2. A feature not needed for Level 0 or 1 never appears on the Today screen.
3. Prefer chips, buttons and defaults over typing. A daily check-in takes under 10 seconds.
4. Only four nav tabs: Today, Plan, Track, Ask. Everything else lives in settings or the pet menu.
5. Ask for the minimum. Only the pet's name and species are required; everything else is optional and improves suggestions.

## IV. Friendly and calm behavior

1. Tone: warm, encouraging, plain language. No medical jargon on the surface and never fear-based wording outside real red flags.
2. Errors never blame the user and always say what to do next (for example, show the exact command to start Ollama).
3. Empty states are friendly and actionable: one sentence and one button.
4. Slow AI is expected (10 to 40 seconds). Always show progress with a skeleton and a message; never freeze the screen.
5. Never lose user input: forms keep their values on error; destructive actions ask for confirmation and are reversible where practical.
6. Urgent vet banners are the only loud UI element. Everything else stays calm.

## V. Accessibility baseline

1. Semantic HTML, labelled inputs, visible focus ring, full keyboard operation.
2. Text contrast at least 4.5:1; touch targets at least 44px.
3. Status is never conveyed by color alone: pair it with an icon and a word.
4. Respect `prefers-reduced-motion`; motion stays between 150 and 250ms.
5. Mobile-first layout that also works on desktop.

## VI. Technology (no extras)

| Layer | Choice |
|---|---|
| Frontend | React + Vite, React Router, Tailwind CSS, `@fontsource/nunito` |
| Backend | Node + Express, one process |
| Database | SQLite via `better-sqlite3` |
| Validation | `zod` on every request and every model response |
| AI | Gemma (open weights) through Ollama |

1. Do not add a dependency without a reason written in the plan. Prefer the platform and the standard library.
2. Out of scope: accounts, cloud sync, photos or vision, push notifications, Redux, agent frameworks, vector databases, and anything else on the overview's Cut list.

## VII. Quality bar (just enough)

1. Pure safety logic (`safety.js`, allergy post-filter) must have unit tests.
2. One integration test covers the plan flow with a mocked Ollama.
3. Every AI-facing feature has a documented failure path (Ollama down, model missing, bad JSON, timeout) and it is manually tested.
4. Lint passes before a task is marked done.

## VIII. Spec-driven workflow

1. Order per feature: specify, clarify, plan, tasks, analyze, implement. No implementation before spec, plan and tasks exist.
2. Specs describe behavior and acceptance criteria only; technology choices belong in the plan.
3. If code and spec disagree, update the spec first, or fix the code. Never leave them divergent.
4. Keep scope to the overview's priorities: P0 first, then P1, with P2 as roadmap.

---

**Version:** 1.0 | **Ratified:** 2026-10-05
