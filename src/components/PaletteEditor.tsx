import type { ColorPalette } from '../types/character'

/** Hex inputs for introduction preview + export CSS variables. */
const LABELS: { key: keyof ColorPalette; label: string }[] = [
  { key: 'primary', label: 'Primary' },
  { key: 'secondary', label: 'Secondary' },
  { key: 'accent', label: 'Accent' },
  { key: 'surface', label: 'Surface' },
  { key: 'surfaceElevated', label: 'Elevated' },
  { key: 'text', label: 'Text' },
  { key: 'muted', label: 'Muted' },
]

export function PaletteEditor({
  palette,
  onChange,
}: {
  palette: ColorPalette
  onChange: (p: ColorPalette) => void
}) {
  return (
    <div className="palette-editor">
      <h3 className="panel-title">Color palette</h3>
      <p className="panel-hint">These colors drive the live preview and the exported page.</p>
      <div className="palette-grid">
        {LABELS.map(({ key, label }) => (
          <label key={key} className="palette-field">
            <span>{label}</span>
            <span className="palette-swatch-wrap">
              <input
                type="color"
                value={palette[key]}
                onChange={(e) => onChange({ ...palette, [key]: e.target.value })}
                aria-label={label}
              />
              <input
                type="text"
                className="palette-hex"
                value={palette[key]}
                onChange={(e) => onChange({ ...palette, [key]: e.target.value })}
                spellCheck={false}
              />
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}
