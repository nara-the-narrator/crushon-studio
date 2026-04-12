import type { Character } from '../types/character'

const SCHEMA = 'https://nara-narrator.app/schemas/character-export/v1.json'

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function stripHtml(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const d = document.createElement('div')
  d.innerHTML = html
  return (d.textContent || d.innerText || '').replace(/\s+/g, ' ').trim()
}

function combinedDescriptionHtml(c: Character): string {
  const d = c.description
  const parts = [
    d.openingHtml,
    ...d.sections.map(
      (s) => `<div><strong>${escapeXml(s.title)}</strong></div>${s.html}`,
    ),
  ]
  return parts.join('\n')
}

/**
 * Plain text for Crushon “Introduction”: opening + every section (title + body), in order.
 * This is the only field sourced from Introduction studio for Tavern JSON `description`.
 */
export function combinedIntroductionPlain(character: Character): string {
  const d = character.description
  const chunks: string[] = []
  const open = stripHtml(d.openingHtml).trim()
  if (open) chunks.push(open)
  for (const s of d.sections) {
    const title = s.title.trim()
    const body = stripHtml(s.html).trim()
    if (!title && !body) continue
    if (title && body) chunks.push(`${title}\n\n${body}`)
    else chunks.push(title || body)
  }
  return chunks.join('\n\n').trim()
}

const EMPTY_GREETING = `*{{char}} greets you warmly.*

(Write your greeting in the Greeting tab — use {{user}} for the player’s name.)`

/**
 * Portable bundle for chat/roleplay platforms. `compat` maps common field names;
 * `extensions.nara` keeps a full round-trip snapshot for this app.
 */
export function buildUniversalCharacterExport(character: Character): Record<string, unknown> {
  const { description: desc, crushonCard: cc } = character

  const introductionPlain = combinedIntroductionPlain(character)
  const fullHtml = combinedDescriptionHtml(character)

  const personalityPlain = cc.personality.trim()
  const scenarioPlain = cc.scenario.trim()
  const greetingPlain = cc.greeting.trim()
  const appearancePlain = cc.appearance.trim()

  return {
    $schema: SCHEMA,
    format: 'universal-character-card',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    source: {
      app: 'Nara the Narrator',
      kind: 'character',
    },
    character: {
      id: character.id,
      name: character.name,
      tags: character.tags,
      avatar: character.avatarHosted
        ? {
            encoding: 'url',
            url: character.avatarHosted.catboxUrl,
            short_url: character.avatarHosted.shortUrl,
            file_name: character.avatarHosted.fileName,
          }
        : character.avatarDataUrl
          ? { encoding: 'data_url', data: character.avatarDataUrl }
          : null,
      hosted_gif: character.gifHosted
        ? {
            url: character.gifHosted.catboxUrl,
            short_url: character.gifHosted.shortUrl,
            file_name: character.gifHosted.fileName,
          }
        : null,
      description: {
        opening_html: desc.openingHtml,
        sections: desc.sections.map((s) => ({
          title: s.title,
          html: s.html,
        })),
        palette: desc.palette,
        full_document_html: fullHtml,
        full_plain_text: introductionPlain,
      },
      crushon_card: {
        personality: cc.personality,
        scenario: cc.scenario,
        greeting: cc.greeting,
        appearance: cc.appearance,
      },
      gif_constructor: character.gifConstructor,
      /** Same GIF as hosted_gif when you uploaded from the app; use for platforms that need a URL. */
      gif_url: character.gifHosted?.shortUrl ?? character.gifHosted?.catboxUrl ?? null,
      compat: {
        generic: {
          name: character.name,
          /** Crushon “Introduction” — entire Introduction studio output. */
          description: introductionPlain,
          personality: personalityPlain,
          scenario: scenarioPlain,
          first_message: greetingPlain,
          appearance: appearancePlain,
          tags: character.tags,
          avatar_url: character.avatarHosted?.shortUrl ?? character.avatarHosted?.catboxUrl ?? null,
          gif_url: character.gifHosted?.shortUrl ?? character.gifHosted?.catboxUrl ?? null,
        },
        crushon_ai: {
          char_name: character.name,
          char_introduction: introductionPlain,
          char_persona: personalityPlain,
          world_scenario: scenarioPlain,
          first_message: greetingPlain,
          appearance: appearancePlain,
          tags: character.tags,
          avatar_url: character.avatarHosted?.shortUrl ?? character.avatarHosted?.catboxUrl ?? null,
          gif_url: character.gifHosted?.shortUrl ?? character.gifHosted?.catboxUrl ?? null,
        },
        sillytavern: {
          name: character.name,
          description: introductionPlain,
          personality: personalityPlain,
          scenario: scenarioPlain,
          first_mes: greetingPlain,
          mes_example: '',
          appearance: appearancePlain,
        },
        chub_ai: {
          title: character.name,
          description: introductionPlain,
          personality: personalityPlain,
          scenario: scenarioPlain,
          first_message: greetingPlain,
          appearance: appearancePlain,
        },
      },
    },
    extensions: {
      nara: {
        character,
      },
    },
  }
}

export function stringifyUniversalExport(character: Character, pretty = true): string {
  const obj = buildUniversalCharacterExport(character)
  return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj)
}

/**
 * Flat JSON matching common **SillyTavern / character-card** imports (Crushon.ai “Create Character”
 * → upload PNG/JSON). `description` is **Introduction** only (Introduction studio). Personality,
 * scenario, greeting (`first_mes`), and appearance come from their dedicated tabs.
 */
export function buildCrushonTavernImportJson(character: Character): Record<string, unknown> {
  const cc = character.crushonCard
  const introductionPlain =
    combinedIntroductionPlain(character) || character.name.trim() || 'Character introduction'

  const personalityPlain = cc.personality.trim()
  const scenarioPlain = cc.scenario.trim()
  const greetingPlain = cc.greeting.trim() || EMPTY_GREETING
  const appearancePlain = cc.appearance.trim()

  const card: Record<string, unknown> = {
    name: character.name.trim().slice(0, 40) || 'Unnamed',
    description: introductionPlain.slice(0, 32000),
    personality: personalityPlain.slice(0, 32000),
    scenario: scenarioPlain.slice(0, 32000),
    first_mes: greetingPlain.slice(0, 32000),
    mes_example: '',
    creator_notes:
      'Exported from Nara the Narrator. `description` = Introduction studio; personality, scenario, first_mes, appearance = their tabs.',
    tags: character.tags.filter(Boolean).slice(0, 9),
  }

  if (appearancePlain) {
    card.appearance = appearancePlain.slice(0, 32000)
  }

  return card
}

export function stringifyCrushonTavernImport(character: Character, pretty = true): string {
  const obj = buildCrushonTavernImportJson(character)
  return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj)
}
