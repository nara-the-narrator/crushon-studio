import { createContext } from 'react'
import type { Character } from '../types/character'

export interface CharactersContextValue {
  characters: Character[]
  /** False until IndexedDB (and migration) has finished loading */
  storageReady: boolean
  /** Best-effort: browser granted persistent storage (less likely to evict data). */
  storagePersisted: boolean | null
  /** Linked disk file name (Chromium File System Access), if any */
  linkedFileName: string | null
  getById: (id: string) => Character | undefined
  createCharacter: () => Character
  upsertCharacter: (c: Character) => void
  deleteCharacter: (id: string) => void
  replaceAllCharacters: (list: Character[]) => void
  /** Resolves true if a file was linked; false if the user cancelled. */
  linkWorkspaceFile: () => Promise<boolean>
  unlinkWorkspaceFile: () => Promise<void>
  /** Resolves true if the library was replaced from a file; false if cancelled. */
  openWorkspaceFile: () => Promise<boolean>
  downloadBackup: () => void
}

export const CharactersContext = createContext<CharactersContextValue | null>(null)
