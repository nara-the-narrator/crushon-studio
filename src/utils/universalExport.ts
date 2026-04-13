/**
 * Universal JSON bundle (round-trip) and flat Tavern-shaped JSON for Crushon.ai import.
 * Tavern naming: `description` = Personality tab text; `personality` = Introduction studio HTML.
 */
import type { Character } from '../types/character'
import { buildIntroductionStudioFragment } from './exportHtml'

const SCHEMA = 'https://github.com/nara-the-narrator/crushon-studio#character-export-v1'

const MAX_CARD_FIELD = 32000

const PH = {
  tavernMainFromPersonalityTab:
    '(No personality text — add content in the Personality tab.)',
  scenario: '(No scenario — add content in the Scenario tab.)',
  greeting: '(No greeting — add content in the Greeting tab.)',
  appearance: '(No appearance — add content in the Appearance tab.)',
} as const

function nonEmptyField(value: string, placeholder: string): string {
  const t = value.trim()
  return t || placeholder
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Plain text from HTML (browser or regex fallback). */
export function stripHtml(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const d = document.createElement('div')
  d.innerHTML = html
  return (d.textContent || d.innerText || '').replace(/\s+/g, ' ').trim()
}

/** Opening + sections as plain text (no HTML tags). */
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

function introductionStudioHtml(character: Character): string {
  return buildIntroductionStudioFragment(character.description)
}

/** Full app export including `extensions.crushonStudio.character` snapshot. */
export function buildUniversalCharacterExport(character: Character): Record<string, unknown> {
  const { description: desc, crushonCard: cc } = character

  const introductionPlain = combinedIntroductionPlain(character)
  const introductionHtml = introductionStudioHtml(character)

  const personalityPlain = cc.personality.trim()
  const scenarioPlain = cc.scenario.trim()
  const greetingPlain = cc.greeting.trim()
  const appearancePlain = cc.appearance.trim()

  const tavernDescriptionField = personalityPlain
  const tavernPersonalityField = introductionHtml

  return {
    $schema: SCHEMA,
    format: 'universal-character-card',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    source: {
      app: 'Crushon Studio',
      kind: 'character',
    },
    character: {
      id: character.id,
      name: character.name,
      age: character.age,
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
          opacity: s.opacity,
          show_border: s.showBorder,
          border_color: s.borderColor,
        })),
        palette: desc.palette,
        full_document_html: introductionHtml,
        full_plain_text: introductionPlain,
      },
      crushon_card: {
        personality: cc.personality,
        scenario: cc.scenario,
        greeting: cc.greeting,
        appearance: cc.appearance,
      },
      gif_constructor: character.gifConstructor,
      gif_url: character.gifHosted?.shortUrl ?? character.gifHosted?.catboxUrl ?? null,
      compat: {
        generic: {
          name: character.name,
          age: character.age,
          description: introductionHtml,
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
          age: character.age,
          char_introduction: introductionHtml,
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
          age: character.age,
          description: tavernDescriptionField,
          personality: tavernPersonalityField,
          scenario: scenarioPlain,
          first_mes: greetingPlain,
          mes_example: '',
          appearance: appearancePlain,
        },
        chub_ai: {
          title: character.name,
          age: character.age,
          description: tavernDescriptionField,
          personality: tavernPersonalityField,
          scenario: scenarioPlain,
          first_message: greetingPlain,
          appearance: appearancePlain,
        },
      },
    },
    extensions: {
      crushonStudio: {
        character,
      },
    },
  }
}

export function stringifyUniversalExport(character: Character, pretty = true): string {
  const obj = buildUniversalCharacterExport(character)
  return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj)
}

/** Flat card for Crushon / SillyTavern import (placeholders for empty tabs). */
export function buildCrushonTavernImportJson(character: Character): Record<string, unknown> {
  const cc = character.crushonCard
  let introductionHtml = introductionStudioHtml(character).trim()
  if (!introductionHtml) {
    introductionHtml = `<p>${escapeXml(character.name.trim() || 'Character')}</p>`
  }
  if (introductionHtml.length > MAX_CARD_FIELD) {
    introductionHtml = introductionHtml.slice(0, MAX_CARD_FIELD)
  }

  const personalityTab = cc.personality.trim()
  const scenarioTab = cc.scenario.trim()
  const greetingTab = cc.greeting.trim()
  const appearanceTab = cc.appearance.trim()

  const tavernDescription = nonEmptyField(personalityTab, PH.tavernMainFromPersonalityTab).slice(0, MAX_CARD_FIELD)
  const tavernPersonality = introductionHtml
  const scenarioOut = nonEmptyField(scenarioTab, PH.scenario).slice(0, MAX_CARD_FIELD)
  const firstMesOut = nonEmptyField(greetingTab, PH.greeting).slice(0, MAX_CARD_FIELD)
  const appearanceOut = nonEmptyField(appearanceTab, PH.appearance).slice(0, MAX_CARD_FIELD)

  const card: Record<string, unknown> = {
    name: character.name.trim().slice(0, 40) || 'Unnamed',
    age: character.age,
    description: tavernDescription,
    personality: tavernPersonality,
    scenario: scenarioOut,
    first_mes: firstMesOut,
    mes_example: '',
    creator_notes: 'Made with Crushon Studio.',
    tags: character.tags.filter(Boolean).slice(0, 9),
    appearance: appearanceOut,
  }

  return card
}

export function stringifyCrushonTavernImport(character: Character, pretty = true): string {
  const obj = buildCrushonTavernImportJson(character)
  return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj)
}
