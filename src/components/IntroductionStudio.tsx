import { useRef, useState } from 'react'
import { restyleIntroductionWithAi } from '../api/introductionStyleAi'
import { useButtonFlash } from '../hooks/useButtonFlash'
import { createEmptyIntroductionStudio } from '../constants/defaults'
import type { Character, IntroductionSection } from '../types/character'
import { newId } from '../utils/id'
import {
  compileOpeningBasicToHtml,
  htmlToBasicInput,
  markdownImageLine,
} from '../utils/descriptionBasicMarkup'
import { collapsibleDetailsSnippet } from '../utils/collapsibleHtmlSnippet'
import { imageHtmlFromDataUrl, insertAtCursor } from '../utils/insertImageInHtml'
import { sanitizeLimitedHtml } from '../utils/sanitizeLimitedHtml'
import { useCatboxSettings } from '../context/CatboxSettingsContext'
import { CopyExportButton } from './CopyExportButton'
import { LivePreview } from './LivePreview'
import { PaletteEditor } from './PaletteEditor'
import { SectionBlock } from './SectionBlock'

export function IntroductionStudio({
  character,
  onUpdate,
  title = 'Introduction studio',
  showExportControls = true,
}: {
  character: Character
  onUpdate: (c: Character) => void
  title?: string
  showExportControls?: boolean
}) {
  const openingRef = useRef<HTMLTextAreaElement>(null)
  const openingCustomRef = useRef<HTMLTextAreaElement>(null)
  const resetFlash = useButtonFlash(2000)
  const addSectionFlash = useButtonFlash(1800)
  const applyStyleFlash = useButtonFlash(1800)
  const { styleApiKey } = useCatboxSettings()
  const desc = character.description
  const [stylePromptInput, setStylePromptInput] = useState('')
  const [styleBusy, setStyleBusy] = useState(false)
  const [styleError, setStyleError] = useState<string | null>(null)

  const openingIsBasic = (desc.openingContentMode ?? 'basic') === 'basic'
  const openingBasic = openingIsBasic ? htmlToBasicInput(desc.openingHtml) : ''

  function patchDescription(patch: Partial<typeof desc>) {
    onUpdate({
      ...character,
      description: { ...desc, ...patch },
    })
  }

  function setOpeningFromBasic(next: string) {
    patchDescription({ openingHtml: compileOpeningBasicToHtml(next, desc.palette) })
  }

  function setOpeningCustomHtml(next: string) {
    patchDescription({ openingHtml: next })
  }

  function sanitizeOpeningCustomNow() {
    const clean = sanitizeLimitedHtml(desc.openingHtml)
    if (clean !== desc.openingHtml) patchDescription({ openingHtml: clean })
  }

  function setSections(sections: IntroductionSection[]) {
    patchDescription({ sections })
  }

  function updateSection(i: number, s: IntroductionSection) {
    const next = [...desc.sections]
    next[i] = s
    setSections(next)
  }

  function removeSection(i: number) {
    setSections(desc.sections.filter((_, j) => j !== i))
  }

  function moveSection(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= desc.sections.length) return
    const next = [...desc.sections]
    ;[next[i], next[j]] = [next[j], next[i]]
    setSections(next)
  }

  function addSection() {
    setSections([
      ...desc.sections,
      {
        id: newId(),
        title: 'New section',
        html: '<p></p>',
        contentMode: 'basic',
        opacity: 0.9,
        showBorder: true,
        borderColor: desc.palette.muted,
      },
    ])
    addSectionFlash.trigger()
  }

  function resetTemplate() {
    if (
      !window.confirm(
        'Replace opening text and all sections with the default template? Your palette is kept.',
      )
    )
      return
    const fresh = createEmptyIntroductionStudio()
    patchDescription({
      openingHtml: fresh.openingHtml,
      openingContentMode: fresh.openingContentMode,
      sections: fresh.sections,
    })
    resetFlash.trigger()
  }

  async function insertOpeningImage() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        if (openingIsBasic) {
          const ta = openingRef.current
          if (!ta) return
          const line = markdownImageLine(file.name || 'Image', dataUrl)
          insertAtCursor(ta, `\n\n${line}\n\n`, (v) => setOpeningFromBasic(v))
        } else {
          const ta = openingCustomRef.current
          if (!ta) return
          const html = imageHtmlFromDataUrl(dataUrl, file.name || 'Image')
          insertAtCursor(ta, html, (v) => setOpeningCustomHtml(v))
        }
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  async function applyStylePromptToWholeIntroduction() {
    if (!styleApiKey.trim()) return
    setStyleBusy(true)
    setStyleError(null)
    try {
      const styled = await restyleIntroductionWithAi({
        apiKey: styleApiKey,
        styleRequest: stylePromptInput,
        sections: desc.sections.map((s) => ({
          title: s.title,
          opacity: s.opacity ?? 0.9,
          showBorder: s.showBorder ?? true,
          borderColor: s.borderColor ?? desc.palette.muted,
        })),
        palette: desc.palette,
      })
      const nextSections = desc.sections.map((s, i) => ({
        ...s,
        opacity: styled.sections[i].opacity ?? s.opacity,
        showBorder: styled.sections[i].showBorder ?? s.showBorder,
        borderColor: styled.sections[i].borderColor ?? s.borderColor,
      }))
      const changed =
        JSON.stringify(styled.palette) !== JSON.stringify(desc.palette) ||
        nextSections.some((s, i) => {
          const prev = desc.sections[i]
          return (
            (s.opacity ?? 0.9) !== (prev.opacity ?? 0.9) ||
            (s.showBorder ?? true) !== (prev.showBorder ?? true) ||
            (s.borderColor ?? '').toLowerCase() !== (prev.borderColor ?? '').toLowerCase()
          )
        })
      if (!changed) {
        throw new Error(
          'No visible style change was produced. Try a more explicit visual prompt (palette mood, contrast, border style, transparency).',
        )
      }

      patchDescription({
        palette: styled.palette,
        sections: nextSections,
      })
      applyStyleFlash.trigger()
    } catch (error) {
      setStyleError(error instanceof Error ? error.message : 'Could not apply style prompt.')
    } finally {
      setStyleBusy(false)
    }
  }

  const previewCharacter: Character = {
    ...character,
    description: desc,
  }

  return (
    <div className="studio-layout">
      <div className="studio-editor">
        <h3 className="panel-title introduction-studio-heading">{title}</h3>
        <div className="studio-toolbar">
          {showExportControls && <CopyExportButton character={previewCharacter} />}
          <button
            type="button"
            className={`btn btn-secondary ${resetFlash.successClass}`}
            onClick={resetTemplate}
            aria-live="polite"
          >
            {resetFlash.active ? 'Reset done' : 'Reset to default template'}
          </button>
        </div>

        <PaletteEditor
          palette={desc.palette}
          onChange={(p) =>
            patchDescription({
              palette: p,
              openingHtml: openingIsBasic
                ? compileOpeningBasicToHtml(openingBasic, p)
                : desc.openingHtml,
            })
          }
        />

        <div className="intro-style-ai-block">
          <h3 className="panel-title">AI style prompt (whole introduction)</h3>
          <p className="panel-hint intro-style-ai-hint">
            Style-only mode: updates palette + section visual settings without rewriting your opening/section text.
          </p>
          <textarea
            className="section-body-input intro-style-ai-input"
            rows={3}
            value={stylePromptInput}
            onChange={(e) => setStylePromptInput(e.target.value)}
            placeholder="Example: romantic baroque style with elegant typography, subtle cards, and rich but readable contrast."
            aria-label="Whole introduction style prompt"
            disabled={!styleApiKey.trim() || styleBusy}
          />
          <div className="intro-style-ai-actions">
            <button
              type="button"
              className={`btn btn-secondary ${applyStyleFlash.successClass}`}
              onClick={() => void applyStylePromptToWholeIntroduction()}
              disabled={!styleApiKey.trim() || styleBusy}
              aria-live="polite"
            >
              {styleBusy ? 'Applying…' : applyStyleFlash.active ? 'Style applied' : 'Apply style to whole introduction'}
            </button>
          </div>
          {!styleApiKey.trim() && (
            <p className="panel-hint intro-style-ai-disabled-note">
              Add your Style AI API key in Settings (next to Catbox userhash) to enable this feature.
            </p>
          )}
          {styleError && <p className="gif-error intro-style-ai-error">{styleError}</p>}
        </div>

        <div className="opening-block">
          <h3 className="panel-title">Opening</h3>
          <div className="opening-mode-row">
            <label className="opening-mode-field">
              <span>Opening content</span>
              <select
                className="field-input"
                value={desc.openingContentMode ?? 'basic'}
                onChange={(e) => {
                  const mode = e.target.value as 'basic' | 'customHtml'
                  const prev = desc.openingContentMode ?? 'basic'
                  if (mode === prev) return
                  if (mode === 'customHtml') {
                    patchDescription({
                      openingContentMode: mode,
                      openingHtml: desc.openingHtml,
                    })
                  } else {
                    patchDescription({
                      openingContentMode: mode,
                      openingHtml: compileOpeningBasicToHtml(htmlToBasicInput(desc.openingHtml), desc.palette),
                    })
                  }
                }}
              >
                <option value="basic">Basic markdown</option>
                <option value="customHtml">Custom HTML</option>
              </select>
            </label>
          </div>
          {openingIsBasic ? (
            <p className="panel-hint">
              Text before your sections—hook, mood, or dedication. Use <strong>**bold**</strong>,{' '}
              <em>*italic*</em>, and blank lines between paragraphs. The preview uses your palette.
            </p>
          ) : (
            <p className="panel-hint">
              Same allowed tags as custom sections (including <code className="inline-code">details</code> /{' '}
              <code className="inline-code">summary</code> for collapsible blocks). Inline{' '}
              <code className="inline-code">style</code> is kept for export.
            </p>
          )}
          <div className="opening-actions">
            <button type="button" className="btn btn-insert-image" onClick={insertOpeningImage}>
              Add image
            </button>
            {!openingIsBasic && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  const ta = openingCustomRef.current
                  if (!ta) return
                  insertAtCursor(ta, collapsibleDetailsSnippet('Click to expand'), (v) =>
                    setOpeningCustomHtml(v),
                  )
                }}
              >
                Insert collapsible
              </button>
            )}
          </div>
          <p className="section-basic-hint panel-hint">
            {openingIsBasic
              ? 'Add image inserts a markdown picture line for you.'
              : 'Add image inserts an HTML image block. Use Insert collapsible for expand/collapse in the intro.'}
          </p>
          {openingIsBasic ? (
            <textarea
              ref={openingRef}
              className="section-body-input opening-textarea"
              value={openingBasic}
              onChange={(e) => setOpeningFromBasic(e.target.value)}
              rows={6}
              spellCheck={true}
              placeholder="Write your opening…"
              aria-label="Opening text"
            />
          ) : (
            <textarea
              ref={openingCustomRef}
              className="section-body-input opening-textarea"
              value={desc.openingHtml}
              onChange={(e) => setOpeningCustomHtml(e.target.value)}
              onBlur={sanitizeOpeningCustomNow}
              rows={8}
              spellCheck={false}
              placeholder="Opening HTML…"
              aria-label="Opening custom HTML"
            />
          )}
        </div>

        <div className="sections-head">
          <h3 className="panel-title">Sections</h3>
          <button
            type="button"
            className={`btn btn-secondary ${addSectionFlash.successClass}`}
            onClick={addSection}
            aria-live="polite"
          >
            {addSectionFlash.active ? 'Section added' : 'Add section'}
          </button>
        </div>
        <p className="panel-hint sections-intro-hint">
          Sections are added to your introduction in order. Personality, scenario, greeting, and appearance are edited
          on their own tabs.
        </p>
        {desc.sections.map((s, i) => (
          <SectionBlock
            key={s.id}
            section={s}
            index={i}
            total={desc.sections.length}
            onChange={(sec) => updateSection(i, sec)}
            onRemove={() => removeSection(i)}
            onMove={(dir) => moveSection(i, dir)}
          />
        ))}
      </div>

      <LivePreview character={previewCharacter} />
    </div>
  )
}
