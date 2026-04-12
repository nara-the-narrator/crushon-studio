import { useContext } from 'react'
import { CharactersContext, type CharactersContextValue } from '../context/charactersContext'

export function useCharacters(): CharactersContextValue {
  const ctx = useContext(CharactersContext)
  if (!ctx) throw new Error('useCharacters must be used within CharactersProvider')
  return ctx
}
