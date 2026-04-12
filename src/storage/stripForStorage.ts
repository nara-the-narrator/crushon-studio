import type { Character } from '../types/character'

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
