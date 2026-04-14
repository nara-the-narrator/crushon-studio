import { useRef, useState } from 'react'
import type { IntroductionSection } from '../types/character'
import {
  compileSectionBasicToHtml,
  htmlToBasicInput,
  markdownImageLine,
} from '../utils/descriptionBasicMarkup'
import { insertAtCursor } from '../utils/insertImageInHtml'
import { collapsibleDetailsSnippet } from '../utils/collapsibleHtmlSnippet'
import { sanitizeLimitedHtml } from '../utils/sanitizeLimitedHtml'

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
  const customRef = useRef<HTMLTextAreaElement>(null)
  const [collapsed, setCollapsed] = useState(false)
  const basic = htmlToBasicInput(section.html)
  const opacityPercent = Math.round((section.opacity ?? 0.9) * 100)
  const borderColor = section.borderColor ?? '#8f879e'
  const colorPickerValue = /^#(?:[0-9a-fA-F]{6})$/.test(borderColor) ? borderColor : '#8f879e'

  function applyBasic(next: string) {
    onChange({ ...section, html: compileSectionBasicToHtml(next) })
  }

  function applyCustomHtml(next: string) {
    onChange({ ...section, html: next })
  }

  function sanitizeCustomHtmlNow() {
    const clean = sanitizeLimitedHtml(section.html)
    if (clean !== section.html) onChange({ ...section, html: clean })
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
            className="btn btn-ghost btn-small"
            onClick={() => setCollapsed((v) => !v)}
            aria-expanded={!collapsed}
          >
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
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

      {!collapsed && (
        <>
          <div className="section-appearance-row">
            <label className="section-mode-field">
              <span>Content mode</span>
              <select
                className="field-input"
                value={section.contentMode ?? 'basic'}
                onChange={(e) =>
                  onChange({
                    ...section,
                    contentMode: e.target.value as IntroductionSection['contentMode'],
                  })
                }
              >
                <option value="basic">Basic markdown</option>
                <option value="customHtml">Custom HTML</option>
              </select>
            </label>
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
          {(section.contentMode ?? 'basic') === 'basic' ? (
            <>
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
            </>
          ) : (
            <>
              <p className="section-basic-hint panel-hint">
                Allowed tags: <code className="inline-code">p</code>, <code className="inline-code">strong</code>,{' '}
                <code className="inline-code">em</code>, <code className="inline-code">a</code>,{' '}
                <code className="inline-code">img</code>, <code className="inline-code">ul</code>,{' '}
                <code className="inline-code">ol</code>, <code className="inline-code">li</code>,{' '}
                <code className="inline-code">blockquote</code>, <code className="inline-code">pre</code>,{' '}
                <code className="inline-code">details</code>, <code className="inline-code">summary</code>,{' '}
                <code className="inline-code">table</code>, headings, and inline <code className="inline-code">style</code>
                . Use <strong>Insert collapsible</strong> for a native expand/collapse block in the exported intro.
              </p>
              <div className="section-custom-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => {
                    const ta = customRef.current
                    if (!ta) return
                    insertAtCursor(ta, collapsibleDetailsSnippet('Click to expand'), applyCustomHtml)
                  }}
                >
                  Insert collapsible
                </button>
              </div>
              <textarea
                ref={customRef}
                className="section-body-input"
                value={section.html}
                onChange={(e) => applyCustomHtml(e.target.value)}
                onBlur={sanitizeCustomHtmlNow}
                spellCheck={false}
                rows={10}
                placeholder="Write custom HTML…"
                aria-label="Section custom HTML"
              />
            </>
          )}
        </>
      )}
    </div>
  )
}
