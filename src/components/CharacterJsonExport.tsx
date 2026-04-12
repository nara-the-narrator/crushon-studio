import { useCallback } from 'react'
import type { Character } from '../types/character'
import { useButtonFlash } from '../hooks/useButtonFlash'
import { stringifyCrushonTavernImport, stringifyUniversalExport } from '../utils/universalExport'

export function CharacterJsonExport({ character }: { character: Character }) {
  const bundleCopy = useButtonFlash(2200)
  const bundleDl = useButtonFlash(2200)
  const crushCopy = useButtonFlash(2200)
  const crushDl = useButtonFlash(2200)

  const buildBundleJson = useCallback(() => stringifyUniversalExport(character, true), [character])

  const buildCrushonJson = useCallback(() => stringifyCrushonTavernImport(character, true), [character])

  const copyBundle = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildBundleJson())
      bundleCopy.trigger()
    } catch {
      void 0
    }
  }, [buildBundleJson, bundleCopy])

  const downloadBundle = useCallback(() => {
    const json = buildBundleJson()
    const safe = character.name.replace(/[^\w-]+/g, '_').slice(0, 80) || 'character'
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${safe}-crushon-studio-character.json`
    a.click()
    URL.revokeObjectURL(url)
    bundleDl.trigger()
  }, [buildBundleJson, character.name, bundleDl])

  const copyCrushon = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(buildCrushonJson())
      crushCopy.trigger()
    } catch {
      void 0
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
          Use the full backup to reopen a character in this app. Use the Crushon/SillyTavern file to import on Crushon
          (Create Character → Character Photo &amp; File) or in compatible apps.
        </p>
      </div>

      <div className="json-export-grid">
        <div className="json-export-block">
          <h4 className="json-export-block-title">Crushon Studio (full round-trip)</h4>
          <p className="panel-hint json-export-block-hint">Everything needed to restore this character here later.</p>
          <div className="json-export-actions">
            <button
              type="button"
              className={`btn btn-secondary ${bundleCopy.successClass}`}
              onClick={copyBundle}
              aria-live="polite"
            >
              {bundleCopy.active ? 'Copied!' : 'Copy'}
            </button>
            <button
              type="button"
              className={`btn btn-primary ${bundleDl.successClass}`}
              onClick={downloadBundle}
              aria-live="polite"
            >
              {bundleDl.active ? 'Download started' : 'Download .json'}
            </button>
          </div>
        </div>

        <div className="json-export-block json-export-block-crushon">
          <h4 className="json-export-block-title">Crushon.ai / SillyTavern</h4>
          <p className="panel-hint json-export-block-hint">For importing on Crushon or SillyTavern.</p>
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
