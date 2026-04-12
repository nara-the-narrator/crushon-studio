import { idbDelete, idbGet, idbSet } from './idb'
import type { Character } from '../types/character'

const HANDLE_KEY = 'workspaceFileHandleV1'

export function isFileSystemAccessSupported(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window
}

export async function getStoredWorkspaceHandle(): Promise<FileSystemFileHandle | undefined> {
  return idbGet<FileSystemFileHandle>(HANDLE_KEY)
}

export async function setStoredWorkspaceHandle(handle: FileSystemFileHandle | null): Promise<void> {
  if (handle) await idbSet(HANDLE_KEY, handle)
  else await idbDelete(HANDLE_KEY)
}

async function ensureWritePermission(handle: FileSystemFileHandle): Promise<boolean> {
  const opts = { mode: 'readwrite' as const }
  try {
    if ((await handle.queryPermission(opts)) === 'granted') return true
    return (await handle.requestPermission(opts)) === 'granted'
  } catch {
    return false
  }
}

export async function writeCharactersJson(
  handle: FileSystemFileHandle,
  characters: Character[],
): Promise<void> {
  if (!(await ensureWritePermission(handle))) {
    throw new Error('No permission to write to the linked file.')
  }
  const json = JSON.stringify(characters, null, 2)
  const writable = await handle.createWritable()
  await writable.write(json)
  await writable.close()
}

export async function readCharactersJson(handle: FileSystemFileHandle): Promise<Character[]> {
  const file = await handle.getFile()
  const text = await file.text()
  const parsed = JSON.parse(text) as unknown
  if (!Array.isArray(parsed)) throw new Error('Invalid file format')
  return parsed as Character[]
}

export async function pickFileToSave(): Promise<FileSystemFileHandle | null> {
  if (!isFileSystemAccessSupported()) return null
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: 'nara-characters.json',
      types: [
        {
          description: 'JSON',
          accept: { 'application/json': ['.json'] },
        },
      ],
    })
    return handle
  } catch {
    return null
  }
}

export async function pickFileToOpen(): Promise<FileSystemFileHandle | null> {
  if (!isFileSystemAccessSupported()) return null
  try {
    const handles = await window.showOpenFilePicker({
      types: [
        {
          description: 'JSON',
          accept: { 'application/json': ['.json'] },
        },
      ],
      multiple: false,
    })
    return handles[0] ?? null
  } catch {
    return null
  }
}
