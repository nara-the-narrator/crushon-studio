import { useEffect, useRef, useState } from 'react'
import type { IntroductionSection } from '../types/character'
import {
  compileSectionBasicToHtml,
  htmlToBasicInput,
  markdownImageLine,
} from '../utils/descriptionBasicMarkup'
import { insertAtCursor } from '../utils/insertImageInHtml'

export function SectionBlock({
  section,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  section: IntroductionSection
  index: number
  total: number
  onChange: (s: IntroductionSection) => void
  onRemove: () => void
  onMove: (dir: -1 | 1) => void
}) {
  const taRef = useRef<HTMLTextAreaElement>(null)
  const [basic, setBasic] = useState(() => htmlToBasicInput(section.html))

  useEffect(() => {
    setBasic(htmlToBasicInput(section.html))
  }, [section.html])

  function applyBasic(next: string) {
    setBasic(next)
    onChange({ ...section, html: compileSectionBasicToHtml(next) })
  }

  async function pickImage() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file || !taRef.current) return
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        const line = markdownImageLine(file.name || 'Image', dataUrl)
        const ta = taRef.current
        if (!ta) return
        insertAtCursor(ta, `\n\n${line}\n\n`, (v) => applyBasic(v))
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  return (
    <div className="section-block">
      <div className="section-block-head">
        <input
          className="section-title-input"
          value={section.title}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
          placeholder="Section title"
          aria-label="Section title"
        />
        <div className="section-block-actions">
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            title="Move up"
          >
            ↑
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-icon"
            disabled={index >= total - 1}
            onClick={() => onMove(1)}
            title="Move down"
          >
            ↓
          </button>
          <button type="button" className="btn btn-insert-image" onClick={pickImage}>
            Add image
          </button>
          <button type="button" className="btn btn-danger-ghost" onClick={onRemove}>
            Remove
          </button>
        </div>
      </div>

      <p className="section-basic-hint panel-hint">
        Blank line between paragraphs. Bold: <code className="inline-code">**like this**</code>. Italic:{' '}
        <code className="inline-code">*like this*</code>. Add image inserts the image line for you.
      </p>
      <textarea
        ref={taRef}
        className="section-body-input"
        value={basic}
        onChange={(e) => applyBasic(e.target.value)}
        spellCheck={true}
        rows={8}
        placeholder="Write here… Separate paragraphs with a blank line."
        aria-label="Section body"
      />
    </div>
  )
}
