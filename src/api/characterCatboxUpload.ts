import type { Character, HostedAsset } from '../types/character'
import {
  addToAlbum,
  createAlbum,
  parseAlbumShortFromResponse,
  removeFromAlbum,
  uploadAuthenticatedWithShorten,
} from './catboxClient'

export type AlbumUploadResult = {
  hosted: HostedAsset
  catboxAlbumShort: string
}

/**
 * Upload a file to the user’s Catbox, then attach it to this character’s album
 * (create album on first file, addtoalbum afterward).
 */
export async function uploadFileToCharacterAlbum(
  character: Character,
  file: File,
  userhash: string,
): Promise<AlbumUploadResult> {
  const { catboxUrl, shortUrl, fileName } = await uploadAuthenticatedWithShorten(file, userhash)

  let albumShort = character.catboxAlbumShort?.trim().toLowerCase() ?? null

  if (!albumShort) {
    const raw = await createAlbum(
      userhash,
      character.name.trim() || 'Character',
      `Nara — ${character.id}`,
      [fileName],
    )
    const parsed = parseAlbumShortFromResponse(raw)
    if (!parsed) {
      throw new Error(
        `Album was created but the app could not read its id from Catbox’s reply. Raw: ${raw.slice(0, 200)}`,
      )
    }
    albumShort = parsed
  } else {
    await addToAlbum(userhash, albumShort, [fileName])
  }

  return {
    hosted: { catboxUrl, shortUrl, fileName },
    catboxAlbumShort: albumShort,
  }
}

export async function removeCatboxFilesFromAlbum(
  userhash: string,
  albumShort: string | null | undefined,
  fileNames: (string | undefined)[],
): Promise<void> {
  const short = albumShort?.trim().toLowerCase()
  if (!short) return
  const names = fileNames.filter((f): f is string => Boolean(f?.trim()))
  if (!names.length) return
  await removeFromAlbum(userhash, short, names)
}
