import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { createEmptyIntroductionStudio } from '../constants/defaults'
import { isStoragePersisted } from '../storage/browserPersistence'
import {
  loadInitialCharacters,
  normalizeCharacter,
  persistCharacters,
  syncLinkedWorkspaceFile,
} from '../storage/charactersRepo'
import {
  getStoredWorkspaceHandle,
  pickFileToOpen,
  pickFileToSave,
  readCharactersJson,
  setStoredWorkspaceHandle,
  writeCharactersJson,
} from '../storage/workspaceFile'
import type { Character } from '../types/character'
import { defaultCrushonCardFields, defaultGifConstructor, defaultImageLibrary } from '../types/character'
import { newId } from '../utils/id'
import { CharactersContext } from './charactersContext'

export function CharactersProvider({ children }: { children: ReactNode }) {
  const [characters, setCharacters] = useState<Character[]>([])
  const [storageReady, setStorageReady] = useState(false)
  const [storagePersisted, setStoragePersisted] = useState<boolean | null>(null)
  const [linkedFileName, setLinkedFileName] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const list = await loadInitialCharacters()
      const persisted = await isStoragePersisted()
      const handle = await getStoredWorkspaceHandle()
      if (cancelled) return
      setCharacters(list)
      setStoragePersisted(persisted)
      setLinkedFileName(handle?.name ?? null)
      setStorageReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!storageReady) return
    void (async () => {
      await persistCharacters(characters)
      await syncLinkedWorkspaceFile(characters)
    })()
  }, [characters, storageReady])

  const getById = useCallback(
    (id: string) => characters.find((c) => c.id === id),
    [characters],
  )

  const createCharacter = useCallback((): Character => {
    const now = Date.now()
    const c: Character = {
      id: newId(),
      name: 'Unnamed character',
      avatarDataUrl: null,
      avatarHosted: null,
      catboxAlbumShort: null,
      tags: ['work in progress'],
      createdAt: now,
      updatedAt: now,
      description: createEmptyIntroductionStudio(),
      crushonCard: defaultCrushonCardFields(),
      gifConstructor: defaultGifConstructor(),
      gifHosted: null,
      imageLibrary: defaultImageLibrary(),
    }
    setCharacters((prev) => [c, ...prev])
    return c
  }, [])

  const upsertCharacter = useCallback((c: Character) => {
    setCharacters((prev) => {
      const i = prev.findIndex((x) => x.id === c.id)
      const next = { ...c, updatedAt: Date.now() }
      if (i === -1) return [next, ...prev]
      const copy = [...prev]
      copy[i] = next
      return copy
    })
  }, [])

  const deleteCharacter = useCallback((id: string) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const replaceAllCharacters = useCallback((list: Character[]) => {
    setCharacters(list.map(normalizeCharacter))
  }, [])

  const linkWorkspaceFile = useCallback(async (): Promise<boolean> => {
    const handle = await pickFileToSave()
    if (!handle) return false
    await writeCharactersJson(handle, characters)
    await setStoredWorkspaceHandle(handle)
    setLinkedFileName(handle.name)
    return true
  }, [characters])

  const unlinkWorkspaceFile = useCallback(async () => {
    await setStoredWorkspaceHandle(null)
    setLinkedFileName(null)
  }, [])

  const openWorkspaceFile = useCallback(async (): Promise<boolean> => {
    const handle = await pickFileToOpen()
    if (!handle) return false
    const raw = await readCharactersJson(handle)
    const ok = window.confirm(
      'Replace your current library with the contents of this file? This cannot be undone.',
    )
    if (!ok) return false
    replaceAllCharacters(raw)
    return true
  }, [replaceAllCharacters])

  const downloadBackup = useCallback(() => {
    const blob = new Blob([JSON.stringify(characters, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `nara-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [characters])

  const value = useMemo(
    () => ({
      characters,
      storageReady,
      storagePersisted,
      linkedFileName,
      getById,
      createCharacter,
      upsertCharacter,
      deleteCharacter,
      replaceAllCharacters,
      linkWorkspaceFile,
      unlinkWorkspaceFile,
      openWorkspaceFile,
      downloadBackup,
    }),
    [
      characters,
      storageReady,
      storagePersisted,
      linkedFileName,
      getById,
      createCharacter,
      upsertCharacter,
      deleteCharacter,
      replaceAllCharacters,
      linkWorkspaceFile,
      unlinkWorkspaceFile,
      openWorkspaceFile,
      downloadBackup,
    ],
  )

  return (
    <CharactersContext.Provider value={value}>{children}</CharactersContext.Provider>
  )
}
