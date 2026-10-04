import { useCallback, useEffect, useState } from 'react'
import { listCheckins, saveCheckin } from '../api/client.js'

const byDateDesc = (a, b) => b.date.localeCompare(a.date)

// Recent check-ins for one cat. status: 'loading' | 'ready' | 'error'.
// While a bigger window loads, the previous items stay available (no flash).
export function useCheckins(petId, days = 14) {
  const key = `${petId}:${days}`
  const [state, setState] = useState({ key: null, items: [], error: null })
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (petId == null) return undefined
    let stale = false
    listCheckins(petId, days)
      .then((items) => !stale && setState({ key, items, error: null }))
      .catch((error) => !stale && setState((s) => ({ key, items: s.items, error })))
    return () => {
      stale = true
    }
  }, [petId, days, key, tick])

  const save = useCallback(
    async (date, payload) => {
      const saved = await saveCheckin(petId, date, payload)
      setState((s) => ({
        ...s,
        error: null,
        items: [saved, ...s.items.filter((i) => i.date !== date)].sort(byDateDesc),
      }))
      return saved
    },
    [petId],
  )

  const reload = useCallback(() => setTick((t) => t + 1), [])
  const status = state.key !== key ? 'loading' : state.error ? 'error' : 'ready'
  return { status, items: state.items, error: state.error, save, reload }
}
