import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CharacterCard } from '../components/CharacterCard'
import { useCharacters } from '../hooks/useCharacters'
import { PRESET_TAGS } from '../constants/tags'

export function HomePage() {
  const navigate = useNavigate()
  const { characters, createCharacter, storageReady } = useCharacters()
  const [query, setQuery] = useState('')
  const [activeTags, setActiveTags] = useState<string[]>([])

  const allTags = useMemo(() => {
    const set = new Set<string>(PRESET_TAGS as unknown as string[])
    characters.forEach((c) => c.tags.forEach((t) => set.add(t)))
    return [...set].sort((a, b) => a.localeCompare(b))
  }, [characters])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return characters.filter((c) => {
      if (activeTags.length) {
        const hit = activeTags.some((t) => c.tags.includes(t))
        if (!hit) return false
      }
      if (!q) return true
      if (c.name.toLowerCase().includes(q)) return true
      if (c.tags.some((t) => t.toLowerCase().includes(q))) return true
      return false
    })
  }, [characters, query, activeTags])

  function toggleFilterTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    )
  }

  function onNew() {
    const c = createCharacter()
    navigate(`/character/${c.id}`)
  }

  if (!storageReady) {
    return (
      <div className="page home-page storage-loading">
        <p className="storage-loading-text">Loading your library…</p>
      </div>
    )
  }

  return (
    <div className="page home-page">
      <header className="home-hero">
        <p className="brand-kicker">Crushon Studio</p>
        <h1 className="home-title">Your characters</h1>
        <p className="home-sub">
          Introductions, card fields, palette, GIFs, and image library in one place—ready when you export. Data stays
          in your browser.
        </p>
        <div className="home-actions">
          <button type="button" className="btn btn-primary" onClick={onNew}>
            New character
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/template')}>
            Edit template
          </button>
        </div>
      </header>

      <section className="home-controls">
        <div className="search-row">
          <label className="search-field">
            <span className="visually-hidden">Search</span>
            <input
              className="field-input search-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or tag…"
              aria-label="Search characters"
            />
          </label>
          {activeTags.length > 0 && (
            <button type="button" className="btn btn-ghost" onClick={() => setActiveTags([])}>
              Clear filters
            </button>
          )}
        </div>
        <div className="filter-tags">
          <span className="filter-label">Filter by tag:</span>
          <div className="tag-chips wrap">
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`tag-chip ${activeTags.includes(tag) ? 'active' : ''}`}
                onClick={() => toggleFilterTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No characters match. Try another search or add a new character.</p>
          <button type="button" className="btn btn-secondary" onClick={onNew}>
            Create one
          </button>
        </div>
      ) : (
        <div className="character-grid">
          {filtered.map((c) => (
            <CharacterCard key={c.id} character={c} />
          ))}
        </div>
      )}
    </div>
  )
}
