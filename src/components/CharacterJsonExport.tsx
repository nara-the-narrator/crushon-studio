import { useCallback } from 'react'
import type { Character } from '../types/character'
import { useButtonFlash } from '../hooks/useButtonFlash'
import { stringifyCrushonTavernImport, stringifyUniversalExport } from '../utils/universalExport'

export function CharacterJsonExport({ character }: { character: Character }) {
  const naraCopy = useButtonFlash(2200)
  const naraDl = useButtonFlash(2200)
  const crushCopy = useButtonFlash(2200)
  const crushDl = useButtonFlash(2200)

  const buildNaraJson = useCallback(() => stringifyUniversalExport(character, true), [character])

  const buildCrushonJson = useCallback(() => stringifyCrushonTavernImport(character, true), [character])

  const copyNara = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildNaraJson())
      naraCopy.trigger()
    } catch {
      /* ignore */
    }
  }, [buildNaraJson, naraCopy])

  const downloadNara = useCallback(() => {
    const json = buildNaraJson()
    const safe = character.name.replace(/[^\w-]+/g, '_').slice(0, 80) || 'character'
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${safe}-nara-character.json`
    a.click()
    URL.revokeObjectURL(url)
    naraDl.trigger()
  }, [buildNaraJson, character.name, naraDl])

  const copyCrushon = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildCrushonJson())
      crushCopy.trigger()
    } catch {
      /* ignore */
    }
  }, [buildCrushonJson, crushCopy])

  const downloadCrushon = useCallback(() => {
    const json = buildCrushonJson()
    const safe = character.name.replace(/[^\w-]+/g, '_').slice(0, 80) || 'character'
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${safe}-crushon-tavern.json`
    a.click()
    URL.revokeObjectURL(url)
    crushDl.trigger()
  }, [buildCrushonJson, character.name, crushDl])

  return (
    <div className="json-export">
      <div className="json-export-head">
        <h3 className="panel-title">JSON export</h3>
        <p className="panel-hint">
          <strong>Crushon.ai</strong> imports a <em>flat</em> Tavern-style JSON. Here,{' '}
          <code className="inline-code">description</code> is your <strong>Introduction studio</strong> content only
          (opening + sections as plain text). <code className="inline-code">personality</code>,{' '}
          <code className="inline-code">scenario</code>, <code className="inline-code">first_mes</code>, and{' '}
          <code className="inline-code">appearance</code> come from the <strong>Personality</strong>,{' '}
          <strong>Scenario</strong>, <strong>Greeting</strong>, and <strong>Appearance</strong> tabs. Use the
          Crushon row below on <strong>Create Character → Character Photo &amp; File</strong>. The Nara row is the
          full snapshot under <code className="inline-code">extensions.nara</code>.
        </p>
      </div>

      <div className="json-export-grid">
        <div className="json-export-block">
          <h4 className="json-export-block-title">Nara (full round-trip)</h4>
          <p className="panel-hint json-export-block-hint">
            Universal bundle + <code className="inline-code">extensions.nara</code> for this app only.
          </p>
          <div className="json-export-actions">
            <button
              type="button"
              className={`btn btn-secondary ${naraCopy.successClass}`}
              onClick={copyNara}
              aria-live="polite"
            >
              {naraCopy.active ? 'Copied!' : 'Copy'}
            </button>
            <button
              type="button"
              className={`btn btn-primary ${naraDl.successClass}`}
              onClick={downloadNara}
              aria-live="polite"
            >
              {naraDl.active ? 'Download started' : 'Download .json'}
            </button>
          </div>
        </div>

        <div className="json-export-block json-export-block-crushon">
          <h4 className="json-export-block-title">Crushon.ai / SillyTavern</h4>
          <p className="panel-hint json-export-block-hint">
            Tavern-style card: Introduction studio → <code className="inline-code">description</code>; other keys →
            Personality / Scenario / Greeting / Appearance tabs.
          </p>
          <div className="json-export-actions">
            <button
              type="button"
              className={`btn btn-secondary ${crushCopy.successClass}`}
              onClick={copyCrushon}
              aria-live="polite"
            >
              {crushCopy.active ? 'Copied!' : 'Copy'}
            </button>
            <button
              type="button"
              className={`btn btn-primary ${crushDl.successClass}`}
              onClick={downloadCrushon}
              aria-live="polite"
            >
              {crushDl.active ? 'Download started' : 'Download .json'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
