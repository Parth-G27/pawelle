import { useCallback, useEffect, useState } from 'react'
import { generatePlan, getPlan } from '../api/client.js'

const NO_FLAGS = { blocked: false, flags: [] }

// Today's plan for one cat. While the server is still generating (even after a reload or a
// visit to another tab) it keeps checking every 2 seconds until the plan is there.
export function usePlan(petId, date) {
  const key = `${petId}:${date}`
  const [state, setState] = useState({ key: null, plan: null, safety: NO_FLAGS, generating: false, error: null })
  const [tick, setTick] = useState(0)
  const [busy, setBusy] = useState(false)
  const [offline, setOffline] = useState(null) // AI_OFFLINE error: { fields: { reason, model } }
  const [failure, setFailure] = useState(null)
  const [freshAt, setFreshAt] = useState(0) // when a plan was just written (to celebrate it once)

  useEffect(() => {
    if (petId == null) return undefined
    let stale = false
    getPlan(petId, date)
      .then((d) => !stale && setState({ key, ...d, error: null }))
      .catch((error) => !stale && setState((s) => ({ ...s, key, error })))
    return () => {
      stale = true
    }
  }, [petId, date, key, tick])

  useEffect(() => {
    if (!state.generating || busy) return undefined
    const id = setInterval(() => setTick((t) => t + 1), 2000)
    return () => clearInterval(id)
  }, [state.generating, busy])

  const reload = useCallback(() => setTick((t) => t + 1), [])

  const generate = useCallback(
    async ({ basic = false } = {}) => {
      setBusy(true)
      setFailure(null)
      setOffline(null)
      try {
        const r = await generatePlan(petId, date, { basic })
        if (r.status === 'blocked') setState((s) => ({ ...s, key, plan: null, safety: r.safety }))
        else {
          setState((s) => ({ ...s, key, plan: r.plan, safety: NO_FLAGS, generating: false }))
          setFreshAt(Date.now())
        }
      } catch (e) {
        if (e.code === 'AI_OFFLINE') setOffline(e)
        else if (e.code === 'BUSY') reload()
        else setFailure(e)
      } finally {
        setBusy(false)
      }
    },
    [petId, date, key, reload],
  )

  const status = state.key !== key ? 'loading' : state.error && !state.plan ? 'error' : 'ready'
  return {
    status,
    plan: state.plan,
    safety: state.safety,
    generating: busy || state.generating,
    offline,
    failure,
    freshAt,
    error: state.error,
    generate,
    reload,
  }
}
