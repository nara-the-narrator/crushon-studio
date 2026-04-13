import { useRef } from 'react'
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
  const basic = htmlToBasicInput(section.html)
  const opacityPercent = Math.round((section.opacity ?? 0.9) * 100)
  const borderColor = section.borderColor ?? '#8f879e'
  const colorPickerValue = /^#(?:[0-9a-fA-F]{6})$/.test(borderColor) ? borderColor : '#8f879e'

  function applyBasic(next: string) {
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
      <div className="section-appearance-row">
        <label className="section-opacity-field">
          <span>Opacity ({opacityPercent}%)</span>
          <div className="section-opacity-controls">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={opacityPercent}
              onChange={(e) =>
                onChange({
                  ...section,
                  opacity: Number(e.target.value) / 100,
                })
              }
              aria-label="Section opacity"
            />
            <input
              type="number"
              className="section-opacity-input"
              min={0}
              max={100}
              step={1}
              value={opacityPercent}
              onChange={(e) => {
                const nextPercent = Number(e.target.value)
                if (!Number.isFinite(nextPercent)) return
                const clamped = Math.max(0, Math.min(100, nextPercent))
                onChange({
                  ...section,
                  opacity: clamped / 100,
                })
              }}
              aria-label="Section opacity percent"
            />
          </div>
        </label>
        <label className="section-border-toggle">
          <input
            type="checkbox"
            checked={section.showBorder ?? true}
            onChange={(e) => onChange({ ...section, showBorder: e.target.checked })}
          />
          <span>Show border</span>
        </label>
      </div>
      <label className="section-border-color-field">
        <span>Border color</span>
        <span className="palette-swatch-wrap">
          <input
            type="color"
            value={colorPickerValue}
            onChange={(e) => onChange({ ...section, borderColor: e.target.value })}
            aria-label="Section border color"
          />
          <input
            type="text"
            className="palette-hex"
            value={borderColor}
            onChange={(e) => onChange({ ...section, borderColor: e.target.value })}
            spellCheck={false}
          />
        </span>
      </label>
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
