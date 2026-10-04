import { useContext } from 'react'
import { PetContext } from './petContext.js'

// { status: 'loading' | 'ready' | 'error', pet, error, version, reload }
export function usePet() {
  return useContext(PetContext)
}
