import { useRef } from 'react'
import { useButtonFlash } from '../hooks/useButtonFlash'
import { createEmptyIntroductionStudio } from '../constants/defaults'
import type { Character, IntroductionSection } from '../types/character'
import { newId } from '../utils/id'
import {
  compileOpeningBasicToHtml,
  htmlToBasicInput,
  markdownImageLine,
} from '../utils/descriptionBasicMarkup'
import { insertAtCursor } from '../utils/insertImageInHtml'
import { CopyExportButton } from './CopyExportButton'
import { LivePreview } from './LivePreview'
import { PaletteEditor } from './PaletteEditor'
import { SectionBlock } from './SectionBlock'

export function IntroductionStudio({
  character,
  onUpdate,
}: {
  character: Character
  onUpdate: (c: Character) => void
}) {
  const openingRef = useRef<HTMLTextAreaElement>(null)
  const resetFlash = useButtonFlash(2000)
  const addSectionFlash = useButtonFlash(1800)
  const desc = character.description

  const openingBasic = htmlToBasicInput(desc.openingHtml)

  function patchDescription(patch: Partial<typeof desc>) {
    onUpdate({
      ...character,
      description: { ...desc, ...patch },
    })
  }

  function setOpeningFromBasic(next: string) {
    patchDescription({ openingHtml: compileOpeningBasicToHtml(next, desc.palette) })
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
      if (!file || !openingRef.current) return
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        const line = markdownImageLine(file.name || 'Image', dataUrl)
        const ta = openingRef.current
        if (!ta) return
        insertAtCursor(ta, `\n\n${line}\n\n`, (v) => setOpeningFromBasic(v))
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const previewCharacter: Character = {
    ...character,
    description: desc,
  }

  return (
    <div className="studio-layout">
      <div className="studio-editor">
        <h3 className="panel-title introduction-studio-heading">Introduction studio</h3>
        <div className="studio-toolbar">
          <CopyExportButton character={previewCharacter} />
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
              openingHtml: compileOpeningBasicToHtml(openingBasic, p),
            })
          }
        />

        <div className="opening-block">
          <h3 className="panel-title">Opening</h3>
          <p className="panel-hint">
            Text before your sections—hook, mood, or dedication. Use <strong>**bold**</strong>,{' '}
            <em>*italic*</em>, and blank lines between paragraphs. The preview uses your palette.
          </p>
          <div className="opening-actions">
            <button type="button" className="btn btn-insert-image" onClick={insertOpeningImage}>
              Add image
            </button>
          </div>
          <p className="section-basic-hint panel-hint">Add image inserts a picture line for you.</p>
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
