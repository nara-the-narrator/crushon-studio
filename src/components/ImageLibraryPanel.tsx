import { useCallback, useMemo, useRef, useState } from 'react'
import { useButtonFlash } from '../hooks/useButtonFlash'
import { normalizePastedImageUrl, resolveCatboxUserhash } from '../api/catboxClient'
import { removeCatboxFilesFromAlbum, uploadFileToCharacterAlbum } from '../api/characterCatboxUpload'
import { useCatboxSettings } from '../context/CatboxSettingsContext'
import type { Character, ClothesState, ImageHostSource } from '../types/character'
import { newId } from '../utils/id'
import { buildActionTrackerPrompt, buildClothesTrackerPrompt } from '../utils/trackerPromptExport'

const CLOTHES_STATES: ClothesState[] = ['Clothed', 'Underwear', 'Naked']

function sourceBadge(source: ImageHostSource | undefined): string {
  if (source === 'manual') return 'Pasted URL'
  return 'Catbox album'
}

export function ImageLibraryPanel({
  character,
  onUpdate,
}: {
  character: Character
  onUpdate: (c: Character) => void
}) {
  const { userhash: storedHash } = useCatboxSettings()
  const userhash = resolveCatboxUserhash(storedHash)
  const lib = character.imageLibrary
  const [busy, setBusy] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [actionLabel, setActionLabel] = useState('')
  const [actionPasteUrl, setActionPasteUrl] = useState('')
  const [pasteByState, setPasteByState] = useState<Record<ClothesState, string>>({
    Clothed: '',
    Underwear: '',
    Naked: '',
  })
  const clothesRefs = useRef<Record<ClothesState, HTMLInputElement | null>>({
    Clothed: null,
    Underwear: null,
    Naked: null,
  })
  const actionFileRef = useRef<HTMLInputElement>(null)

  const patchCharacter = useCallback(
    (partial: Partial<Character>) => {
      onUpdate({ ...character, ...partial })
    },
    [character, onUpdate],
  )

  const addClothes = useCallback(
    async (file: File, state: ClothesState) => {
      if (!userhash) {
        setErr('Add your Catbox userhash in the footer first.')
        return
      }
      setErr(null)
      setBusy(`clothes-${state}`)
      try {
        const { hosted, catboxAlbumShort } = await uploadFileToCharacterAlbum(character, file, userhash)
        patchCharacter({
          catboxAlbumShort,
          imageLibrary: {
            ...lib,
            clothes: [
              ...lib.clothes,
              {
                id: newId(),
                state,
                catboxUrl: hosted.catboxUrl,
                shortUrl: hosted.shortUrl,
                source: 'catbox',
                catboxFileName: hosted.fileName,
              },
            ],
          },
        })
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Upload failed')
      } finally {
        setBusy(null)
      }
    },
    [character, lib, patchCharacter, userhash],
  )

  const addClothesPaste = useCallback(
    async (state: ClothesState) => {
      const raw = pasteByState[state].trim()
      if (!raw) return
      setErr(null)
      setBusy(`paste-${state}`)
      try {
        const { catboxUrl, shortUrl } = await normalizePastedImageUrl(raw)
        patchCharacter({
          imageLibrary: {
            ...lib,
            clothes: [
              ...lib.clothes,
              { id: newId(), state, catboxUrl, shortUrl, source: 'manual' },
            ],
          },
        })
        setPasteByState((prev) => ({ ...prev, [state]: '' }))
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Invalid URL')
      } finally {
        setBusy(null)
      }
    },
    [lib, pasteByState, patchCharacter],
  )

  const removeClothes = useCallback(
    async (id: string) => {
      const row = lib.clothes.find((c) => c.id === id)
      if (row?.catboxFileName && userhash && character.catboxAlbumShort) {
        setBusy(`rm-${id}`)
        try {
          await removeCatboxFilesFromAlbum(userhash, character.catboxAlbumShort, [row.catboxFileName])
        } catch (e) {
          setErr(e instanceof Error ? e.message : 'Could not remove from Catbox album')
          setBusy(null)
          return
        }
        setBusy(null)
      }
      patchCharacter({
        imageLibrary: { ...lib, clothes: lib.clothes.filter((c) => c.id !== id) },
      })
    },
    [character.catboxAlbumShort, lib, patchCharacter, userhash],
  )

  const addAction = useCallback(async () => {
    const label = actionLabel.trim()
    const file = actionFileRef.current?.files?.[0]
    const paste = actionPasteUrl.trim()
    if (!label) {
      setErr('Enter an action label.')
      return
    }
    if (!file && !paste) {
      setErr('Choose an image file, or paste an image URL.')
      return
    }
    setErr(null)
    setBusy('action')
    try {
      if (file) {
        if (!userhash) {
          setErr('Add your Catbox userhash in the footer first.')
          return
        }
        const { hosted, catboxAlbumShort } = await uploadFileToCharacterAlbum(character, file, userhash)
        patchCharacter({
          catboxAlbumShort,
          imageLibrary: {
            ...lib,
            actions: [
              ...lib.actions,
              {
                id: newId(),
                label,
                catboxUrl: hosted.catboxUrl,
                shortUrl: hosted.shortUrl,
                source: 'catbox',
                catboxFileName: hosted.fileName,
              },
            ],
          },
        })
      } else {
        const { catboxUrl, shortUrl } = await normalizePastedImageUrl(paste)
        patchCharacter({
          imageLibrary: {
            ...lib,
            actions: [
              ...lib.actions,
              { id: newId(), label, catboxUrl, shortUrl, source: 'manual' },
            ],
          },
        })
      }
      setActionLabel('')
      setActionPasteUrl('')
      if (actionFileRef.current) actionFileRef.current.value = ''
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setBusy(null)
    }
  }, [actionLabel, actionPasteUrl, character, lib, patchCharacter, userhash])

  const removeAction = useCallback(
    async (id: string) => {
      const row = lib.actions.find((a) => a.id === id)
      if (row?.catboxFileName && userhash && character.catboxAlbumShort) {
        setBusy(`rma-${id}`)
        try {
          await removeCatboxFilesFromAlbum(userhash, character.catboxAlbumShort, [row.catboxFileName])
        } catch (e) {
          setErr(e instanceof Error ? e.message : 'Could not remove from Catbox album')
          setBusy(null)
          return
        }
        setBusy(null)
      }
      patchCharacter({
        imageLibrary: { ...lib, actions: lib.actions.filter((a) => a.id !== id) },
      })
    },
    [character.catboxAlbumShort, lib, patchCharacter, userhash],
  )

  const clothesPrompt = useMemo(() => buildClothesTrackerPrompt(lib), [lib])
  const actionPrompt = useMemo(() => buildActionTrackerPrompt(lib), [lib])

  const copyClothesFlash = useButtonFlash(2200)
  const copyActionsFlash = useButtonFlash(2200)

  const copyClothesPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(clothesPrompt)
      copyClothesFlash.trigger()
    } catch {
      setErr('Could not copy to clipboard.')
    }
  }, [clothesPrompt, copyClothesFlash])

  const copyActionsPrompt = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(actionPrompt)
      copyActionsFlash.trigger()
    } catch {
      setErr('Could not copy to clipboard.')
    }
  }, [actionPrompt, copyActionsFlash])

  function triggerClothes(state: ClothesState) {
    clothesRefs.current[state]?.click()
  }

  const albumUrl = character.catboxAlbumShort
    ? `https://catbox.moe/c/${character.catboxAlbumShort}`
    : null

  return (
    <div className="image-library">
      <div className="image-library-intro">
        <h3 className="panel-title">Image library</h3>
        <p className="panel-hint">
          File uploads go to your Catbox account and this character’s album. Pasting a URL keeps the link here but does
          not upload a file to Catbox.
        </p>
        {albumUrl && (
          <p className="panel-hint">
            Album:{' '}
            <a href={albumUrl} target="_blank" rel="noreferrer">
              {albumUrl}
            </a>
          </p>
        )}
        {!userhash && (
          <p className="gif-error" role="status">
            Set your Catbox userhash in the footer to enable uploads.
          </p>
        )}
      </div>

      {err && <p className="gif-error">{err}</p>}

      <div className="image-library-section">
        <h4 className="image-library-heading">Clothes (tracker lists)</h4>
        <p className="panel-hint">
          Add images for each wardrobe state. Generated prompts pick a random image from the matching list.
        </p>
        <div className="clothes-grid">
          {CLOTHES_STATES.map((state) => (
            <div key={state} className="clothes-column">
              <div className="clothes-column-head">
                <span>{state}</span>
                <input
                  ref={(el) => {
                    clothesRefs.current[state] = el
                  }}
                  type="file"
                  accept="image/*"
                  className="visually-hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) void addClothes(f, state)
                    e.target.value = ''
                  }}
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  disabled={busy !== null || !userhash}
                  onClick={() => triggerClothes(state)}
                >
                  {busy === `clothes-${state}` ? 'Uploading…' : 'Upload file'}
                </button>
              </div>
              <div className="clothes-paste">
                <input
                  className="field-input"
                  placeholder="Or paste image URL…"
                  value={pasteByState[state]}
                  onChange={(e) =>
                    setPasteByState((prev) => ({ ...prev, [state]: e.target.value }))
                  }
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-small"
                  disabled={busy !== null}
                  onClick={() => void addClothesPaste(state)}
                >
                  {busy === `paste-${state}` ? '…' : 'Add URL'}
                </button>
              </div>
              <ul className="image-entry-list">
                {lib.clothes
                  .filter((c) => c.state === state)
                  .map((c) => (
                    <li key={c.id} className="image-entry-row">
                      <span className="image-entry-source" title="Host">
                        {sourceBadge(c.source)}
                      </span>
                      <a href={c.shortUrl} target="_blank" rel="noreferrer" className="image-entry-link">
                        {c.shortUrl}
                      </a>
                      <button
                        type="button"
                        className="btn btn-danger-ghost btn-small"
                        disabled={busy !== null}
                        onClick={() => void removeClothes(c.id)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="image-library-section">
        <h4 className="image-library-heading">Actions (trigger words)</h4>
        <p className="panel-hint">One label and one image per action—upload a file or paste a URL.</p>
        <div className="action-add-form">
          <input
            className="field-input"
            placeholder="Action label (trigger)"
            value={actionLabel}
            onChange={(e) => setActionLabel(e.target.value)}
          />
          <input ref={actionFileRef} type="file" accept="image/*" className="field-input" />
          <input
            className="field-input"
            placeholder="Or paste image URL (instead of file)"
            value={actionPasteUrl}
            onChange={(e) => setActionPasteUrl(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-secondary"
            disabled={busy !== null}
            onClick={() => void addAction()}
          >
            {busy === 'action' ? 'Uploading…' : 'Add action'}
          </button>
        </div>
        <ul className="image-entry-list image-entry-list-wide">
          {lib.actions.map((a) => (
            <li key={a.id} className="image-entry-row">
              <span className="image-entry-label">{a.label}</span>
              <span className="image-entry-source">{sourceBadge(a.source)}</span>
              <a href={a.shortUrl} target="_blank" rel="noreferrer" className="image-entry-link">
                {a.shortUrl}
              </a>
              <button
                type="button"
                className="btn btn-danger-ghost btn-small"
                disabled={busy !== null}
                onClick={() => void removeAction(a.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="image-library-section tracker-export">
        <h4 className="image-library-heading">Crushon tracker exports</h4>
        <p className="panel-hint">Copy into your character or scenario. Uses the {'{{char}}'} placeholder.</p>
        <div className="tracker-blocks">
          <div className="tracker-block">
            <div className="tracker-block-head">
              <span>Clothes tracker + image lists</span>
              <button
                type="button"
                className={`btn btn-primary btn-small ${copyClothesFlash.successClass}`}
                onClick={() => void copyClothesPrompt()}
                aria-live="polite"
              >
                {copyClothesFlash.active ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <textarea className="tracker-textarea" readOnly value={clothesPrompt} rows={14} />
          </div>
          <div className="tracker-block">
            <div className="tracker-block-head">
              <span>Action tracker + mappings</span>
              <button
                type="button"
                className={`btn btn-primary btn-small ${copyActionsFlash.successClass}`}
                onClick={() => void copyActionsPrompt()}
                aria-live="polite"
              >
                {copyActionsFlash.active ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <textarea className="tracker-textarea" readOnly value={actionPrompt} rows={18} />
          </div>
        </div>
      </div>
    </div>
  )
}
