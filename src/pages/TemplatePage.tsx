import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { IntroductionStudio } from '../components/IntroductionStudio'
import { useCharacters } from '../hooks/useCharacters'
import { defaultCrushonCardFields, defaultGifConstructor, defaultImageLibrary } from '../types/character'
import type { Character } from '../types/character'

export function TemplatePage() {
  const { storageReady, introductionTemplate, setIntroductionTemplate } = useCharacters()

  const templatePreviewCharacter: Character = useMemo(
    () => ({
      id: 'new-character-template',
      name: 'New character template',
      avatarDataUrl: null,
      avatarHosted: null,
      catboxAlbumShort: null,
      tags: [],
      createdAt: 0,
      updatedAt: 0,
      description: introductionTemplate,
      crushonCard: defaultCrushonCardFields(),
      gifConstructor: defaultGifConstructor(),
      gifHosted: null,
      imageLibrary: defaultImageLibrary(),
    }),
    [introductionTemplate],
  )

  if (!storageReady) {
    return (
      <div className="page storage-loading">
        <p className="storage-loading-text">Loading template…</p>
      </div>
    )
  }

  return (
    <div className="page template-page">
      <div className="template-page-head">
        <Link to="/" className="back-link">
          ← Back to characters
        </Link>
        <h1 className="home-title">New character template</h1>
        <p className="home-sub">
          New characters inherit this introduction template: opening text, sections, colors, opacity, and borders.
        </p>
      </div>

      <IntroductionStudio
        character={templatePreviewCharacter}
        onUpdate={(next) => setIntroductionTemplate(next.description)}
        title="Template editor"
        showExportControls={false}
      />
    </div>
  )
}
