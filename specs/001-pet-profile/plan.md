# Plan 001: Pet Profile and Onboarding

**Spec:** [spec.md](./spec.md) | **Constitution:** v1.0 | **Status:** Draft

This plan says HOW. It adds no features beyond the spec.

## 1. Repo restructure (one-time, part of this feature)

The overview calls for npm workspaces. Today the Vite scaffold sits at the root of `pawelle-app/`. Move it so the layout becomes:

```
pawelle-app/
  package.json          # root: workspaces ["client","server"], scripts: dev, lint, test
  client/               # existing Vite scaffold moves here
  server/               # new Express app
  data/                 # pawelle.db (gitignored, created on first run)
  docs/OVERVIEW.md
```

- Root `npm run dev` starts both processes via `concurrently`. Vite proxies `/api` to `127.0.0.1:3001`.
- The server binds to `127.0.0.1` only (Constitution I.3).
- The missing Tailwind packages are installed in `client/` as part of this step (this also fixes the current broken build).

## 2. Dependencies (each has a reason)

| Package | Where | Why |
|---|---|---|
| `react-router-dom` | client | Onboarding steps and page routes |
| `tailwindcss`, `@tailwindcss/vite` | client | Already referenced in `vite.config.js` and `index.css` |
| `@fontsource/nunito` | client | Self-hosted font, works offline |
| `express` | server | The API |
| `better-sqlite3` | server | Local database, one file |
| `zod` | server | Request validation (Constitution VI) |
| `concurrently` | root dev | One command to run both |
| `vitest` | root dev | Unit and API tests, one runner for both workspaces |

No image library, upload library, form library or state library. Photo resizing uses the browser canvas; uploads use a raw body.

## 3. Data model

Foreign keys are switched on (`PRAGMA foreign_keys = ON`) so deleting a pet cascades.

```sql
CREATE TABLE pets (
  id                 INTEGER PRIMARY KEY,
  name               TEXT    NOT NULL,
  species            TEXT    NOT NULL DEFAULT 'cat',
  sex                TEXT,                  -- female | male | unknown | NULL
  neutered           TEXT,                  -- yes | no | unknown | NULL
  birthdate          TEXT,                  -- ISO date
  birthdate_estimated INTEGER NOT NULL DEFAULT 0,  -- 1 when derived from "approximate age"
  breed              TEXT,
  weight_kg          REAL,
  activity_level     TEXT    NOT NULL DEFAULT 'balanced',  -- lazy | balanced | playful
  diet_type          TEXT,                  -- dry | wet | mixed | raw | home | unknown | NULL
  allergies          TEXT,                  -- JSON array; NULL = not answered, [] = "none"
  conditions         TEXT,                  -- JSON array; NULL = not answered, [] = "none"
  notes              TEXT,
  created_at         TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE pet_photos (
  id         INTEGER PRIMARY KEY,
  pet_id     INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  slot       INTEGER NOT NULL CHECK (slot IN (1, 2)),   -- slot 1 = avatar
  mime       TEXT    NOT NULL,
  data       BLOB    NOT NULL,
  updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (pet_id, slot)
);
```

Decisions:
- **"Not answered" vs "none".** `allergies` and `conditions` use `NULL` for unknown and `[]` for "none". The planning spec needs this difference: an unanswered allergy question must not be treated as "no allergies".
- **Approximate age** is converted on the client to an estimated birthdate, with `birthdate_estimated = 1`, so life stage can always be derived from one field.
- **Photos as BLOBs** keep everything in the one SQLite file, so delete cascades, backup is a file copy, and no file-path bugs exist. Photos are small (see section 6).
- `weight_kg` also becomes the first `weights` row later (that table arrives with the Track spec; nothing to do here).
- `species` stays as a column, fixed to `cat`, so a later version does not need a migration.
- Schema lives in `server/src/db/schema.sql` and is applied idempotently on startup (`CREATE TABLE IF NOT EXISTS`).
- **Schema safety net.** The schema version is stored with SQLite's built-in `PRAGMA user_version` (no extra table). On every startup, before opening the database, if `data/pawelle.db` exists it is copied to `data/backups/pawelle-<timestamp>.db` and only the 5 newest backups are kept. A tiny list of numbered upgrade steps (empty for now) runs when `user_version` is lower than the code's version. This is about 10 to 20 lines and needs no dependency.
- **Data entry order.** Pinky's real details are entered last, after the tables for later specs (`checkins`, `plans`, `weights`, `events`) are designed.

## 4. API

Only one pet exists in this version. The routes still use `/api/pets` to match the overview.

| Method | Route | Behavior |
|---|---|---|
| GET | `/api/health` | `{ server: "ok" }` (Ollama status arrives with the AI spec) |
| GET | `/api/pets` | List of pets (empty or one) with `photos: [slots]` and `completeness` |
| POST | `/api/pets` | Create. Returns 409 with a friendly message if a pet already exists |
| GET | `/api/pets/:id` | One pet, including `completeness` and `next_suggestion` |
| PUT | `/api/pets/:id` | Full update of editable fields |
| DELETE | `/api/pets/:id` | Delete the pet and its photos |
| PUT | `/api/pets/:id/photos/:slot` | Raw image body (`Content-Type: image/jpeg|png|webp`), slot 1 or 2 |
| DELETE | `/api/pets/:id/photos/:slot` | Remove a photo and close the gap (slot 2 becomes slot 1 if slot 1 is removed) |
| GET | `/api/pets/:id/photos/:slot` | Image bytes with an `ETag`, usable directly in `<img src>` |

Validation (`zod`), mirroring the spec:
- `name`: trimmed, 1 to 40 characters.
- `weight_kg`: number from 0.5 to 15, optional.
- `birthdate`: valid date, not in the future, optional.
- `notes`: at most 500 characters, stored as plain text.
- `allergies` and `conditions`: arrays of trimmed strings, de-duplicated case-insensitively, each at most 40 characters, at most 20 items.
- Enumerated fields reject unknown values.

Photo checks on the server: size at most 1 MB, and the first bytes must really be JPEG, PNG or WebP (not just the header the client sent). Anything else gets a 415 with a friendly message ("Pawelle only takes photos, not videos. Try a JPG, PNG or WebP picture.").

Error shape for every failure:

```json
{ "error": { "code": "VALIDATION", "message": "Friendly sentence.", "fields": { "weight_kg": "Pinky's weight should be between 0.5 and 15 kg." } } }
```

Messages are written in the friendly tone from the constitution and are safe to show as they are.

## 5. Completeness score (pure function, unit-tested)

`server/src/services/completeness.js` takes a pet and returns `{ percent, next }`.

| Field | Points | Counts when |
|---|---|---|
| Name | 20 | always present |
| Weight | 15 | set |
| Birthdate (or age) | 15 | set |
| Allergies | 10 | answered (including "none") |
| Conditions | 10 | answered (including "none") |
| Photo | 5 | at least one photo |
| Sex, neutered, breed, diet type, notes | 5 each | set (sex and neutered also count "not sure" as answered) |

Total 100. Activity level is excluded because it has a default. `next` is the highest-point missing field, returned with a friendly prompt ("Add Pinky's weight so portions fit her better"). The text never uses guilt wording and never blocks an action.

## 6. Frontend

### Routes

| Path | Screen |
|---|---|
| `/` | Decides: no pet means `/welcome`, a pet means `/today` |
| `/welcome`, `/welcome/1..3` | Onboarding steps |
| `/today` | Minimal Today shell: greeting, avatar, name. The check-in and plan arrive in later specs |
| `/pet` | Profile view with completeness ring, edit per section, photos, delete |

The 4-tab navigation (Today, Plan, Track, Ask) is built in the shell spec; this feature only needs the Today shell and the profile page, reached by the avatar.

### Structure

```
client/src/
  api/client.js           # fetch wrapper: parses error shape, handles "server unreachable"
  pages/                  # Welcome (3 steps), Today, PetProfile
  components/             # StepIndicator, ChipGroup, PhotoPicker, Avatar,
                          # CompletenessRing, ConfirmDialog, Field, ErrorNotice
  lib/{breeds.js, image.js, age.js, draft.js, limits.js}
  styles/index.css        # Tailwind + design tokens from the overview (@theme)
```

### Key frontend decisions

- **State:** local component state plus one small `usePet()` hook that loads the pet. No state library.
- **Onboarding draft (resume):** the answers, step number and the resized photo (as a data URL, roughly 100 KB) are kept in `localStorage` after every change. On launch, if a draft exists and no pet exists, onboarding resumes. The draft is cleared after a successful save. This is interface state only, so it does not conflict with "data lives in SQLite".
- **Pet is created once, at the end of step 3** (or when the user taps Skip on step 2 or 3 after the name is valid), then photos are uploaded. If a photo upload fails, the pet still exists, and a gentle notice offers "Try the photo again".
- **Photo handling (`lib/image.js`):** read the chosen file, refuse non-images and videos by checking `file.type`, draw it to a canvas with the longest side at most 800 px, and re-encode as WebP (JPEG fallback) at about 0.85 quality. Re-encoding through a canvas drops EXIF data including GPS, which meets AC18. If the browser cannot decode the file (for example HEIC outside Safari), show the friendly "try a JPG or PNG" message.
- **Breed field:** a searchable combobox over a static list in `lib/breeds.js` (about 25 common breeds plus "Mixed / domestic" and "Not sure") that still accepts free text.
- **Approximate age:** a "How old is Pinky?" toggle between exact birthdate and "about N years, M months", converted by `lib/age.js`.
- **Weight:** a numeric input with a stepper and unit label "kg", and a helper line "Roughly is fine".
- **Notes:** rendered through React text nodes only, never `dangerouslySetInnerHTML` (AC9).
- **Dialogs:** `ConfirmDialog` for delete requires typing nothing, but shows the cat's name in the question and a clearly labeled Cancel as the default focus.

### UX details from the spec's "Ease of use" section

- A single primary button per screen. Back and Skip are text buttons.
- "Step N of 3" indicator. Copy uses the cat's name once known.
- Inline, calm field errors, linked to inputs with `aria-describedby`.
- Chips show selection with a check icon plus the label (never color alone).
- A short welcome moment after "Meet Pinky" (about 1.2 seconds, a simple fade and paw pop). `prefers-reduced-motion` turns it into a plain transition.
- Server unreachable: "Pawelle can't reach its helper. Make sure it's running, then try again," with a Retry button, and entered values stay on screen (AC15).

## 7. Testing

| Test | Type | Covers |
|---|---|---|
| `completeness` scoring and `next` choice | unit | AC10 |
| zod schemas: name, weight range, future birthdate, duplicate-free lists, enum rejection | unit | AC2, AC6, AC7, AC8 |
| `age.js` approximate age to estimated birthdate | unit | spec edge case |
| Photo magic-byte check | unit | AC17 |
| Startup backup keeps only the newest 5 files, and `user_version` upgrade steps run once | unit | schema safety net |
| Create, read, update, delete over HTTP with a temporary SQLite database | API | AC1, AC3, AC4, AC11, AC12 |
| Photos: 2 max, replace, delete cascade, non-image refused | API | AC16, AC17, AC18 |
| Manual pass: full onboarding with Wi-Fi off, keyboard-only run, screen reader label check, someone new using it without help | manual | AC13, AC14, UX section |

Component tests are skipped on purpose (time); the manual pass covers UI behavior.

## 8. Constitution check

| Article | How the plan complies |
|---|---|
| I. Local-first | One local SQLite file, server on 127.0.0.1, bundled font, no external calls, photos stored locally |
| II. AI guardrails | No AI in this feature. Allergy and condition data model separates "unknown" from "none" for later hard-constraint use. Photos never leave the app |
| III. Simple on top | Only the name is required, 3 steps, skippable, smart defaults |
| IV. Friendly | Shared error shape with friendly messages, nothing lost on error |
| V. Accessibility | Labeled inputs, icon plus text selection, 44 px targets, reduced motion |
| VI. Technology | Only the fixed stack. Every added package is listed with a reason |
| VII. Quality bar | Pure logic is unit-tested, failure paths are covered |

## 9. Decisions and risks

1. **Export:** resolved. AC18 is reworded; export is a separate later spec.
2. **HEIC photos:** may not decode outside Safari. Mitigation: the friendly message, and testing Pinky's photo in the browser Shontu will actually use. No conversion library is added.
3. **Schema changes:** resolved with the safety net in section 3 plus entering real data last.
4. **Single pet** is enforced in the API (409) and the UI. Multi-pet (P2) will relax the API rule only.
