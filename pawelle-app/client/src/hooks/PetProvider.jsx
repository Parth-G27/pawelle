import { useCallback, useEffect, useMemo, useState } from 'react'
import { listPets } from '../api/client.js'
import { PetContext } from './petContext.js'

export default function PetProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', pet: null, error: null, version: 0 })

  const reload = useCallback(async () => {
    try {
      const pets = await listPets()
      setState((s) => ({ status: 'ready', pet: pets[0] ?? null, error: null, version: s.version + 1 }))
    } catch (error) {
      setState((s) => ({ ...s, status: 'error', error }))
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const value = useMemo(() => ({ ...state, reload }), [state, reload])
  return <PetContext.Provider value={value}>{children}</PetContext.Provider>
}
