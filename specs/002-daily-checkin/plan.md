# Plan 002: Daily Check-in and History

**Spec:** [spec.md](./spec.md) | **Constitution:** v1.0 | **Builds on:** [Plan 001](../001-pet-profile/plan.md) | **Status:** Draft

This plan says HOW. It adds no behavior beyond the spec. It reuses everything already built in feature 001 (error shape, `ApiFailure`, `Chip`/`ChipGroup`, `Group`/`TextField`, `ErrorNotice`, `Shell`, `usePet`, the test helpers).

## 1. New dependencies

None. Dates use the built-in `Date`; the nav uses `react-router-dom` (`NavLink`) and Tailwind, both already installed.

## 2. Data model

Added to `server/src/db/schema.sql` (idempotent `CREATE TABLE IF NOT EXISTS`, so existing databases pick it up on the next start; no migration step is needed because nothing existing changes):

```sql
CREATE TABLE IF NOT EXISTS checkins (
  id           INTEGER PRIMARY KEY,
  pet_id       INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  date         TEXT    NOT NULL,                 -- owner's local date, YYYY-MM-DD
  mood         TEXT,                             -- happy | calm | grumpy | hiding
  appetite     TEXT,                             -- great | normal | low | none
  energy       TEXT,                             -- high | normal | sleepy
  play_minutes INTEGER,                          -- 0 | 10 | 20 | 30
  litter       TEXT,                             -- normal | off
  note         TEXT,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (pet_id, date)
);
CREATE INDEX IF NOT EXISTS idx_checkins_pet_date ON checkins (pet_id, date DESC);
```

Decisions:
- `UNIQUE (pet_id, date)` enforces "one check-in per cat per day" in the database, not only in the UI (AC6).
- `NULL` means "not answered"; there are no defaults (AC5). `play_minutes = 0` means "None", which is different from `NULL`.
- `date` is the **owner's local date sent by the client**, because "today" depends on their time zone. The server never computes "today" itself.
- `ON DELETE CASCADE` removes check-ins with the cat (AC16). Foreign keys are already on.
- The overview's `walked` and `poop_ok` columns are replaced by the cat-specific `litter`; `play_minutes` and `note` are kept.

## 3. API

| Method | Route | Behavior |
|---|---|---|
| PUT | `/api/pets/:id/checkins/:date` | Create or update that day's check-in (idempotent). Returns the saved check-in with `flags` |
| GET | `/api/pets/:id/checkins?days=14` | Recent check-ins, newest first, each with `flags`. `days` defaults to 14, maximum 90 |

The overview lists `POST/GET /api/pets/:id/checkins`. This plan deliberately uses `PUT .../:date` instead of `POST`: saving twice on the same day must update, never duplicate (AC6), and a retry after a failed save is then always safe (AC19).

Validation (`zod`), mirroring the spec:
- `:date` must be a real `YYYY-MM-DD` date, not after tomorrow's UTC date (covers every time zone), and not before 2020-01-01.
- `mood`, `appetite`, `energy`, `litter` are enums, optional. `play_minutes` is one of `0, 10, 20, 30`, optional.
- `note` is trimmed, at most 300 characters, stored as plain text.
- At least one of the six fields must be answered, otherwise a friendly 422: "Pick at least one answer first."
- 404 (friendly) if the cat does not exist.

Errors use the shared shape `{ error: { code, message, fields } }`.

For feature 003 (AI plan), `server/src/db/checkins.js` exports `listRecentCheckins(db, petId, days)` so the plan feature reads the last 7 days through the same query, with no HTTP round trip.

## 4. Heads-up rules (`server/src/services/safety.js`)

The constitution (II.1) names `safety.js` as the deterministic rules layer. It is created now, with check-in rules only, and feature 003 extends the same file with text-based rules (toxic ingestion, breathing, and so on). It is a pure module:

```js
// checkinFlags(checkin, previous, petName) -> [{ code, level, message }]
// previous = the check-in for the calendar day before checkin.date, or null
```

| Code | Level | Condition |
|---|---|---|
| `not_eating_2d` | `urgent` | `appetite === 'none'` today **and** `previous?.appetite === 'none'` |
| `not_eating` | `attention` | `appetite === 'none'` today and not the two-day case |
| `litter_off` | `attention` | `litter === 'off'` |

- "Previous" means exactly the previous calendar date. A gap day means a single-day case (spec edge case).
- At most one appetite flag is returned (the two-day flag replaces the one-day flag).
- Messages are fixed strings using only the cat's name, with no diagnosis and no medication names, and each ends with "Pawelle is not a vet." Copy is written in the friendly tone from the constitution.
- Flags are computed when reading and saving, never stored, so changing a rule never leaves stale data.
- Because it is pure and takes plain values, it is trivial to unit-test (VII.1).

## 5. Frontend

### Routes and navigation

| Path | Screen |
|---|---|
| `/today` | Existing Today shell, now with the check-in card |
| `/track` | New: week strip plus history list |

`Shell` gains a small `Nav` component (`NavLink` items for Today and Track), shown on the Today, Track and Profile pages, and hidden during onboarding. Layout: a fixed bottom bar below the `md` breakpoint (with bottom padding on `main` so content is never hidden) and a left rail from `md` upward. Items are at least 44 px tall and use `aria-current="page"` for the active tab (AC20). Plan and Ask are not rendered until their features exist.

### Structure

```
client/src/
  api/client.js            # + saveCheckin(petId, date, payload), listCheckins(petId, days)
  hooks/useToday.js        # local date string; updates on visibilitychange + every minute (AC8)
  hooks/useCheckins.js     # loads recent check-ins, exposes today's, save(), reload()
  lib/dates.js             # localToday(), addDays(), formatDay(), lastNDays()
  lib/checkin.js           # option lists, USUAL preset, toPayload(), isAnswered()
  components/
    Nav.jsx                # Today / Track
    CheckInCard.jsx        # form state and saved summary state
    HeadsUp.jsx            # icon + words, amber or red
    WeekStrip.jsx          # last 7 days
    CheckInRow.jsx         # one history entry
  pages/Track.jsx
```

`Today.jsx` adds `CheckInCard` above the existing profile-completeness nudge.

### Key frontend decisions

- **Local dates (`lib/dates.js`):** built from `getFullYear/getMonth/getDate` (local), formatted `YYYY-MM-DD`. Unlike spec 001's UTC helper, check-ins need the owner's local calendar day. `useToday()` re-reads the date on `visibilitychange` and once a minute, so after midnight the Today card resets without a refresh (AC8).
- **CheckInCard states:** `form` when there is no check-in for `today`, `summary` when there is. "Change" switches back to `form` prefilled from the saved values. State is local; the saved data comes from `useCheckins`.
- **Form model:** `{ mood, appetite, energy, play_minutes, litter, note }` with `null` = unanswered. Chips reuse `ChipGroup` (tapping again clears, AC5). `isAnswered()` powers the disabled Save (AC2).
- **"Just like usual" (AC4):** a secondary button that sets `mood: 'happy'`, `appetite: 'normal'`, `energy: 'normal'`, `litter: 'normal'` and leaves `play_minutes` and `note` as they are. Defined once in `lib/checkin.js` as `USUAL`.
- **Chip content:** each option has a word and a small decorative emoji (`aria-hidden`). Selection still uses the existing check-mark plus word (AC18). Emoji render from the system font, so no external assets are involved (offline).
- **Saving and failure:** `save()` calls `PUT` and replaces today's entry in the local list from the response. On failure the form stays as it is and an `ErrorNotice` with Retry appears (AC19). Because the call is idempotent, retrying is safe.
- **Confirmation moment:** a brief `animate-pop` paw plus "Thanks for checking in on Pinky". Reduced motion is already handled globally in `index.css`.
- **Heads-up display:** `HeadsUp` renders `flags` from the server. Amber uses the existing `attention` tokens; red uses `urgent` tokens with `role="alert"`. Always icon plus words. It appears on the Today summary and on the history row of the same day, and nowhere else.
- **Week strip:** `lastNDays(7, today)` (today last) mapped to the loaded check-ins. A day with a check-in shows the mood emoji and word; a day without one shows a quiet outlined circle with the weekday letter (no warning color, AC12). If the loaded list is shorter than 7 days, missing days still render.
- **History list:** starts with `days=14`; "Show more" re-requests with 30 and then 90 (the maximum), hiding the button when the response has fewer entries than requested. Today's entry offers **Change**, which sends the user to Today's editor; older entries are read-only (AC13, AC15). Empty state: friendly text plus a button to `/today` (AC14).
- **Note:** `TextField` (multiline) with a visible counter, the same plain-text rendering rule as in 001 (React text nodes only, AC9).
- **No pet or loading:** `Today` and `Track` already redirect to `/welcome` when no cat exists; check-in data loads after the pet.

## 6. Testing

| Test | Type | Covers |
|---|---|---|
| `checkinFlags`: single day, two consecutive days, a gap day, litter off, nothing, name in the message, no medication words | unit | AC10, AC11 |
| zod schema: enums, play minutes, note length, future date, impossible date, "at least one answer" | unit | AC2, AC9 |
| `dates.js`: local date formatting, `addDays` across month and year ends, `lastNDays`, `formatDay` | unit | AC12, AC13 |
| `lib/checkin.js`: `USUAL` preset leaves play and note alone; `toPayload` keeps `null` for unanswered; `isAnswered` | unit | AC2, AC4, AC5 |
| API: create, update the same day (still one row), idempotent PUT, list order and `days` limits, flags in responses, 404 cat, 422 empty check-in, delete cat cascades | API (temporary DB) | AC1, AC6, AC10, AC13, AC16 |
| Manual: timed check-in (under 20 seconds, under 5 with "just like usual"), midnight rollover (change the system date or the mocked clock), offline, keyboard-only, 375 px layout with no sideways scroll, nav hit targets | manual | AC3, AC8, AC17, AC18, AC20, UX section |

Component tests are skipped on purpose, as in 001; the manual pass covers UI behavior.

## 7. Constitution check

| Article | How the plan complies |
|---|---|
| I. Local-first | One new local table, no network calls, deleted with the cat |
| II. AI guardrails | `safety.js` rules are deterministic and AI-free; messages are fixed text with no diagnosis; check-ins are structured values that 003 will pass as data |
| III. Simple on top | One card on Today, history one tap away, two nav tabs only |
| IV. Friendly | Idempotent save with safe retry, no guilt wording, a friendly confirmation |
| V. Accessibility | Labelled chips with check plus word, `aria-current` nav, 44 px targets, `role="alert"` only for the red flag |
| VI. Technology | No new packages |
| VII. Quality bar | The pure safety rules are unit-tested; the API is tested against a temporary database; failure path (retry) is covered |
| VIII. Workflow | Spec, then plan; tasks and implementation follow |

## 8. Risks and open points

1. **Navigation scope:** resolved. The two-tab bar is kept (spec decision 5).
2. **Local date vs UTC.** Check-in dates are local; the cat's profile dates from spec 001 are UTC-based. They don't interact, but any future "age" or "days since" feature must be careful about which one it uses.
3. **Server accepts any recent client date.** There is no authentication on a local single-user app, so a wrong device clock could save a check-in on the wrong day. The tomorrow limit stops far-future dates; correcting a wrong day is out of scope.
4. **Safety wording.** The three heads-up messages need to be read once by you (and ideally Shontu) for tone, since they are the most sensitive text in the app.
5. **`safety.js` ownership.** Feature 003 extends this file. Its text-based rules must follow the same shape `{ code, level, message }` so the UI component keeps working.
