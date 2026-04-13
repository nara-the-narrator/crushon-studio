import { createContext } from 'react'
import type { Character } from '../types/character'

export interface CharactersContextValue {
  characters: Character[]
  storageReady: boolean
  storagePersisted: boolean | null
  linkedFileName: string | null
  getById: (id: string) => Character | undefined
  createCharacter: () => Character
  upsertCharacter: (c: Character) => void
  deleteCharacter: (id: string) => void
  replaceAllCharacters: (list: Character[]) => void
  linkWorkspaceFile: () => Promise<boolean>
  unlinkWorkspaceFile: () => Promise<void>
  openWorkspaceFile: () => Promise<boolean>
  downloadBackup: () => Promise<boolean>
}

export const CharactersContext = createContext<CharactersContextValue | null>(null)
