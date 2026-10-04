# Tasks 001: Pet Profile and Onboarding

**Spec:** [spec.md](./spec.md) | **Plan:** [plan.md](./plan.md)

Work top to bottom. A task is done when its checks pass and `npm run lint` is clean. `[P]` marks tasks that can run in parallel with their neighbors. ACs in brackets show what each task satisfies.

## Phase 0: Restructure and tooling

- [ ] **T01** Create root `package.json` with workspaces `client` and `server`, and move the existing Vite scaffold into `client/`. Remove the template demo code in `App.jsx`, `App.css` and unused assets.
- [ ] **T02** Install client packages: `react-router-dom`, `tailwindcss`, `@tailwindcss/vite`, `@fontsource/nunito`. Install server packages: `express`, `better-sqlite3`, `zod`. Install root dev packages: `concurrently`, `vitest`.
- [ ] **T03** Root scripts: `dev` (client and server together), `lint`, `test`. Add the Vite proxy from `/api` to `127.0.0.1:3001`. Add `data/` to `.gitignore`.
- **Check:** `npm run dev` serves a blank page, `/api/health` is reachable through the proxy, `npm run build` succeeds.

## Phase 1: Server foundation

- [ ] **T04** `db/schema.sql` and `db/index.js`: create the `pets` and `pet_photos` tables, turn on foreign keys, use `PRAGMA user_version`.
- [ ] **T05** Startup backup: copy an existing database to `data/backups/`, keep the newest 5, then run numbered upgrade steps. Unit-test the retention and the version step.
- [ ] **T06** Express app bound to `127.0.0.1`, JSON parsing, `GET /api/health`, and one error handler producing the shared friendly error shape.

## Phase 2: Pure logic with tests [P]

- [ ] **T07** zod schemas for pets (name, weight range, future birthdate, enums, de-duplicated allergy and condition lists, notes length) and tests. [AC2, AC6, AC7, AC8]
- [ ] **T08** `completeness.js` returning percent and the next suggestion, with tests including the "answered with none" case. [AC10]
- [ ] **T09** Client `lib/age.js` (approximate age to estimated birthdate) with tests. [edge case]
- [ ] **T10** Server image sniffing for JPEG, PNG and WebP by real bytes, with tests including a fake video. [AC17]

## Phase 3: Pets API

- [ ] **T11** `POST /api/pets`: validates, creates, returns 409 if a pet exists. [AC3, AC4]
- [ ] **T12** `GET /api/pets` and `GET /api/pets/:id` with `completeness`, `next_suggestion` and photo slots. [AC1, AC10]
- [ ] **T13** `PUT /api/pets/:id`. [AC11]
- [ ] **T14** `DELETE /api/pets/:id` with cascade. [AC12]
- **Check:** API tests over HTTP using a temporary database cover create, read, update, delete, validation errors and the 409.

## Phase 4: Photos API

- [ ] **T15** `PUT /api/pets/:id/photos/:slot` with a raw body, 1 MB limit and byte sniffing; 415 for non-images with the friendly message. [AC16, AC17]
- [ ] **T16** `GET` photo with `ETag`, and `DELETE` photo with slot 2 moving into slot 1 when slot 1 is removed. [AC16]
- **Check:** tests for two photos max, replace, cascade on pet delete, and a refused video. [AC16, AC17, AC18]

## Phase 5: Client foundation

- [ ] **T17** Design tokens in `index.css` using Tailwind `@theme` (colors, radii, Nunito, spacing) from the overview. Verify text contrast in the browser. [AC14]
- [ ] **T18** `api/client.js`: fetch wrapper, error shape parsing, "can't reach the helper" handling with retry. [AC15]
- [ ] **T19** Router and `usePet()` hook; the `/` route sends you to `/welcome` or `/today`, with a loading skeleton. [AC1]
- [ ] **T20** Shared components: `Field`, `ChipGroup` (icon plus label for selection), `StepIndicator`, `ErrorNotice`, `ConfirmDialog`, `Avatar` with placeholder, `CompletenessRing`. [AC14, AC19]

## Phase 6: Onboarding

- [ ] **T21** `lib/limits.js`, `lib/breeds.js` (about 25 breeds plus Mixed and Not sure) and a breed combobox allowing free text.
- [ ] **T22** `lib/image.js`: file type check, canvas resize to 800 px, WebP or JPEG re-encode (drops metadata), friendly refusal messages. [AC17, AC18]
- [ ] **T23** `PhotoPicker` component: up to 2 photos, replace, remove, alt text. [AC16, AC19]
- [ ] **T24** `lib/draft.js` saving answers, step and photo to `localStorage`, and resuming. [decision 3, AC5]
- [ ] **T25** Welcome step 1: name (required, Next disabled when empty), photo, sex, neutered. [AC2, AC5]
- [ ] **T26** Welcome step 2: age toggle, breed, weight with stepper, activity (default Balanced), diet. Skip for now. [AC4, AC6, AC7]
- [ ] **T27** Welcome step 3: allergies and conditions chips with custom entries and a "None" option, notes, and the final "Meet Pinky" button that creates the pet and then uploads photos. [AC8, AC9, AC4]
- [ ] **T28** Welcome moment after saving, with a reduced-motion fallback, then go to Today. Partial failure (photo upload fails) keeps the pet and offers a retry. [AC3, AC15]

## Phase 7: Today shell and profile

- [ ] **T29** Today shell: greeting, avatar and name only; the avatar opens the profile. [AC3]
- [ ] **T30** Profile page: view, completeness ring with the one next suggestion, section-by-section editing with inline errors. [AC10, AC11]
- [ ] **T31** Profile photos: add, swap, remove. [AC16, AC19]
- [ ] **T32** Delete profile with a confirmation naming the cat; afterward return to onboarding. [AC12]

## Phase 8: Verify (analyze)

- [ ] **T33** Run `npm test` and `npm run lint`; fix everything.
- [ ] **T34** Manual pass with Wi-Fi off from a clean database: full onboarding, resume after closing the tab halfway, edit, delete. [AC13, decision 3]
- [ ] **T35** Keyboard-only run and a screen reader label check on every screen. [AC14]
- [ ] **T36** Photo checks: a large photo, a video file, a third photo, and Pinky's photo in the browser Shontu uses (watch for HEIC).
- [ ] **T37** Usability check: someone who has not seen the app completes onboarding without help; note where they hesitate. [Ease of use]
- [ ] **T38** Traceability sweep: confirm every AC1 to AC19 is covered by a test or a manual step above, and update the spec first if behavior changed.

## AC coverage map

| AC | Tasks |
|---|---|
| AC1 | T12, T19 |
| AC2 | T07, T25 |
| AC3 | T11, T28, T29 |
| AC4 | T11, T26, T27 |
| AC5 | T24, T25 |
| AC6 | T07, T26 |
| AC7 | T07, T26 |
| AC8 | T07, T27 |
| AC9 | T27 (plain-text rendering) |
| AC10 | T08, T12, T30 |
| AC11 | T13, T30 |
| AC12 | T14, T32 |
| AC13 | T34 |
| AC14 | T17, T20, T35 |
| AC15 | T18, T28 |
| AC16 | T15, T16, T23, T31 |
| AC17 | T10, T15, T22 |
| AC18 | T16, T22 |
| AC19 | T20, T23, T31 |

Real data for Pinky is entered last, after the later specs' tables exist.
