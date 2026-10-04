// The built-in plan used when the model is unavailable, too slow, or fails the checks twice.
// Same shape as an AI plan, no model involved.
import { normalisePlan } from './planChecks.js'

export const BASIC_SUMMARY = (name) => `Here's a simple plan for ${name} while my brain catches up.`

export function basicPlan({ name, ctx }) {
  const stage = ctx.lifeStage
  const act = ctx.activity_level
  let meals
  let play
  if (stage === 'kitten') {
    meals = [
      { time: 'morning', amount: 'usual', reason: 'small_meals' },
      { time: 'midday', amount: 'usual', reason: 'small_meals' },
      { time: 'evening', amount: 'usual', reason: 'small_meals' },
    ]
    play = [
      { idea: 'feather_wand', minutes: 10, reason: 'short_bursts' },
      { idea: 'crinkle_ball', minutes: 10, reason: 'hunt_instinct' },
    ]
  } else if (stage === 'senior') {
    meals = [
      { time: 'morning', amount: 'usual', reason: 'small_meals' },
      { time: 'evening', amount: 'usual', reason: 'small_meals' },
    ]
    play = [
      { idea: 'feather_wand', minutes: 10, reason: 'gentle_senior' },
      { idea: 'cuddle_time', minutes: 10, reason: 'bonding' },
    ]
  } else {
    meals = [
      { time: 'morning', amount: 'usual', reason: 'two_meals' },
      { time: 'evening', amount: 'usual', reason: 'routine' },
    ]
    play =
      act === 'lazy'
        ? [
            { idea: 'feather_wand', minutes: 10, reason: 'short_bursts' },
            { idea: 'window_watching', minutes: 10, reason: 'bonding' },
          ]
        : act === 'playful'
          ? [
              { idea: 'feather_wand', minutes: 15, reason: 'hunt_instinct' },
              { idea: 'chase_the_toy_mouse', minutes: 15, reason: 'short_bursts' },
            ]
          : [
              { idea: 'feather_wand', minutes: 15, reason: 'short_bursts' },
              { idea: 'puzzle_feeder', minutes: 10, reason: 'hunt_instinct' },
            ]
  }
  return normalisePlan({ summary: BASIC_SUMMARY(name), meals, play }, ctx)
}
