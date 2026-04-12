import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CharacterJsonExport } from '../components/CharacterJsonExport'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { CrushonFieldStudio } from '../components/CrushonFieldStudio'
import { IntroductionStudio } from '../components/IntroductionStudio'
import { GifConstructor } from '../components/GifConstructor'
import { ImageLibraryPanel } from '../components/ImageLibraryPanel'
import { ProfileHeader } from '../components/ProfileHeader'
import { useCharacters } from '../hooks/useCharacters'
import type { Character } from '../types/character'

type FeatureTab =
  | 'introduction'
  | 'personality'
  | 'scenario'
  | 'greeting'
  | 'appearance'
  | 'gif'
  | 'images'

export function CharacterPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { characters, upsertCharacter, deleteCharacter, storageReady } = useCharacters()
  const [featureTab, setFeatureTab] = useState<FeatureTab>('introduction')
  const [deleteOpen, setDeleteOpen] = useState(false)

  const character = useMemo(
    () => (id ? characters.find((c) => c.id === id) : undefined),
    [characters, id],
  )

  useEffect(() => {
    if (!storageReady || !id) return
    if (!characters.some((c) => c.id === id)) navigate('/', { replace: true })
  }, [id, characters, navigate, storageReady])

  if (!storageReady) {
    return (
      <div className="page character-page storage-loading">
        <p className="storage-loading-text">Loading…</p>
      </div>
    )
  }

  if (!character || !id) return null

  function persist(next: Character) {
    upsertCharacter(next)
  }

  function confirmDelete() {
    if (!id) return
    deleteCharacter(id)
    setDeleteOpen(false)
    navigate('/')
  }

  return (
    <div className="page character-page">
      <ConfirmDialog
        open={deleteOpen}
        title="Delete this character?"
        message="This removes the character from this browser’s storage. You can’t undo this, unless you kept a JSON backup."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <div className="character-page-bar">
        <Link to="/" className="back-link">
          ← All characters
        </Link>
        <div className="character-page-bar-actions">
          <button type="button" className="btn btn-danger-ghost" onClick={() => setDeleteOpen(true)}>
            Delete character
          </button>
        </div>
      </div>

      <section className="character-profile-section">
        <h2 className="visually-hidden">Profile</h2>
        <ProfileHeader character={character} onChange={persist} />
        <CharacterJsonExport character={character} />
      </section>

      <section className="character-feature-section">
        <div className="feature-tabs" role="tablist" aria-label="Character features">
          <button
            type="button"
            role="tab"
            aria-selected={featureTab === 'introduction'}
            className={`feature-tab ${featureTab === 'introduction' ? 'active' : ''}`}
            onClick={() => setFeatureTab('introduction')}
          >
            Introduction studio
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={featureTab === 'personality'}
            className={`feature-tab ${featureTab === 'personality' ? 'active' : ''}`}
            onClick={() => setFeatureTab('personality')}
          >
            Personality
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={featureTab === 'scenario'}
            className={`feature-tab ${featureTab === 'scenario' ? 'active' : ''}`}
            onClick={() => setFeatureTab('scenario')}
          >
            Scenario
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={featureTab === 'greeting'}
            className={`feature-tab ${featureTab === 'greeting' ? 'active' : ''}`}
            onClick={() => setFeatureTab('greeting')}
          >
            Greeting
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={featureTab === 'appearance'}
            className={`feature-tab ${featureTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setFeatureTab('appearance')}
          >
            Appearance
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={featureTab === 'gif'}
            className={`feature-tab ${featureTab === 'gif' ? 'active' : ''}`}
            onClick={() => setFeatureTab('gif')}
          >
            GIF constructor
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={featureTab === 'images'}
            className={`feature-tab ${featureTab === 'images' ? 'active' : ''}`}
            onClick={() => setFeatureTab('images')}
          >
            Image library
          </button>
        </div>

        {featureTab === 'introduction' && (
          <IntroductionStudio character={character} onUpdate={persist} />
        )}
        {featureTab === 'personality' && (
          <CrushonFieldStudio field="personality" character={character} onUpdate={persist} />
        )}
        {featureTab === 'scenario' && (
          <CrushonFieldStudio field="scenario" character={character} onUpdate={persist} />
        )}
        {featureTab === 'greeting' && (
          <CrushonFieldStudio field="greeting" character={character} onUpdate={persist} />
        )}
        {featureTab === 'appearance' && (
          <CrushonFieldStudio field="appearance" character={character} onUpdate={persist} />
        )}
        {featureTab === 'gif' && <GifConstructor character={character} onUpdate={persist} />}
        {featureTab === 'images' && <ImageLibraryPanel character={character} onUpdate={persist} />}
      </section>
    </div>
  )
}
