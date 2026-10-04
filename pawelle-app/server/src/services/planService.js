// The whole flow in one place: safety first, then one prompt in and one validated answer out.
import { ApiError } from '../lib/errors.js'
import { addDaysIso } from '../lib/dates.js'
import { describeAge, lifeStage } from '../lib/lifeStage.js'
import { getCheckin, listCheckins } from '../db/checkins.js'
import { checkinStamp, getPlanRow, isStale, upsertPlanRow } from '../db/plans.js'
import { basicPlan } from './basicPlan.js'
import { OllamaError } from './ollama.js'
import { checkPlan } from './planChecks.js'
import { buildAskVet, buildWatchOuts, renderPlan } from './planContent.js'
import { planJsonSchema } from './planSchema.js'
import { buildMessages } from './prompts.js'
import { planSafety } from './safety.js'

export const DEADLINE_MS = 115_000 // the spec's "2 minutes"

const asOf = (date) => new Date(`${date}T12:00:00Z`)

function offline(reason, model) {
  const message =
    reason === 'model_missing'
      ? "Pawelle's brain still needs to be downloaded."
      : "Pawelle's brain is asleep right now."
  return new ApiError(503, 'AI_OFFLINE', message, { reason, model })
}

export function createPlanService({ db, ai, deadlineMs = DEADLINE_MS }) {
  const busy = new Set()

  const inputsFor = (pet, date) => {
    const today = getCheckin(db, pet.id, date)
    const yesterday = getCheckin(db, pet.id, addDaysIso(date, -1))
    return { today, yesterday, safety: planSafety({ today, yesterday, petName: pet.name }) }
  }

  const ctxFor = (pet, date, today) => ({
    name: pet.name,
    sex: pet.sex,
    allergies: pet.allergies,
    conditions: pet.conditions,
    lifeStage: lifeStage(pet.birthdate, asOf(date)),
    activity_level: pet.activity_level,
    energy: today?.energy ?? null,
    mood: today?.mood ?? null,
    appetite: today?.appetite ?? null,
    hasCheckin: Boolean(today),
  })

  // -> { plan } or { fallback: 'slow' | 'invalid' }; throws AI_OFFLINE if Ollama is not usable
  async function askModel({ pet, date, today, flags, ctx }) {
    const end = Date.now() + deadlineMs
    const input = {
      pet, date, today, flags,
      recent: listCheckins(db, pet.id, 7),
      stage: ctx.lifeStage,
      ageText: describeAge(pet.birthdate, pet.birthdate_estimated, asOf(date)),
    }
    let problems = []
    for (let attempt = 0; attempt < 2; attempt++) {
      const remaining = end - Date.now()
      if (remaining <= 1000) return { fallback: 'slow' }
      let raw
      try {
        raw = await ai.chat({ messages: buildMessages(input, problems), schema: planJsonSchema, timeoutMs: remaining })
      } catch (e) {
        if (!(e instanceof OllamaError)) throw e
        if (e.kind === 'offline' || e.kind === 'model_missing') throw offline(e.kind, ai.model)
        if (e.kind === 'timeout') return { fallback: 'slow' }
        problems = ['shape']
        continue
      }
      const result = checkPlan(raw, ctx)
      if (result.ok) return { plan: result.plan }
      problems = result.problems
    }
    return { fallback: 'invalid' }
  }

  return {
    // -> { plan | null, safety, generating }
    getState(pet, date) {
      const { safety } = inputsFor(pet, date)
      const row = getPlanRow(db, pet.id, date)
      const plan =
        row && !safety.blocked
          ? renderPlan({ row, pet, stale: isStale(row, checkinStamp(db, pet.id, date)) })
          : null
      return { plan, safety, generating: busy.has(pet.id) }
    },

    // -> { status: 'blocked', safety } | { status: 'ok', plan }
    async generate(pet, date, { mode } = {}) {
      const { today, safety } = inputsFor(pet, date)
      if (safety.blocked) return { status: 'blocked', safety } // the model is never called
      if (busy.has(pet.id)) throw new ApiError(409, 'BUSY', "I'm already working on it!")
      busy.add(pet.id)
      try {
        const ctx = ctxFor(pet, date, today)
        let core
        let source = 'ai'
        let reason = null
        if (mode === 'basic') {
          ;[source, reason] = ['basic', 'requested']
        } else {
          const health = await ai.health()
          if (!health.running) throw offline('not_running', ai.model)
          if (!health.modelReady) throw offline('model_missing', ai.model)
          const result = await askModel({ pet, date, today, flags: safety.flags, ctx })
          if (result.plan) core = result.plan
          else [source, reason] = ['basic', result.fallback]
        }
        if (!core) core = basicPlan({ name: pet.name, ctx })
        const content = {
          ...core,
          watch_outs: buildWatchOuts({ name: pet.name, checkin: today, flags: safety.flags }),
          ask_vet: buildAskVet({ name: pet.name, conditions: pet.conditions, flags: safety.flags, allergies: pet.allergies }),
        }
        const row = upsertPlanRow(db, {
          petId: pet.id, date, source, model: source === 'ai' ? ai.model : null, reason,
          content, checkinStamp: checkinStamp(db, pet.id, date),
        })
        return { status: 'ok', plan: renderPlan({ row, pet, stale: false }) }
      } finally {
        busy.delete(pet.id)
      }
    },
  }
}
