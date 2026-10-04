# Spec 001: Pet Profile and Onboarding

**Status:** Draft | **Priority:** P0 | **Constitution:** v1.0

## Why

Every recommendation Pawelle makes depends on knowing the pet. The profile is the foundation for check-ins and AI plans. It must be quick to create (so a first-time owner is not put off) and rich enough to grow over time (so a careful owner can go deep).

## Who

Shontu, a cat owner, setting up Pawelle for **Pinky** (a cat). Pawelle is cat-only in this version.

## Scope

**In:** create a cat profile through onboarding, view it, edit it, delete it, and see how complete it is.
**Also in:** up to 2 photos of the cat, stored locally.
**Out:** videos, data export (own spec), multiple pets and a pet switcher (P2), accounts, vet records and events (later specs), any AI output, any AI analysis of photos.

## User stories

1. **First launch.** As a new owner, I am guided through setting up my cat in 3 short steps, so I can start without reading instructions.
2. **Skip the optional parts.** As a hurried owner, I can finish with only my cat's name and still reach the Today screen.
3. **Add detail later.** As a careful owner, I can add or change any detail at any time, so Pawelle's suggestions improve.
4. **See what is missing.** As an owner, I see how well Pawelle knows my cat and what to add next, without being forced to.
5. **Fix mistakes.** As an owner, I can edit any field, and delete my cat's profile and data after confirming.

## Onboarding flow

| Step | Screen | Fields |
|---|---|---|
| 1 | About your cat | Name (**required**), photo (optional), sex, neutered or spayed |
| 2 | The basics | Birthdate or approximate age, breed (optional), weight, activity level, diet type |
| 3 | Health (skippable) | Allergies, health conditions, notes |

- Each step is one screen. Back and Next are always available, and nothing typed is lost when moving between steps.
- Steps 2 and 3 have a visible "Skip for now" action.
- When finished, the user lands on the Today screen with the cat's name shown.

## Profile fields

| Field | Required | Input type | Notes |
|---|---|---|---|
| Name | Yes | Text | 1 to 40 characters |
| Sex | No | Chips: Female, Male, Not sure | |
| Neutered or spayed | No | Chips: Yes, No, Not sure | |
| Birthdate | No | Date, or "approximate age" in years and months | One of the two is enough |
| Breed | No | Searchable list plus "Mixed / domestic" and "Not sure" | Free text allowed |
| Weight | No | Number, in kg | Also seeds the first weight entry |
| Activity level | No | Chips: Lazy, Balanced, Playful | Default: Balanced |
| Diet type | No | Chips: Dry, Wet, Mixed, Raw, Home-cooked, Not sure | |
| Allergies | No | Multi-select chips plus custom entries | Examples: chicken, fish, dairy, grains |
| Conditions | No | Multi-select chips plus custom entries | Examples: kidney, diabetes, urinary, overweight |
| Notes | No | Free text, up to 500 characters | Passed to the AI as data only |
| Photos | No | Choose from device, up to **2** | Images only (JPEG, PNG, WebP). **No videos.** The first photo is the avatar. Photos are never sent to the AI model |

## Acceptance criteria

1. **AC1:** Opening the app with no profile shows onboarding; opening it with a profile shows the Today screen.
2. **AC2:** The Next button on step 1 is disabled until the name is non-empty after trimming spaces.
3. **AC3:** A profile with only a name can be saved, and the Today screen shows that name.
4. **AC4:** Steps 2 and 3 can be skipped, and skipped fields are stored as empty rather than as made-up defaults. The one exception is activity level, which defaults to Balanced.
5. **AC5:** Going Back never clears entered values.
6. **AC6:** Weight accepts only positive numbers within a sensible range (0.5 to 15 kg). An out-of-range value shows a friendly message and does not discard other input.
7. **AC7:** A birthdate in the future is rejected with a friendly message.
8. **AC8:** Allergies and conditions can be picked from chips or typed freely, and duplicates are ignored case-insensitively.
9. **AC9:** Notes are stored and displayed as plain text only; markup typed into them is shown literally.
10. **AC10:** The profile page shows a completeness indicator (for example "Pawelle knows Pinky 60%") and one suggested next field to add.
11. **AC11:** Every field can be edited later. Changes are visible immediately after saving, and the AI-facing data uses the updated values.
12. **AC12:** Deleting the profile requires an explicit confirmation naming the cat, and removes all of that cat's data.
13. **AC13:** The whole flow works with Wi-Fi off.
14. **AC14:** The whole flow is keyboard-operable, inputs have labels, and chips show selection by icon and text, not color alone.
15. **AC15:** An unexpected save failure shows a friendly message with a retry action, and keeps the entered values.
16. **AC16:** A cat can have 0, 1 or 2 photos. Adding a third shows a friendly message offering to replace one. The first photo is shown as the avatar, and photos can be removed or swapped at any time.
17. **AC17:** Only image files are accepted. Videos and other file types are refused with a friendly message that says what is allowed. Oversized images are reduced automatically instead of being refused where possible.
18. **AC18:** Photos are stored only on the device and are deleted together with the profile (AC12). Location and camera metadata are removed when a photo is saved. Any future data export must include the photos (export has its own spec).
19. **AC19:** Without a photo, a friendly cat placeholder avatar is shown, and nothing else in the flow changes.

## Ease of use (UX requirements)

This feature is the first impression. It must feel effortless for someone who is not technical.

1. **One thing per screen.** Each onboarding step has a single clear primary button ("Next", then "Meet Pinky" on the last step). Secondary actions (Back, Skip) look quieter.
2. **Fast.** A name-only profile takes under 15 seconds. A full profile takes under 2 minutes.
3. **Chips, buttons, steppers over typing.** Only name, notes and custom entries need a keyboard.
4. **Smart defaults and examples.** Fields show a placeholder example ("e.g. 4.2") and a short helper line in plain words ("Roughly is fine").
5. **Friendly, personal wording.** Once the name is known, copy uses it ("What does Pinky usually eat?"). No jargon such as "neutered status" or "BCS".
6. **Progress is visible.** A step indicator such as "Step 2 of 3" is shown on each onboarding screen.
7. **Forgiving.** Mistakes are fixed inline, next to the field, in a calm tone. Nothing is lost on error. Deleting asks first.
8. **Reward.** Finishing onboarding shows a short, warm welcome moment with Pinky's name and photo, then the Today screen. Motion respects reduced-motion settings.
9. **Comfortable on any screen.** Works one-handed on a phone and with keyboard and mouse on a laptop. Touch targets are at least 44px.

## Completeness indicator

A simple weighted score. Name counts as the baseline and the other fields add to it, with weight, age, allergies and conditions weighing most. The exact weights belong in the plan. The indicator must never block any action and must never use guilt-based wording.

## Edge cases

- Name with leading or trailing spaces, emoji or non-Latin letters: trimmed and accepted.
- Age given only approximately: stored so that the cat's life stage (kitten, adult, senior) can still be derived later.
- Kitten under 1 year or senior over 11: accepted. Life-stage handling is for the planning spec, not this one.
- Weight is updated in the profile: this later feeds the weight history (see Track).
- App closed halfway through onboarding: the next launch resumes onboarding with the entered values kept (decision 3).
- A second profile is never offered in this version.
- A very large, corrupt, or unsupported image: refused or reduced with a friendly message, and the rest of the form is unaffected.
- A photo is removed while it is the avatar: the second photo becomes the avatar, or the placeholder appears.
- Data created in this version must stay readable by later versions.

## Constitution check

| Article | How this spec complies |
|---|---|
| I. Local-first | Stored locally only, no network needed (AC13) |
| III. Simple on top | Only the name is required, 3 short steps, skippable |
| IV. Friendly | Friendly errors, no lost input (AC5, AC15) |
| V. Accessibility | AC14; photos need alt text such as "Photo of Pinky" |
| I. Local-first | Photos stay on the device, metadata is stripped (AC18) |
| II. AI guardrails | Photos are never sent to the model (no vision) |
| II. AI guardrails | Allergies and conditions are captured as structured data for later hard-constraint use; notes are plain text data (AC9) |

## Decisions (from clarify)

1. **Breed:** a short curated list of common cat breeds plus free text.
2. **Units:** kg only. A unit toggle would be a Level 3 setting later.
3. **Interrupted onboarding:** resume on next launch with the entered values kept.
4. **Photos:** up to 2 per cat, images only, no videos, stored locally, never sent to the AI.
5. **Pinky's real details** are for the demo and the post. They are entered through the normal flow, with no pre-filled or sample data in the product.
6. **Export:** not part of this feature; AC18 only constrains it for later.
