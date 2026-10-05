# Pawelle 🐾

**A gentle, private pet-wellbeing companion that runs entirely on your own computer.**

Tell Pawelle about your cat, check in once a day, and get a short, kind plan for food and play, written by a small open-weight AI model running locally. No account, no cloud, no data leaving your laptop.

Pawelle was built for a friend, **Shontu**, and her cat **Pinky**.

> Pawelle gives general wellbeing suggestions. **It is not a vet** and never diagnoses or recommends medicine.

---

## What it does

| | |
|---|---|
| **Cat profile** | A three-step onboarding (only the name is required), up to two photos, allergies and conditions, and a "Pawelle knows Pinky 65%" nudge to add more. |
| **Daily check-in** | Mood, appetite, energy, play and litter box in a few taps, or one tap for "just like usual". |
| **Today's plan** | One button asks a local AI model for a short plan: meals, play ideas and things to watch, each with a plain "why". |
| **Track** | A 7-day strip and a history of check-ins. |
| **Calm safety nets** | Gentle heads-ups, and a red "please contact your vet" banner when something looks serious. |

## Why open-source AI?

Pawelle is built around an **open-weight model running locally**, and that choice is what makes it work for this use case:

- **Private by design.** A pet's health, habits and photos stay on your machine. Nothing is sent to a server you don't control.
- **Works offline.** After the one-time model download, every request goes to `localhost`. No API keys, no internet needed.
- **Free to run.** No per-request cost, no subscription.
- **Swap the model with one setting.** Change `OLLAMA_MODEL` and nothing else. Try a smaller model on an old laptop or a larger one for nicer writing.
- **You can inspect and change the behaviour.** The prompt, the safety rules and the allowed options are plain files in this repo.

## How the AI is kept safe

The default model, `gemma3:1b`, is small and fast, and small models confidently make things up. Pawelle does not trust it with anything it doesn't have to. It is a **harness around the model**, not a chatbot:

1. **Safety first, before the model.** Plain code checks for red flags (two days of not eating, dangerous words in a note such as chocolate or lilies). If one is found, the model is **never called** and a calm vet banner is shown instead.
2. **A tiny creative surface.** The model writes **one friendly sentence** and *chooses* meal times, amounts and play ideas from fixed lists. The app writes everything else: the "why" text, watch-outs and "good to check with your vet" notes.
3. **Everything it writes is checked.** Allergens (and their aliases like milk for dairy), medicine and diagnosis words, made-up numbers, links, brand names and claims of certainty are all rejected. One retry, then a clearly labelled built-in basic plan.
4. **Notes never reach the model.** Free-text notes are only scanned for danger words, so they can't be used to steer it.

In a 24-run check with the real model, all 24 plans were valid, the median time was about 2.6 seconds on an Apple Silicon laptop, and none broke the rules. Run it yourself with `npm run bakeoff -w server`.

## Quick start

**You need:** [Node.js](https://nodejs.org) 24 (what it was developed and tested on) and [Ollama](https://ollama.com).

```bash
# 1. Install and start Ollama (macOS shown; see ollama.com for other systems)
brew install ollama
brew services start ollama

# 2. Download the model once (about 815 MB)
ollama pull gemma3:1b

# 3. Install and run Pawelle
cd pawelle-app
npm install
npm run dev
```

Open **http://127.0.0.1:5173**.

No Ollama? Pawelle still works: everything except the AI plan is available, and you can use the built-in basic plan. If the model isn't running you'll see a friendly "Pawelle's brain is asleep" screen with the exact commands to wake it.

### Settings (all optional)

| Variable | Default | Purpose |
|---|---|---|
| `OLLAMA_MODEL` | `gemma3:1b` | Which local model writes the plan. |
| `OLLAMA_URL` | `http://127.0.0.1:11434` | Must be this computer (`localhost`); anything else is refused. |
| `PAWELLE_DB` | `pawelle-app/data/pawelle.db` | Where the data lives (one SQLite file). |
| `PAWELLE_PORT` | `3001` | The local API port. |

For example, to try a larger model: `ollama pull gemma3:4b`, then `OLLAMA_MODEL=gemma3:4b npm run dev`.

Your data is one local SQLite file in `pawelle-app/data/` (never committed). A backup is made each time the server starts, keeping the newest five.

## Privacy and security

Everything stays on your machine: the data is one local SQLite file, the model runs through Ollama on `localhost`, and the app makes no external requests. The server only answers requests that genuinely come from this computer, and it has no accounts or tracking. More detail, and how to report a problem, in [SECURITY.md](SECURITY.md).

## Tests

```bash
cd pawelle-app
npm test        # 200+ unit and API tests (the AI is mocked)
npm run lint
npm run build
```

## Tech

React 19 · Vite · Tailwind CSS v4 · Express 5 · SQLite (`better-sqlite3`) · `zod` · Ollama · Gemma · Vitest. No accounts, analytics, CDNs or external calls.

## How it was built

Pawelle was built with **spec-driven development**, with an AI coding assistant (Claude Code) working under human direction. Each feature was specified first, then planned, then broken into tasks and implemented against them:

- [`.specify/memory/constitution.md`](.specify/memory/constitution.md): the project-wide rules (local-first, AI guardrails, accessibility, Pawelle's voice).
- [`specs/`](specs): one folder per feature with `spec.md`, `plan.md` and `tasks.md`.
- [`CLAUDE.md`](CLAUDE.md): notes for AI assistants working in this repo.

## Roadmap

- **Ask Pawelle**: a friendly Q&A that stays inside everyday cat care and sends health questions to the vet.
- Multiple pets, weight tracking, vet reminders and a weekly plan. See the GitHub Issues for what's planned.

Contributions and ideas are welcome. Open an issue first, and please run the tests and lint before sending changes.

## License and credits

Pawelle is released under the **[MIT License](LICENSE)**.

It stands on open-source work. Nothing below is bundled with the repo except as an installed dependency; the model is downloaded separately by you.

| | License |
|---|---|
| [Ollama](https://github.com/ollama/ollama) (local model runtime) | MIT |
| [Gemma](https://ai.google.dev/gemma) (open-weight model, not included in this repo) | [Gemma Terms of Use](https://ai.google.dev/gemma/terms) |
| React, Vite, Tailwind CSS, Express, `better-sqlite3`, `zod`, Vitest | MIT |
| [Nunito](https://fonts.google.com/specimen/Nunito) typeface (via `@fontsource/nunito`) | SIL Open Font License 1.1 |

Gemma is an open-weight model released under Google's own terms rather than an OSI open-source licence. If you swap in a different model, check its licence too.

Made with care by [@Parth-G27](https://github.com/Parth-G27), for Shontu and Pinky.
