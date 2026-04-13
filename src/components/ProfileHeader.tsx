import { useMemo, useRef, useState } from 'react'
import { resolveCatboxUserhash } from '../api/catboxClient'
import { removeCatboxFilesFromAlbum, uploadFileToCharacterAlbum } from '../api/characterCatboxUpload'
import { useCatboxSettings } from '../context/CatboxSettingsContext'
import type { Character } from '../types/character'
import { PRESET_TAGS } from '../constants/tags'

const PRESET_SET = new Set<string>(PRESET_TAGS as unknown as string[])

export function ProfileHeader({
  character,
  onChange,
}: {
  character: Character
  onChange: (c: Character) => void
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const { userhash: storedHash } = useCatboxSettings()
  const userhash = resolveCatboxUserhash(storedHash)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function onPickAvatar() {
    fileRef.current?.click()
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!userhash) {
      setErr('Add your Catbox userhash in the footer to upload a profile image.')
      e.target.value = ''
      return
    }
    setErr(null)
    const reader = new FileReader()
    reader.onload = () => {
      void (async () => {
        const dataUrl = reader.result as string
        setBusy(true)
        try {
          const prevFile = character.avatarHosted?.fileName
          const prevAlbum = character.catboxAlbumShort
          const { hosted, catboxAlbumShort } = await uploadFileToCharacterAlbum(character, file, userhash)
          if (prevFile && prevAlbum) {
            try {
              await removeCatboxFilesFromAlbum(userhash, prevAlbum, [prevFile])
            } catch {
              void 0 // old file may already be gone
            }
          }
          onChange({
            ...character,
            avatarDataUrl: dataUrl,
            avatarHosted: hosted,
            catboxAlbumShort,
          })
        } catch (ex) {
          setErr(ex instanceof Error ? ex.message : 'Upload failed')
        } finally {
          setBusy(false)
        }
      })()
    }
    reader.onerror = () => setErr('Could not read the image file.')
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function clearAvatar() {
    void (async () => {
      const fn = character.avatarHosted?.fileName
      if (fn && userhash && character.catboxAlbumShort) {
        setBusy(true)
        try {
          await removeCatboxFilesFromAlbum(userhash, character.catboxAlbumShort, [fn])
        } catch (e) {
          setErr(e instanceof Error ? e.message : 'Could not remove from Catbox album')
          setBusy(false)
          return
        }
        setBusy(false)
      }
      setErr(null)
      onChange({ ...character, avatarDataUrl: null, avatarHosted: null })
    })()
  }

  function toggleTag(tag: string) {
    const has = character.tags.includes(tag)
    const tags = has ? character.tags.filter((t) => t !== tag) : [...character.tags, tag]
    onChange({ ...character, tags })
  }

  function addCustomTag(raw: string) {
    const t = raw.trim().toLowerCase()
    if (!t || character.tags.includes(t)) return
    onChange({ ...character, tags: [...character.tags, t] })
  }

  const extraTags = useMemo(
    () => character.tags.filter((t) => !PRESET_SET.has(t)),
    [character.tags],
  )

  const avatarSrc = character.avatarHosted?.catboxUrl ?? character.avatarDataUrl

  return (
    <div className="profile-header">
      <div className="profile-avatar-col">
        <button
          type="button"
          className="profile-avatar-btn"
          onClick={onPickAvatar}
          disabled={busy}
          title="Change profile image (uploads to your Catbox album)"
        >
          {avatarSrc ? (
            <img src={avatarSrc} alt="" className="profile-avatar-img" />
          ) : (
            <span className="profile-avatar-placeholder">Add image</span>
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="visually-hidden"
          onChange={onFile}
          aria-hidden
        />
        <div className="profile-avatar-actions">
          <button type="button" className="btn btn-ghost btn-small" onClick={onPickAvatar} disabled={busy}>
            {busy ? 'Uploading…' : 'Upload'}
          </button>
          {(character.avatarDataUrl || character.avatarHosted) && (
            <button type="button" className="btn btn-ghost btn-small" onClick={clearAvatar} disabled={busy}>
              Remove
            </button>
          )}
        </div>
        {character.avatarHosted && (
          <p className="panel-hint profile-avatar-hosted">
            Hosted:{' '}
            <a href={character.avatarHosted.shortUrl} target="_blank" rel="noreferrer">
              {character.avatarHosted.shortUrl}
            </a>
          </p>
        )}
        {err && <p className="gif-error profile-avatar-error">{err}</p>}
        {!userhash && (
          <p className="panel-hint profile-avatar-error">Set your Catbox userhash in the footer to upload.</p>
        )}
      </div>
      <div className="profile-fields">
        <label className="field">
          <span className="field-label">Character name</span>
          <input
            className="field-input"
            value={character.name}
            onChange={(e) => onChange({ ...character, name: e.target.value })}
            placeholder="Name"
            autoComplete="off"
          />
        </label>
        <label className="field">
          <span className="field-label">Age</span>
          <input
            className="field-input"
            value={character.age}
            onChange={(e) => onChange({ ...character, age: e.target.value })}
            placeholder="Age"
            inputMode="numeric"
            autoComplete="off"
          />
        </label>
        <div className="tags-block">
          <span className="field-label">Tags</span>
          <div className="tag-chips">
            {PRESET_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`tag-chip ${character.tags.includes(tag) ? 'active' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
            {extraTags.map((tag) => (
              <button
                key={`custom:${tag}`}
                type="button"
                className="tag-chip active"
                onClick={() => toggleTag(tag)}
                title="Click to remove"
              >
                {tag}
              </button>
            ))}
          </div>
          <form
            className="custom-tag-form"
            onSubmit={(e) => {
              e.preventDefault()
              const fd = new FormData(e.currentTarget)
              addCustomTag(String(fd.get('customTag') ?? ''))
              e.currentTarget.reset()
            }}
          >
            <input name="customTag" className="field-input" placeholder="Add custom tag…" />
            <button type="submit" className="btn btn-secondary">
              Add
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
