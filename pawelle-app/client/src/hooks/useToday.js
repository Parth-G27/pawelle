import { useEffect, useState } from 'react'
import { localToday } from '../lib/dates.js'

// The owner's local date. It updates by itself after midnight, or when the tab wakes up.
export function useToday() {
  const [today, setToday] = useState(() => localToday())
  useEffect(() => {
    const tick = () => setToday(localToday())
    const id = setInterval(tick, 60_000)
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('focus', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
      window.removeEventListener('focus', tick)
    }
  }, [])
  return today
}
