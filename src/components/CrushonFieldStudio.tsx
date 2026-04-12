import type { Character, CrushonCardFields } from '../types/character'
import { GreetingChatPreview } from './GreetingChatPreview'

const FIELD_META: Record<
  keyof CrushonCardFields,
  { label: string; crushonLabel: string; hint: string; rows: number }
> = {
  personality: {
    label: 'Personality',
    crushonLabel: 'Personality',
    hint: 'Detailed traits and voice — Crushon long-term memory. Tavern JSON stores this under the key description (not personality).',
    rows: 10,
  },
  scenario: {
    label: 'Scenario',
    crushonLabel: 'Scenario',
    hint: 'World, situation, or default scene.',
    rows: 8,
  },
  greeting: {
    label: 'Greeting',
    crushonLabel: 'Greeting (first message)',
    hint: 'The first line the character sends. Short-term memory on Crushon; use {{char}} and {{user}} if you like.',
    rows: 6,
  },
  appearance: {
    label: 'Appearance',
    crushonLabel: 'Appearance',
    hint: 'Physical traits for the card.',
    rows: 6,
  },
}

export function CrushonFieldStudio({
  field,
  character,
  onUpdate,
}: {
  field: keyof CrushonCardFields
  character: Character
  onUpdate: (c: Character) => void
}) {
  const cc = character.crushonCard
  const meta = FIELD_META[field]
  const isGreeting = field === 'greeting'

  function patchCard(patch: Partial<typeof cc>) {
    onUpdate({
      ...character,
      crushonCard: { ...cc, ...patch },
    })
  }

  return (
    <div
      className={`studio-layout crushon-card-studio ${isGreeting ? 'crushon-card-studio--split' : ''}`}
    >
      <div className="studio-editor crushon-card-editor">
        <h3 className="panel-title crushon-field-page-title">{meta.label}</h3>
        <p className="panel-hint crushon-card-lead">
          {isGreeting ? (
            <>
              Optional <strong>Markdown</strong> — preview shows as an incoming chat message. Maps to Crushon’s{' '}
              <strong>{meta.crushonLabel}</strong> and Tavern JSON <code className="inline-code">first_mes</code>.
              This content is <strong>not</strong> mixed into Introduction studio.
            </>
          ) : (
            <>
              Maps to Crushon’s <strong>{meta.crushonLabel}</strong> field and to Tavern JSON{' '}
              {field === 'personality' ? (
                <code className="inline-code">description</code>
              ) : (
                <code className="inline-code">{field}</code>
              )}
              . This content is <strong>not</strong> mixed into Introduction studio.
            </>
          )}
        </p>

        <div className="crushon-field-block">
          <label className="crushon-field-label" htmlFor={`crushon-${character.id}-${field}`}>
            {meta.label}
            <span className="crushon-field-crushon"> → Crushon: {meta.crushonLabel}</span>
          </label>
          <p className="panel-hint crushon-field-hint">{meta.hint}</p>
          <textarea
            id={`crushon-${character.id}-${field}`}
            className="section-body-input crushon-field-textarea"
            rows={meta.rows}
            spellCheck={true}
            value={cc[field]}
            onChange={(e) => patchCard({ [field]: e.target.value })}
            aria-label={`${meta.label} for Crushon ${meta.crushonLabel}`}
          />
        </div>
      </div>

      {isGreeting && <GreetingChatPreview text={cc.greeting} character={character} />}
    </div>
  )
}
