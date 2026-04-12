import type { IntroductionStudioContent } from '../types/character'
import { DEFAULT_PALETTE } from '../types/character'
import { newId } from '../utils/id'
import { compileOpeningBasicToHtml, compileSectionBasicToHtml } from '../utils/descriptionBasicMarkup'

export function createEmptyIntroductionStudio(): IntroductionStudioContent {
  const palette = { ...DEFAULT_PALETTE }
  return {
    openingHtml: compileOpeningBasicToHtml(
      'A veil of quiet words—replace this with your hook. The structure stays; the story is yours.',
      palette,
    ),
    sections: [
      {
        id: newId(),
        title: 'Highlights',
        html: compileSectionBasicToHtml(
          'Optional blocks for structure—this whole document maps to Crushon **Introduction** only. Use the **Personality**, **Scenario**, **Greeting**, and **Appearance** tabs for those fields.',
        ),
      },
    ],
    palette,
  }
}
