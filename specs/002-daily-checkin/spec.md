# Spec 002: Daily Check-in and History

**Status:** Draft | **Priority:** P0 | **Constitution:** v1.0 | **Builds on:** [Spec 001](../001-pet-profile/spec.md)

## Why

Pawelle's suggestions are only as good as what it knows about *today*. A daily check-in is the smallest possible way for an owner to tell Pawelle how their cat is doing. It also gives the later AI plan feature real, recent data instead of guesses. It must feel like a 10-second habit, not a form.

## Who

Shontu, checking in on **Pinky** once a day, usually from a phone.

## Scope

**In:**
- A daily check-in on the Today screen (Level 0 to 1 of the depth ladder).
- Editing today's check-in.
- A history view with a week-at-a-glance strip (Level 2).
- Calm, fixed-wording "heads-up" messages when answers suggest a vet check.
- A small navigation bar with two tabs: **Today** and **Track**.

**Out:** AI plans or any AI output (spec 003), weight tracking, vet events and reminders, push notifications, streak badges, back-filling past days, charts, data export, multiple cats.

## User stories

1. **Quick check-in.** As an owner, I tell Pawelle how my cat is today in a few taps, so I don't have to type anything.
2. **Just like usual.** As an owner on a normal day, I can say "just like usual" in one tap and be done.
3. **Fix a slip.** As an owner, I can change today's answers if I tapped the wrong thing or something changes later in the day.
4. **See the pattern.** As an owner, I can look back over recent days and see how my cat has been.
5. **Be told when to worry (calmly).** As an owner, if the answers suggest something worrying, I get a gentle, clear nudge to contact my vet, with no panic and no diagnosis.

## What a check-in contains

One check-in per cat per day. Every question is optional, but at least one must be answered to save.

| Question | Choices | Notes |
|---|---|---|
| Mood | Happy, Calm, Grumpy, Hiding | |
| Appetite | Great, Normal, Low, Not eating | |
| Energy | High, Normal, Sleepy | |
| Play today | None, About 10 min, About 20 min, 30+ min | Stored as minutes |
| Litter box | Looks normal, Something's off | "Something's off" covers changes in amount, color or effort |
| Note | Free text, up to 300 characters | Optional, plain text only |

Choices are chips: one tap each, tapping the selected chip again clears it. Each chip shows a word (and a small decorative icon); selection is shown by a check mark, never by color alone.

## Today screen behavior

- **Not yet checked in today:** a card titled "How's Pinky today?" shows the questions, a **"Pinky's just like usual"** shortcut, and a Save button.
- **"Just like usual"** selects **Happy** for mood, **Normal** for appetite, **Normal** for energy and **Looks normal** for litter box, leaving play and note untouched. The user can still change any chip before saving.
- **After saving:** the card becomes a short summary ("Thanks for checking in on Pinky") with the answers shown as chips and a **Change** action. A brief, friendly confirmation moment appears.
- **Next day:** the card automatically returns to the question form.
- The Today screen must still make sense at a glance: the check-in is the single primary action; history and details live under Track.

## Heads-up messages

Fixed, kind wording. They are shown on the Today summary and next to the matching day in history. They never diagnose, never name a medicine, and never come from the AI model.

| Trigger | Tone | Meaning |
|---|---|---|
| Appetite "Not eating" today | Attention (amber) | A calm note that not eating can matter for cats and that the vet is a good call if it continues |
| Appetite "Not eating" today **and** the previous day | Urgent (red, the only loud element) | Not eating for about two days is a reason to contact the vet soon |
| Litter box "Something's off" today | Attention (amber) | Changes at the litter box are worth watching, and worth a vet call if they continue |

The urgent tone is used only for the two-day case, in line with the constitution. Every message pairs an icon with words, and always includes "Pawelle is not a vet".

## History (Track tab)

- A **week strip** shows the last 7 days (today included). Each day shows whether a check-in exists and the cat's mood icon and word. A missed day is shown neutrally, with no warning color and no guilt wording.
- Below it, a **list of recent check-ins**, newest first, 14 days to start with, and a **"Show more"** action to extend it. Each entry shows the date ("Today", "Yesterday", then "Mon 5 Oct"), the answers, any note, and any heads-up for that day.
- Tapping a day's entry for **today** opens the same editor as on Today. Past days are read-only in this version.
- **Empty state:** a friendly sentence and one button leading to the Today check-in.

## Navigation

A small bar with **Today** and **Track** (bottom bar on phones, side bar on wider screens). The Plan and Ask tabs from the overview are not shown until those features exist, so there are never dead tabs. The pet avatar still opens the profile.

## Acceptance criteria

1. **AC1:** On the Today screen, a cat with no check-in for today sees the check-in form; a cat that has one sees the summary.
2. **AC2:** The Save button is disabled until at least one question is answered.
3. **AC3:** A check-in can be completed and saved with 3 to 5 taps, with no typing required.
4. **AC4:** "Just like usual" sets Happy, Normal, Normal and Looks normal in one tap, leaves play and note untouched, and all values can still be changed before saving.
5. **AC5:** Tapping a selected chip clears that answer, and cleared or unanswered questions are stored as empty, never as a made-up default.
6. **AC6:** Saving twice on the same day updates that day's check-in; there is never more than one per cat per day.
7. **AC7:** After saving, the summary shows exactly what was saved, and **Change** reopens the form with those values filled in.
8. **AC8:** If the date changes while the app is open (for example after midnight), the Today card returns to the empty form without a manual refresh.
9. **AC9:** The note accepts up to 300 characters, is shown as plain text only (markup appears literally), and shows a friendly message past the limit.
10. **AC10:** "Not eating" alone shows the amber heads-up; "Not eating" on two consecutive days shows the red heads-up; "Something's off" for the litter box shows the amber heads-up. No heads-up appears otherwise.
11. **AC11:** Heads-up messages are fixed text containing no diagnosis and no medication names, include the "not a vet" note, and use an icon plus words.
12. **AC12:** The week strip shows the last 7 days with today last; days without a check-in look neutral, not like errors.
13. **AC13:** The history list shows newest first, starts with 14 days, and "Show more" reveals older entries.
14. **AC14:** A day with no check-ins in the whole history shows the friendly empty state with a button to check in.
15. **AC15:** Only today's check-in can be edited; older entries are read-only.
16. **AC16:** Deleting the cat's profile (spec 001, AC12) also deletes all of its check-ins.
17. **AC17:** The whole flow works with Wi-Fi off.
18. **AC18:** Everything is keyboard-operable, chips and inputs are labelled, and selection is shown by a check mark plus the word, not by color alone.
19. **AC19:** A failed save shows a friendly message with a Retry action, and keeps the chosen answers.
20. **AC20:** The navigation bar shows only Today and Track, marks the current page, and every item is at least 44 px tall.

## Ease of use (UX requirements)

1. **Fast.** A "just like usual" check-in takes under 5 seconds; a full one under 20.
2. **One primary action.** The form has one clear Save button; the shortcut is visually secondary.
3. **Personal, plain wording.** Questions use the cat's name ("How's Pinky today?"). No jargon like "anorexia" or "hyporexia".
4. **Large, comfortable chips.** Chips are at least 44 px tall and wrap neatly on a 375 px wide screen with no sideways scrolling.
5. **No guilt.** Missed days, low moods and "Not eating" are never framed as the owner's failure. Heads-ups are about the cat, not about the owner.
6. **Warm reward.** Saving gives a short, friendly confirmation (respecting reduced-motion settings).
7. **Forgiving.** The form keeps its answers on error, and today's check-in can always be changed.

## Edge cases

- **Date and time zone:** "today" is the owner's local date on their device. Midnight rollover is handled (AC8).
- **First day:** a brand-new profile has no history; the empty state appears on Track.
- **Gaps:** if the previous day has no check-in, "Not eating" is treated as a single day, not as two in a row.
- **Only a note:** a check-in with only a note counts as answered.
- **Long note:** capped at 300 characters, with a friendly message.
- **App left open:** the card must not show stale "saved" content on a new day.
- **Unreachable helper:** shows the friendly "can't reach its helper" message with Retry, and keeps the answers (AC19).
- **Heads-up and history:** a past day's heads-up stays attached to that day.
- **Data for later features:** the last 7 days of check-ins must be easy to read by the AI plan feature, which will use them as context.

## Constitution check

| Article | How this spec complies |
|---|---|
| I. Local-first | Stored locally only, works offline (AC17), deleted with the profile (AC16) |
| II. AI guardrails | Heads-ups are fixed, deterministic text with no AI involved, no diagnosis, no medication names, and the "not a vet" note (AC10, AC11). Check-in data is plain text and structured, so it can later be given to the model as data, not as instructions |
| III. Simple on top | One card, one primary action, 3 to 5 taps, history one tap deeper |
| IV. Friendly | No guilt wording, a calm tone, a friendly confirmation, retry on failure (AC19) |
| V. Accessibility | AC18, AC20 |
| VI. Technology | No new technology needed by the behavior described here |

## Decisions

1. **Cats only:** the questions are cat-specific (litter box rather than walks).
2. **One check-in per day**, editable that day, read-only afterwards.
3. **Navigation:** two tabs now, tabs added as features arrive.
4. **No back-filling** of past days in this version.
5. **Navigation:** the two-tab bar (Today and Track) is kept.
6. **"Just like usual":** sets mood to **Happy**.
7. **Two-day "Not eating":** shown in the red (urgent) tone.
