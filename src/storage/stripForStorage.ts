import type { Character } from '../types/character'

/** Drop GIF frame pixel data so JSON fits in localStorage; keeps timings & settings. */
export function stripGifFramePixels(character: Character): Character {
  return {
    ...character,
    gifConstructor: {
      ...character.gifConstructor,
      frames: character.gifConstructor.frames.map((f) => ({
        ...f,
        dataUrl: '',
      })),
    },
  }
}

export function stripAllGifFramePixels(list: Character[]): Character[] {
  return list.map(stripGifFramePixels)
}
