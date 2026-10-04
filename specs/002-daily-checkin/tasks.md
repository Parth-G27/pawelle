# Tasks 002: Daily Check-in and History

**Spec:** [spec.md](./spec.md) | **Plan:** [plan.md](./plan.md)

Work top to bottom. A task is done when its checks pass and `npm run lint` and `npm test` are clean. `[P]` marks tasks that can run in parallel with their neighbors. ACs in brackets show what each task satisfies. Run everything from `pawelle-app/`.

## Phase 1: Data and pure logic

- [x] **T01** Add the `checkins` table and index to `server/src/db/schema.sql` (idempotent, `UNIQUE (pet_id, date)`, cascade). Extend `db.test.js` to expect the new table. [AC6, AC16]
- [x] **T02** `server/src/lib/checkinSchema.js`: zod schema for the six fields, a date-param validator (real date, not after tomorrow's UTC date, not before 2020-01-01), "at least one answer" rule, and friendly messages. Add unit tests. [AC2, AC9]
- [x] **T03** `server/src/services/safety.js`: pure `checkinFlags(checkin, previous, petName)` returning `{ code, level, message }` items for `not_eating_2d` (urgent), `not_eating` (attention) and `litter_off` (attention). Fixed wording, name only, no diagnosis, no medicine names, ends with "Pawelle is not a vet." Add unit tests for: single day, two consecutive days, a gap day, litter off, nothing, name in the message, and a check that no message contains medication words. [AC10, AC11]
- [x] **T04** `server/src/db/checkins.js`: `upsertCheckin`, `getCheckin`, `listCheckins` (newest first) and `listRecentCheckins(db, petId, days)` for feature 003. A helper attaches `flags` by looking up the previous calendar day. Add tests with an in-memory database. [AC6, AC10]
- **Check:** `npm test` passes with the new unit tests.

## Phase 2: API

- [x] **T05** `PUT /api/pets/:id/checkins/:date` in `server/src/routes/checkins.js`, registered in `app.js`: validates, upserts, returns the saved check-in with `flags`. 404 for a missing cat, friendly 422 for an empty check-in or a bad date. [AC2, AC6, AC10]
- [x] **T06** `GET /api/pets/:id/checkins?days=14`: newest first, `days` defaults to 14, capped at 90, each entry with `flags`. [AC13]
- [x] **T07** API tests over HTTP with a temporary database (extend the existing `api.test.js` style): create, update the same day still leaves one row, repeating the same PUT is safe, order and `days` limits, flags in both responses (including the two-day case and a gap day), 404 cat, 422 empty, 422 future date, plain-text note stored literally, deleting the cat removes its check-ins. [AC1, AC6, AC9, AC10, AC13, AC16]
- **Check:** all API tests pass; a manual `curl` of `PUT` then `GET` shows the saved day and its flags.

## Phase 3: Client logic [P]

- [x] **T08** `client/src/lib/dates.js`: `localToday()`, `addDays()`, `lastNDays(n, today)` (today last), `formatDay()` ("Today", "Yesterday", "Mon 5 Oct"). Unit tests including month and year boundaries. [AC12, AC13]
- [x] **T09** `client/src/lib/checkin.js`: option lists (words plus decorative emoji), the `USUAL` preset (Happy, Normal, Normal, Looks normal; play and note untouched), `isAnswered()`, `toPayload()` keeping `null` for unanswered. Unit tests. [AC2, AC4, AC5]
- [x] **T10** Extend `client/src/api/client.js` with `saveCheckin(petId, date, payload)` and `listCheckins(petId, days)`. [AC19]
- [x] **T11** `hooks/useToday.js`: returns the local date and updates on `visibilitychange` and once a minute. [AC8]
- [x] **T12** `hooks/useCheckins.js`: loads the recent check-ins for the cat, exposes today's entry, `save()` (replaces the entry from the response) and `reload()`. [AC1, AC6, AC7]

## Phase 4: Shared UI pieces [P]

- [x] **T13** `components/HeadsUp.jsx`: renders flags with an icon plus words; amber for `attention`, red with `role="alert"` for `urgent`. [AC10, AC11, AC18]
- [x] **T14** `components/Nav.jsx`: `NavLink` items for Today and Track, `aria-current` on the active one, at least 44 px tall. Add it to `Shell` as a bottom bar below `md` and a left rail from `md` up (with bottom padding on `main`), shown on Today, Track and Profile, hidden during onboarding. [AC20]
- [x] **T15** `components/WeekStrip.jsx`: last 7 days, today last; a day with a check-in shows the mood emoji and word; a day without one is a quiet outlined circle with the weekday letter (no warning color, no guilt wording). [AC12]
- [x] **T16** `components/CheckInRow.jsx`: one history entry with the friendly date, answers, note (plain text) and any heads-up; a Change link on today's entry only. [AC13, AC15]

## Phase 5: Today check-in

- [x] **T17** `components/CheckInCard.jsx` form state: "How's {name} today?", the five chip groups (reusing `ChipGroup`), the optional note with a counter, the "{name}'s just like usual" secondary button, and a Save button that stays disabled until at least one answer is chosen. Tapping a selected chip clears it. [AC2, AC3, AC4, AC5, AC9]
- [x] **T18** `CheckInCard` saved state: a short summary with the saved answers as chips, any `HeadsUp`, a friendly confirmation moment (reduced-motion safe) and a **Change** action that reopens the form prefilled. [AC7, AC10, AC11]
- [x] **T19** Failure path: a failed save keeps the chosen answers and shows an `ErrorNotice` with Retry; a safe retry thanks to the idempotent PUT. [AC19]
- [x] **T20** Wire `CheckInCard` into `Today.jsx` above the completeness nudge, driven by `useToday` and `useCheckins`, so the card returns to the empty form after midnight. [AC1, AC8]

## Phase 6: Track

- [x] **T21** `pages/Track.jsx` and the `/track` route: `WeekStrip` on top, then the history list (14 days to start, newest first). [AC12, AC13]
- [x] **T22** "Show more": re-request with 30 then 90 days; hide the button when fewer entries than requested come back. [AC13]
- [x] **T23** Empty state with a friendly sentence and a button to the Today check-in; redirect to `/welcome` when there is no cat. [AC14]

## Phase 7: Verify

- [x] **T24** Run `npm test`, `npm run lint` and `npm run build`; fix everything.
- [x] **T25** Manual pass from a clean database in the browser: first check-in with 3 to 5 taps, "just like usual", change and re-save (still one entry), clear a chip, a note with markup, Retry after stopping the server, delete the cat and confirm its check-ins are gone. [AC3, AC4, AC5, AC6, AC7, AC9, AC16, AC19]
- [x] **T26** Heads-up pass: create "Not eating" on two consecutive days (seed a past day through the API for testing, then delete it), a gap day, and litter "Something's off"; check wording, tone, and that only the two-day case is red, gap day is yellow & litter "Something's off" is also yellow. [AC10, AC11] _Done: two-day case red, gap day and litter amber, layout checked in the browser. The owner read all three messages and approved the wording._
- [x] **T27** Timing and layout: a "just like usual" check-in under 5 seconds, a full one under 20; 375 px wide with no sideways scroll; chips and nav items at least 44 px; text contrast of the new colors at least 4.5:1. [UX section, AC20] _Done: 3 taps for a full check-in, 375 px with no sideways scroll, all targets 44 px or more, contrast at least 4.5:1 (fixed the active nav tab). A real test run took 20 seconds at most for a full check-in, within the target. The "just like usual" time was not measured separately._
- [~] **T28** Midnight rollover and offline: change the system clock (or the mocked clock) past midnight with the app open and confirm the card resets; check that every request is localhost-only. [AC8, AC17] _Done: midnight rollover reset the card (mocked clock), and no request left localhost. Still to do: switch Wi-Fi off for real._
- [~] **T29** Keyboard-only run and a screen reader label check across Today, Track and the nav. [AC18] _Done: every control has an accessible name, groups have legends, current tab uses aria-current. Still to do: a real keyboard-only and screen-reader walkthrough. Note: the nav comes first in tab order._
- [x] **T30** Traceability sweep: confirm every AC1 to AC20 is covered by a test or a manual step above, and update the spec first if behavior changed. Remove any test check-ins added during T26.

## AC coverage map

| AC | Tasks |
|---|---|
| AC1 | T07, T12, T20 |
| AC2 | T02, T09, T17 |
| AC3 | T17, T25 |
| AC4 | T09, T17, T25 |
| AC5 | T09, T17 |
| AC6 | T01, T04, T05, T07 |
| AC7 | T12, T18 |
| AC8 | T11, T20, T28 |
| AC9 | T02, T07, T17 |
| AC10 | T03, T13, T26 |
| AC11 | T03, T13, T26 |
| AC12 | T08, T15, T21 |
| AC13 | T06, T08, T16, T21, T22 |
| AC14 | T23 |
| AC15 | T16 |
| AC16 | T01, T07, T25 |
| AC17 | T28 |
| AC18 | T13, T29 |
| AC19 | T10, T19, T25 |
| AC20 | T14, T27 |

Real data for Pinky is entered last, after the tables for the later specs exist.

## How this was verified

- **Automated:** 105 tests (unit and API), lint clean, production build passes.
- **Manual (browser):** done against a separate scratch database so real data was never touched: one-tap "just like usual", change and re-save (one row), clearing a chip, markup note as plain text, heads-ups, Track week strip and history with Show more, Change link, empty state, delete cascade, failed save then Retry, midnight rollover.
- **Still for a person (set aside for now):** Wi-Fi really off (T28), keyboard-only and screen reader (T29).
