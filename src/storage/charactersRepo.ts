import type { Character } from '../types/character'
import type { IntroductionStudioContent } from '../types/character'
import { createEmptyIntroductionStudio } from '../constants/defaults'
import { defaultCrushonCardFields, defaultGifConstructor, defaultImageLibrary } from '../types/character'
import { requestPersistentStorage } from './browserPersistence'
import { idbGet, idbSet } from './idb'
import { stripAllGifFramePixels } from './stripForStorage'
import { newId } from '../utils/id'
import {
  getStoredWorkspaceHandle,
  writeCharactersJson,
} from './workspaceFile'

const IDB_KEY = 'characters_v1'
const INTRO_TEMPLATE_KEY = 'introduction_template_v1'
/** Pre-IndexedDB localStorage key; migrated once then removed. */
const LEGACY_LS_KEY = 'nara-narrator-characters-v1'

/** Fills optional fields missing from older persisted data. */
export function normalizeCharacter(c: Character): Character {
  const normalizedDescription = {
    ...c.description,
    sections: c.description.sections.map((section) => ({
      ...section,
      opacity: section.opacity ?? 0.9,
      showBorder: section.showBorder ?? true,
      borderColor: section.borderColor ?? c.description.palette.muted ?? '#8f879e',
    })),
  }

  return {
    ...c,
    age: c.age ?? '',
    avatarHosted: c.avatarHosted ?? null,
    catboxAlbumShort: c.catboxAlbumShort ?? null,
    gifHosted: c.gifHosted ?? null,
    description: normalizedDescription,
    gifConstructor: c.gifConstructor ?? defaultGifConstructor(),
    imageLibrary: c.imageLibrary ?? defaultImageLibrary(),
    crushonCard: c.crushonCard ?? defaultCrushonCardFields(),
  }
}

export async function loadInitialCharacters(): Promise<Character[]> {
  void requestPersistentStorage()

  const fromIdb = await idbGet<Character[]>(IDB_KEY)
  if (fromIdb !== undefined && Array.isArray(fromIdb)) {
    return fromIdb.map(normalizeCharacter)
  }

  try {
    const raw = localStorage.getItem(LEGACY_LS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) {
        const list = (parsed as Character[]).map(normalizeCharacter)
        await persistCharacters(list)
        localStorage.removeItem(LEGACY_LS_KEY)
        return list
      }
    }
  } catch {
    void 0 // ignore legacy migration parse errors
  }

  return []
}

export async function persistCharacters(list: Character[]): Promise<void> {
  try {
    await idbSet(IDB_KEY, list)
  } catch {
    // quota: drop embedded GIF frame pixels and retry
    try {
      await idbSet(IDB_KEY, stripAllGifFramePixels(list))
    } catch (e) {
      console.error('Failed to persist characters to IndexedDB', e)
    }
  }
}

export async function syncLinkedWorkspaceFile(list: Character[]): Promise<void> {
  const handle = await getStoredWorkspaceHandle()
  if (!handle) return
  try {
    await writeCharactersJson(handle, list)
  } catch (e) {
    console.warn('Linked file sync failed', e)
  }
}

export function normalizeIntroductionTemplate(
  template?: IntroductionStudioContent | null,
): IntroductionStudioContent {
  const base = createEmptyIntroductionStudio()
  if (!template) return base
  return {
    openingHtml: template.openingHtml ?? base.openingHtml,
    palette: {
      ...base.palette,
      ...(template.palette ?? {}),
    },
    sections:
      template.sections?.map((section) => ({
        id: section.id ?? newId(),
        title: section.title ?? '',
        html: section.html ?? '<p></p>',
        opacity: section.opacity ?? 0.9,
        showBorder: section.showBorder ?? true,
        borderColor: section.borderColor ?? template.palette?.muted ?? base.palette.muted,
      })) ?? base.sections,
  }
}

export async function loadIntroductionTemplate(): Promise<IntroductionStudioContent> {
  const fromIdb = await idbGet<IntroductionStudioContent>(INTRO_TEMPLATE_KEY)
  return normalizeIntroductionTemplate(fromIdb)
}

export async function persistIntroductionTemplate(template: IntroductionStudioContent): Promise<void> {
  await idbSet(INTRO_TEMPLATE_KEY, template)
}
