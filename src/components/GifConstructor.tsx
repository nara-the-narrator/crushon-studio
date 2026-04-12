import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { resolveCatboxUserhash } from '../api/catboxClient'
import { removeCatboxFilesFromAlbum, uploadFileToCharacterAlbum } from '../api/characterCatboxUpload'
import { useCatboxSettings } from '../context/CatboxSettingsContext'
import type { Character, GifConstructorState, GifFrameEntry, GifTransitionStyle } from '../types/character'
import { useButtonFlash } from '../hooks/useButtonFlash'
import { newId } from '../utils/id'
import { downloadGifBytes, encodeGifFromState } from '../utils/buildGif'

const TRANSITIONS: { value: GifTransitionStyle; label: string }[] = [
  { value: 'cut', label: 'Cut (instant)' },
  { value: 'fade', label: 'Fade' },
  { value: 'slide', label: 'Slide' },
]

export function GifConstructor({
  character,
  onUpdate,
}: {
  character: Character
  onUpdate: (c: Character) => void
}) {
  const g = character.gifConstructor
  const { userhash: storedHash } = useCatboxSettings()
  const userhash = resolveCatboxUserhash(storedHash)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const previewBlobRef = useRef<string | null>(null)
  const previewTitleId = useId()
  const saveFlash = useButtonFlash(2200)
  const uploadFlash = useButtonFlash(2200)

  function patch(next: Partial<GifConstructorState>) {
    onUpdate({
      ...character,
      gifConstructor: { ...character.gifConstructor, ...next },
    })
  }

  function patchFrame(id: string, part: Partial<GifFrameEntry>) {
    patch({
      frames: g.frames.map((f) => (f.id === id ? { ...f, ...part } : f)),
    })
  }

  function removeFrame(id: string) {
    patch({ frames: g.frames.filter((f) => f.id !== id) })
  }

  function moveFrame(index: number, dir: -1 | 1) {
    const j = index + dir
    if (j < 0 || j >= g.frames.length) return
    const next = [...g.frames]
    ;[next[index], next[j]] = [next[j], next[index]]
    patch({ frames: next })
  }

  const addFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length) return
      const pending: Promise<GifFrameEntry>[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        if (!file.type.startsWith('image/')) continue
        pending.push(
          new Promise((resolve, reject) => {
            const r = new FileReader()
            r.onload = () =>
              resolve({
                id: newId(),
                dataUrl: r.result as string,
                durationMs: 2000,
              })
            r.onerror = () => reject(new Error('read failed'))
            r.readAsDataURL(file)
          }),
        )
      }
      void Promise.all(pending).then((entries) => {
        if (!entries.length) return
        onUpdate({
          ...character,
          gifConstructor: {
            ...character.gifConstructor,
            frames: [...character.gifConstructor.frames, ...entries],
          },
        })
      })
    },
    [character, onUpdate],
  )

  const closePreview = useCallback(() => {
    if (previewBlobRef.current) {
      URL.revokeObjectURL(previewBlobRef.current)
      previewBlobRef.current = null
    }
    setPreviewUrl(null)
  }, [])

  useEffect(() => {
    return () => {
      if (previewBlobRef.current) {
        URL.revokeObjectURL(previewBlobRef.current)
        previewBlobRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (!previewUrl) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closePreview()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [previewUrl, closePreview])

  const runPreview = useCallback(async () => {
    setErr(null)
    setStatus(null)
    setBusy(true)
    try {
      const bytes = await encodeGifFromState(character.gifConstructor, (p) => {
        setStatus(`Preview — ${p.phase} ${p.current}/${p.total}`)
      })
      const blob = new Blob([new Uint8Array(bytes)], { type: 'image/gif' })
      const url = URL.createObjectURL(blob)
      if (previewBlobRef.current) URL.revokeObjectURL(previewBlobRef.current)
      previewBlobRef.current = url
      setPreviewUrl(url)
      setStatus(null)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not build preview.')
    } finally {
      setBusy(false)
    }
  }, [character.gifConstructor])

  const uploadToCatbox = useCallback(async () => {
    if (!userhash) {
      setErr('Add your Catbox userhash in the footer first.')
      return
    }
    if (g.frames.length === 0) {
      setErr('Add frames before uploading.')
      return
    }
    setErr(null)
    setStatus(null)
    setBusy(true)
    try {
      const bytes = await encodeGifFromState(character.gifConstructor, (p) => {
        setStatus(`Upload — ${p.phase} ${p.current}/${p.total}`)
      })
      const safeBase =
        character.name.replace(/[^\w-]+/g, '_').slice(0, 50) || 'animation'
      const file = new File([new Uint8Array(bytes)], `${safeBase}.gif`, { type: 'image/gif' })
      const prevGif = character.gifHosted?.fileName
      const prevAlbum = character.catboxAlbumShort
      const { hosted, catboxAlbumShort } = await uploadFileToCharacterAlbum(character, file, userhash)
      if (prevGif && prevAlbum) {
        try {
          await removeCatboxFilesFromAlbum(userhash, prevAlbum, [prevGif])
        } catch {
          void 0 // ignore remove failure
        }
      }
      onUpdate({
        ...character,
        gifHosted: hosted,
        catboxAlbumShort,
      })
      uploadFlash.trigger()
      setStatus('GIF uploaded — link saved on this character.')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Upload failed.')
    } finally {
      setBusy(false)
    }
  }, [character, g.frames.length, onUpdate, uploadFlash, userhash])

  const clearHostedGif = useCallback(() => {
    void (async () => {
      const fn = character.gifHosted?.fileName
      if (!fn || !userhash || !character.catboxAlbumShort) {
        onUpdate({ ...character, gifHosted: null })
        return
      }
      setBusy(true)
      try {
        await removeCatboxFilesFromAlbum(userhash, character.catboxAlbumShort, [fn])
        onUpdate({ ...character, gifHosted: null })
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Could not remove from album.')
      } finally {
        setBusy(false)
      }
    })()
  }, [character, onUpdate, userhash])

  const build = useCallback(async () => {
    setErr(null)
    setStatus(null)
    setBusy(true)
    try {
      const bytes = await encodeGifFromState(character.gifConstructor, (p) => {
        setStatus(`${p.phase} ${p.current}/${p.total}`)
      })
      const safe = character.name.replace(/[^\w-]+/g, '_').slice(0, 60) || 'animation'
      downloadGifBytes(bytes, `${safe}.gif`)
      saveFlash.trigger()
      setStatus('GIF saved — check your downloads folder.')
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not build GIF.')
    } finally {
      setBusy(false)
    }
  }, [character.gifConstructor, character.name, saveFlash])

  const previewModal =
    previewUrl &&
    createPortal(
      <div
        className="dialog-root gif-preview-root"
        role="presentation"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) closePreview()
        }}
      >
        <div
          className="dialog-panel gif-preview-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby={previewTitleId}
        >
          <h2 id={previewTitleId} className="dialog-title">
            GIF preview
          </h2>
          <p className="panel-hint gif-preview-hint">
            Same file you get when saving. Close to adjust timings or transitions, then save.
          </p>
          <div className="gif-preview-frame">
            <img src={previewUrl} alt="Animated GIF preview" className="gif-preview-img" />
          </div>
          <div className="dialog-actions gif-preview-actions">
            <button type="button" className="btn btn-secondary" onClick={closePreview}>
              Close
            </button>
            <button
              type="button"
              className={`btn btn-primary ${saveFlash.successClass}`}
              onClick={() => {
                closePreview()
                void build()
              }}
              disabled={busy}
              aria-busy={busy}
              aria-live="polite"
            >
              {saveFlash.active ? 'Saved!' : 'Save to disk…'}
            </button>
          </div>
        </div>
      </div>,
      document.body,
    )

  return (
    <div className="gif-constructor">
      <div className="gif-constructor-intro">
        <h3 className="panel-title">GIF constructor</h3>
        <p className="panel-hint">
          Stack images in order, set how long each stays visible, then tune transitions. Built in your browser and
          downloaded as a GIF file.
        </p>
      </div>

      <div className="gif-toolbar">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="visually-hidden"
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <button type="button" className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>
          Add images
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={runPreview}
          disabled={busy || g.frames.length === 0}
          aria-busy={busy && Boolean(status?.startsWith('Preview'))}
        >
          {busy && status?.startsWith('Preview') ? 'Building preview…' : 'Preview'}
        </button>
        <button
          type="button"
          className={`btn btn-primary ${saveFlash.successClass}`}
          onClick={build}
          disabled={busy || g.frames.length === 0}
          aria-busy={busy && !status?.startsWith('Preview') && !status?.startsWith('Upload')}
          aria-live="polite"
        >
          {saveFlash.active
            ? 'Saved!'
            : busy && status && !status.startsWith('Preview') && !status.startsWith('Upload')
              ? 'Building…'
              : 'Build & save GIF locally'}
        </button>
        <button
          type="button"
          className={`btn btn-secondary ${uploadFlash.successClass}`}
          onClick={() => void uploadToCatbox()}
          disabled={busy || g.frames.length === 0 || !userhash}
          title={!userhash ? 'Set Catbox userhash in the footer' : 'Encode and upload to your Catbox album'}
          aria-busy={busy && Boolean(status?.startsWith('Upload'))}
          aria-live="polite"
        >
          {uploadFlash.active
            ? 'Uploaded!'
            : busy && status?.startsWith('Upload')
              ? 'Uploading…'
              : 'Upload GIF to Catbox'}
        </button>
      </div>

      {!userhash && (
        <p className="panel-hint">Set your Catbox userhash in the footer to upload the GIF to your album.</p>
      )}

      {character.gifHosted && (
        <div className="gif-hosted-block">
          <p className="panel-hint">
            Hosted GIF:{' '}
            <a href={character.gifHosted.shortUrl} target="_blank" rel="noreferrer">
              {character.gifHosted.shortUrl}
            </a>
          </p>
          <button type="button" className="btn btn-ghost btn-small" onClick={clearHostedGif} disabled={busy}>
            Remove hosted link
          </button>
        </div>
      )}

      {previewModal}

      {status && <p className="gif-status">{status}</p>}
      {err && <p className="gif-error">{err}</p>}

      <div className="gif-settings-grid">
        <label className="field">
          <span className="field-label">Transition style</span>
          <select
            className="field-input"
            value={g.transitionStyle}
            onChange={(e) => patch({ transitionStyle: e.target.value as GifTransitionStyle })}
          >
            {TRANSITIONS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span className="field-label">Transition duration (ms)</span>
          <input
            type="number"
            className="field-input"
            min={80}
            max={8000}
            step={10}
            value={g.transitionDurationMs}
            disabled={g.transitionStyle === 'cut'}
            onChange={(e) => patch({ transitionDurationMs: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          <span className="field-label">Transition smoothness (FPS)</span>
          <input
            type="number"
            className="field-input"
            min={6}
            max={40}
            step={1}
            value={g.transitionFps}
            disabled={g.transitionStyle === 'cut'}
            onChange={(e) => patch({ transitionFps: Number(e.target.value) || 20 })}
          />
        </label>
        <label className="field">
          <span className="field-label">Output width (px)</span>
          <input
            type="number"
            className="field-input"
            min={64}
            max={1024}
            step={1}
            value={g.outputWidth}
            onChange={(e) => patch({ outputWidth: Number(e.target.value) || 400 })}
          />
        </label>
        <label className="field">
          <span className="field-label">Output height (px)</span>
          <input
            type="number"
            className="field-input"
            min={64}
            max={1024}
            step={1}
            value={g.outputHeight}
            onChange={(e) => patch({ outputHeight: Number(e.target.value) || 400 })}
          />
        </label>
        <label className="field field-checkbox">
          <input
            type="checkbox"
            checked={g.loop}
            onChange={(e) => patch({ loop: e.target.checked })}
          />
          <span>Loop animation</span>
        </label>
        <label className="field field-checkbox">
          <input
            type="checkbox"
            checked={g.loopClosingTransition}
            disabled={!g.loop || g.frames.length < 2 || g.transitionStyle === 'cut'}
            onChange={(e) => patch({ loopClosingTransition: e.target.checked })}
          />
          <span>Animate last → first when looping</span>
        </label>
      </div>

      <div className="gif-frames">
        <h4 className="gif-frames-title">Slides ({g.frames.length})</h4>
        {g.frames.length === 0 ? (
          <p className="panel-hint">No images yet — use “Add images” to begin.</p>
        ) : (
          <ul className="gif-frame-list">
            {g.frames.map((f, index) => (
              <li key={f.id} className="gif-frame-row">
                <div className="gif-frame-thumb-wrap">
                  {f.dataUrl ? (
                    <img src={f.dataUrl} alt="" className="gif-frame-thumb" />
                  ) : (
                    <div className="gif-frame-thumb-missing" title="Image was dropped to fit storage">
                      No image data
                    </div>
                  )}
                </div>
                <div className="gif-frame-fields">
                  <label className="field-inline">
                    <span className="field-label">Display time (ms)</span>
                    <input
                      type="number"
                      className="field-input"
                      min={100}
                      max={60000}
                      step={50}
                      value={f.durationMs}
                      onChange={(e) =>
                        patchFrame(f.id, { durationMs: Number(e.target.value) || 1000 })
                      }
                    />
                  </label>
                  <div className="gif-frame-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      disabled={index === 0}
                      onClick={() => moveFrame(index, -1)}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      disabled={index >= g.frames.length - 1}
                      onClick={() => moveFrame(index, 1)}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button type="button" className="btn btn-danger-ghost" onClick={() => removeFrame(f.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
