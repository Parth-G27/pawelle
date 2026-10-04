# Spec 003: Today's Plan (the AI companion)

**Status:** Draft | **Priority:** P0 | **Constitution:** v1.1 | **Builds on:** [Spec 001](../001-pet-profile/spec.md), [Spec 002](../002-daily-checkin/spec.md)

## Why

This is the heart of Pawelle. The owner has told Pawelle who their cat is (spec 001) and how today is going (spec 002). Now Pawelle turns that into a short, kind, practical plan for the day: food, play and things to watch. The plan is written by an open-weight model running on the owner's own laptop (default **`gemma3:1b`** through Ollama). Nothing leaves the device.

It must feel like a warm, cat-loving friend, not a medical form and not a chatbot.

## Who

Shontu, getting a daily plan for **Pinky**, on a phone-size screen or a laptop.

## Scope

**In:**
- A **"Get today's plan"** action on the Today screen.
- A **Plan** tab (a third nav tab) showing today's plan and a history of past plans.
- Plan generation by the local model from the cat's profile and the last 7 days of check-ins.
- **Pawelle's voice**: friendly, playful, cat-loving writing in every plan and every loading or error message.
- Deterministic **safety checks before the model** and **filters after it** (allergies, medicine, diagnosis).
- Friendly screens for "the AI brain is asleep", slow generation and failure.
- A small built-in **basic plan** when the model cannot deliver.

**Out:** Ask Pawelle (free-form conversation), "Can they eat this?", weekly plans, checkable plan items, a model switcher screen, streaming text, any use of photos, any medical advice.

## Pawelle's voice

Pawelle is a gentle, upbeat friend who adores cats and takes Pinky's wellbeing seriously. These rules apply to everything the model writes and to the app's own fixed messages.

1. **Warm and personal.** Use the cat's name often. Speak to the owner as "you". Celebrate small wins ("Thank you for checking in on Pinky today").
2. **Cute, not silly.** A light touch of cat charm: soft words, an occasional gentle pun at most once per plan ("purr-fect"), and at most **three** emoji per plan (paws, hearts and similar). No baby talk that hides meaning, no sarcasm, no pressure.
3. **Plain and short.** Short sentences, everyday words, no jargon. Each suggestion is one or two lines and always has a one-line "why".
4. **Encouraging, never guilty.** Missed days, low appetite or grumpy moods are never the owner's fault.
5. **Pronouns:** use the cat's name. Use "she" or "he" only if the owner set the cat's sex; otherwise "they".
6. **Serious things are calm, not cute.** Anything about health, the vet or a heads-up uses plain, gentle wording with **no puns and no emoji**.
7. **Honest about being small.** Pawelle says "I think", "let's try" and "your vet knows best". It never claims certainty about health.
8. **Playful fixed messages.** Loading and empty-state text is part of the charm (examples below).

*Example (illustrative, not fixed text):*
> **Pinky's Tuesday plan** 🐾
> Pinky is feeling happy today, so let's keep the good vibes going!
> **Breakfast:** her usual dry food, about the usual amount. *Why: a steady routine keeps tummies content.*
> **Play:** a gentle 15-minute feather-wand session. *Why: short, fun bursts match her playful energy.*

## What the owner sees

### On the Today screen
- Below the check-in card, a single primary button: **"Get today's plan"**. If no check-in was done today, a soft hint appears: "A quick check-in helps me tailor the plan." The button still works.
- Once a plan exists for today, the button is replaced by a **plan summary card**: the friendly one-line summary and three collapsed rows (**Meals**, **Play**, **Watch-outs**, each with a count). Tapping a row expands its details. A small "Make a fresh plan" action is available.

### While the plan is being written
- A skeleton with **rotating playful messages** such as "Pinky's plan is being written with a tiny pencil…", "Asking my cat-whisperer brain…" and "Counting treats (just kidding)…".
- After 30 seconds, a gentle "This is taking a little longer than usual. Hang tight!" appears.
- After 2 minutes the attempt ends with the friendly failure screen (see below).
- The owner can leave the screen without losing the plan: it is saved when finished.

### The plan itself
- **A one-sentence friendly summary.**
- **Meals:** 1 to 3 items (at most 2 for a grown-up cat), each with a time of day, an amount and a "why" taken from Pawelle's own written reasons. The food is always the cat's **usual food** (for example "her usual dry food"), never a new food, recipe or brand. The amount is one of three relative choices: "your usual amount", "a little less than usual" or "a little more than usual". Never grams or calories.
- **Play:** 1 to 3 ideas, each chosen from Pawelle's **built-in list of safe play ideas** (feather wand, crinkle ball, cardboard box, puzzle feeder, window watching and similar), with minutes and a "why" taken from Pawelle's own written reasons.
- **Watch-outs:** 0 to 3 short notes written by Pawelle (not the model) from today's check-in, for example a gentle note when appetite was low.
- **Good to check with your vet:** 0 to 3 gentle notes, written by Pawelle, for anything outside what it knows (see "Knowing its limits").
- **When to call your vet:** a **fixed** list of reminders written by us, not the model (for example: not eating for more than a day, repeated vomiting, trouble breathing, or anything that worries you).
- A footer: **"Pawelle is not a vet."** and a quiet label **"Written on this device by gemma3:1b"** (the model that wrote it).

### Plan tab
- **Today's plan** at the top (or a friendly empty state with the button).
- **History:** past plans, newest first, each showing the date and the one-line summary; tapping opens the full plan.

## Safety first (before the model)

A deterministic rules layer runs **before** any model call. The model never improvises on emergencies.

| Situation | What happens |
|---|---|
| Two days in a row of "Not eating" (spec 002 red flag) | **No model call.** A calm red banner says to contact the vet today. No plan is shown |
| The note or a check-in mentions something clearly dangerous: a known toxic food or plant (such as chocolate, grapes or raisins, onions or garlic, lilies, xylitol, antifreeze), a human medicine, trouble breathing, collapse, seizure or blood | **No model call.** The same calm red banner, naming the word that triggered it and saying to contact the vet or an emergency clinic now |
| One day of "Not eating", or litter box "Something's off" | The model runs, with that information in its context. The plan includes a plain, calm watch-out. The existing amber heads-up is shown above the plan |

If the owner mentions a dangerous word by mistake (for example "no chocolate today"), the banner still appears. It always shows what triggered it and how to fix it (edit the note), because wrongly warning is better than wrongly staying quiet.

## Knowing its limits (staying in bounds)

**Why this exists.** The default model, `gemma3:1b`, is small and fast, and small models have a known habit: when they don't know something, they make it up and sound sure. In a trial, asked for an unusual pasta, it invented a dish, described it in confident detail, and produced web links that don't exist. Pawelle must never do that about a cat's health. So the app does not rely on the model to know its limits. It shrinks what the model is *allowed* to say and checks everything it writes.

**What Pawelle knows:** the cat's own data (profile, check-ins, heads-ups) and a short, hand-written **knowledge sheet** of everyday cat-care basics (meal rhythm by life stage, play lengths, hydration, routine, litter-box watching). Nothing else counts as knowledge.

**What this means in practice**

1. **A tiny creative surface.** In a test, the model's free-text "why" lines often did not fit the item and one "watch-out" was just the word "sunbeam". So the model writes **one friendly summary sentence** and nothing else in its own words. The times, amounts, play ideas and the reason behind each are *chosen* from fixed, reviewed options, and the app writes the "why" text, the watch-outs and the vet notes in Pawelle's voice. The model cannot invent a recipe, a brand, an exercise or a health claim.
2. **"I'm not sure" is always allowed, and expected.** A small model cannot reliably tell when it is unsure, so Pawelle does **not** depend on it. The app adds *"I'm not sure about this one, so please check with your vet"*-style notes **by itself** under **Good to check with your vet** whenever the situation is outside its knowledge: the cat has any listed health condition, a heads-up is active, or allergies are not known.
3. **No invented facts.** No web addresses, links, sources, studies, brand names or claims of certainty ("definitely", "guaranteed", "proven"). A plan containing any of these is rejected like any other rule break.
4. **Staying on topic.** The owner's free-text notes are **never sent to the model**. They are only shown back to the owner and scanned by code for dangerous words. (In testing, a note asking for a pasta recipe leaked into a plan summary, so the notes were removed from the model's input.) The plan stays about the cat and cannot obey text that never reaches the model. In the later Ask Pawelle feature, a question outside everyday cat care gets a gentle, **fixed** reply that does not call the model at all, for example: *"That's a bit outside my whisker-range! I'm only good at looking after Pinky. Is there something about Pinky I can help with?"*
5. **Health beyond the basics goes to the vet.** Questions or situations about illness, symptoms, medicine or treatment always end with a calm "please check with your vet", never an answer.

## Rules for what the model may say (checked after it writes)

Every plan is checked by code before the owner sees it.

1. **Allergies are hard limits.** If the owner listed an allergen anywhere in the plan, the plan is rejected, regenerated once with a reminder, and replaced by the basic plan if it fails again. A plan containing a listed allergen is never shown.
2. **Allergies not answered.** The plan only ever refers to the cat's usual food, so it can never introduce a new one. When allergies are unanswered (not "none"), it also gently suggests adding them on the profile.
3. **No medicine, no diagnosis.** The plan must not name medicines, give dosages, name illnesses, or claim to know what is wrong. A plan that does is rejected as above.
4. **No made-up numbers.** No grams, calories, prices or percentages.
5. **Shape and length.** The plan must have the required parts and stay within the limits above, otherwise it is rejected as above.
6. **Plain text.** Anything the model writes is shown as plain text, never as HTML.
7. **Notes stay out of the model.** The owner's free-text notes are not given to the model, so they cannot change Pawelle's rules or voice. Only the structured profile and check-in answers are used.

## Basic plan (fallback)

When the model is unavailable, too slow or fails the checks twice, Pawelle shows a small built-in plan: the usual meals at the usual times, a short play session suited to the cat's life stage, and a reminder to try again later. It is clearly labelled **"A simple plan while my brain catches up"** and also carries the fixed vet reminders and the "not a vet" line. It is saved as a basic plan, not as an AI plan.

## When the AI brain is asleep

If Ollama is not running or the model is not downloaded, the owner sees a friendly screen: **"Pawelle's brain is asleep"** with the exact commands to wake it, a copy button, and a **Check again** button. The Plan and Today screens still work for everything else, and the basic plan is still available.

## Acceptance criteria

1. **AC1:** The Today screen shows **"Get today's plan"** when no plan exists for today, and a plan summary card with Meals, Play and Watch-outs rows (collapsed) when one does.
2. **AC2:** The button works without a check-in today and shows a soft hint recommending one.
3. **AC3:** A plan is generated from the cat's profile and the last 7 days of check-ins, and the model's name is saved with it.
4. **AC4:** A finished plan has a friendly summary, 1 to 3 meals, 1 to 3 play ideas, 0 to 3 watch-outs, a "why" on every item, the fixed vet reminders and the "Pawelle is not a vet." footer.
5. **AC5:** Portions are relative (never grams or calories) and no plan contains made-up numbers.
6. **AC6:** There is at most one plan per cat per day. "Make a fresh plan" replaces today's plan and history keeps one plan per day.
7. **AC7:** With two consecutive "Not eating" days, no plan is requested from the model and the red vet banner is shown instead.
8. **AC8:** A note or check-in containing a dangerous term (toxic food or plant, human medicine, trouble breathing, collapse, seizure, blood) triggers the red banner, names the trigger, and skips the model.
9. **AC9:** One day of "Not eating", or litter "Something's off", still produces a plan, with a calm watch-out and the amber heads-up above it.
10. **AC10:** No plan containing a listed allergen is ever shown. The plan is regenerated once, then replaced by the basic plan.
11. **AC11:** When allergies are unanswered, the plan suggests no new foods and nudges the owner to add allergies.
12. **AC12:** Plans never name medicines or dosages, name illnesses, or state a diagnosis.
13. **AC13:** The model's text is always shown as plain text.
14. **AC14:** Notes and answers typed by the owner cannot change the safety rules or the voice (checked with an attempted "ignore your rules" note).
15. **AC15:** While generating, the screen shows a skeleton and rotating playful messages, a "taking longer" message after 30 seconds, and a friendly failure after 2 minutes. The screen never freezes.
16. **AC16:** If the model returns an invalid or rule-breaking plan, it is retried once, then the basic plan is shown with the playful "brain catching up" label.
17. **AC17:** If Ollama is not running or the model is missing, the "Pawelle's brain is asleep" screen shows the exact commands, a copy button and a Check again button; the rest of the app keeps working.
18. **AC18:** The Plan tab shows today's plan (or a friendly empty state) and a newest-first history, and each history item opens the full plan.
19. **AC19:** Every plan states which model wrote it, or says it is a basic plan.
20. **AC20:** All plan wording follows the voice rules: the cat's name is used, emoji count is at most three, and health or vet wording has no puns and no emoji.
21. **AC21:** The whole flow works with Wi-Fi off, with no network call other than to Ollama on this device.
22. **AC22:** Everything is keyboard-operable, expandable rows are labelled and announce their state, and status is shown by words and icons, not color alone.
23. **AC23:** If today's check-in changes after the plan was made, a subtle note offers to refresh the plan; it never changes the plan by itself.
24. **AC24:** Deleting the cat (spec 001) deletes its plans.
25. **AC25:** Meals refer only to the cat's usual food with one of three relative amounts; a plan never names a new food, recipe or brand.
26. **AC26:** Play ideas come only from Pawelle's built-in list of safe ideas.
27. **AC27:** No plan contains links, web addresses, sources, brand names, or claims of research or certainty.
28. **AC28:** When the cat has any listed health condition, a heads-up is active, or allergies are not known, the plan shows **Good to check with your vet** with a plain suggestion to consult the vet. These notes are written by the app, not the model.
29. **AC29:** Text in notes that is unrelated to the cat (recipes, news, code, stories, instructions) never reaches the model and does not change the plan, which stays about the cat.
30. **AC30:** All factual content in a plan comes from the cat's own data or the built-in knowledge sheet.

## Ease of use (UX requirements)

1. **One tap to start.** From a finished check-in, one tap on "Get today's plan" does everything; no settings, prompts or choices.
2. **Fast enough.** With the default model, a plan typically arrives within 20 seconds on the author's laptop. The wait feels fun, not stuck.
3. **Short reads.** Collapsed rows give the whole picture at a glance; details are one tap away.
4. **Warm throughout.** Success, waiting and failure screens are all in Pawelle's voice, apart from the calm health wording.
5. **No dead ends.** Every failure offers a next step (Retry, Check again, or the basic plan).
6. **Comfortable.** Touch targets of at least 44 px, 375 px wide with no sideways scrolling, readable contrast.

## Edge cases

- **Very thin profile:** a cat with only a name still gets a plan, with a gentle nudge to add details.
- **Kitten or senior:** life stage (from age) shapes play and meal wording; if age is unknown, the plan stays general.
- **Conditions listed (for example kidney, diabetes):** the plan stays general, reminds the owner to follow their vet's diet advice, and never changes treatment.
- **Several flags at once:** the red banner wins; amber items are shown only when there is no red banner.
- **Offline:** everything works as long as Ollama is running locally.
- **Model swapped:** the saved plan keeps the model that wrote it, even if the model setting changes later.
- **Interrupted generation:** if the owner closes the app mid-way, no half plan is saved.
- **Quick double taps:** only one generation runs at a time.
- **Long names or odd characters:** names with emoji or non-Latin letters appear correctly in the plan.
- **Clock and date:** "today" is the owner's local date, as in spec 002.

## Constitution check

| Article | How this spec complies |
|---|---|
| I. Local-first | Runs on the laptop, calls only Ollama on `localhost`, works offline (AC21), plans deleted with the cat (AC24) |
| II.1 Safety before the model | Deterministic checks first, no model call on red flags (AC7, AC8) |
| II.2 Not a vet | Footer, fixed vet reminders, no diagnosis or medicine (AC4, AC12) |
| II.3 Allergies | Prompt rule plus output filter, never shown on failure (AC10, AC11) |
| II.4 Untrusted output | Validated shape, one retry, safe fallback, plain text (AC13, AC16) |
| II.5 Grounded | Only profile, check-ins and heads-ups go to the model (AC3) |
| II.6 Explainable | A "why" on every item (AC4) |
| II.7 Honest uncertainty | Fixed vet reminders and "I think" phrasing |
| II.8 Prompts are inputs | AC14; no tools, no agents, one prompt in and one validated answer out |
| II.9 Reproducible | Model name saved with each plan (AC3, AC19) |
| III. Simple on top | One button, collapsed summaries, details one tap away |
| IV. Friendly | The voice section; no guilt; no dead ends |
| V. Accessibility | AC22 |

## Decisions

1. **Default model:** `gemma3:1b`, set through the `OLLAMA_MODEL` setting, with no code change needed to swap it.
2. **Plan scope:** daily plan only. Ask Pawelle, the food checker and weekly plans come later.
3. **One plan per day**, replaceable by "Make a fresh plan".
4. **Fixed vet reminders** are written by us, not the model, because a small model should not decide what is urgent.
5. **Relative portions only**, because a small model cannot be trusted with quantities.
6. **Basic plan fallback** is included, so the app never ends in an error with nothing to show.
7. **Three nav tabs** now: Today, Plan, Track.
8. **Ask Pawelle** (the free-form conversation) is its own spec 004, built right after this one and reusing these voice rules.
9. **Constitution v1.1** now has Article IX, "Pawelle's voice".
10. **Dangerous-word list** is proposed in the plan and kept as a data file so it can be reviewed and edited without code changes.
11. **Emoji budget:** at most three per plan.
12. **Structured choices over free text:** the model writes one summary sentence; times, amounts, play ideas and reasons are chosen from fixed options, and the app writes the "why", watch-outs and vet notes. A 1B model cannot be trusted with more (shown by testing). This trades some variety for safety and reliability.
13. **Pawelle only "knows" the cat's data and a short knowledge sheet.** Anything else is "I'm not sure, please check with your vet".
14. **Off-topic questions** (relevant in the Ask Pawelle feature) get a fixed, friendly redirect without calling the model.
