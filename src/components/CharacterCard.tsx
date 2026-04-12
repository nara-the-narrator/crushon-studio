import { Link } from 'react-router-dom'
import type { Character } from '../types/character'

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(ts))
}

export function CharacterCard({ character }: { character: Character }) {
  return (
    <Link to={`/character/${character.id}`} className="character-card">
      <div className="character-card-visual">
        {character.avatarHosted?.catboxUrl || character.avatarDataUrl ? (
          <img
            src={character.avatarHosted?.catboxUrl ?? character.avatarDataUrl!}
            alt=""
            className="character-card-img"
          />
        ) : (
          <div className="character-card-placeholder" aria-hidden />
        )}
        <div className="character-card-gradient" />
        <div className="character-card-overlay">
          <h2 className="character-card-name">{character.name || 'Unnamed'}</h2>
          <div className="character-card-tags">
            {character.tags.slice(0, 3).map((t) => (
              <span key={t} className="character-card-tag">
                {t}
              </span>
            ))}
            {character.tags.length > 3 && (
              <span className="character-card-tag more">+{character.tags.length - 3}</span>
            )}
          </div>
        </div>
      </div>
      <div className="character-card-meta">
        <span>Updated {formatDate(character.updatedAt)}</span>
      </div>
    </Link>
  )
}
