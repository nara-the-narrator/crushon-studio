import { useCallback } from 'react'
import type { Character } from '../types/character'
import { useButtonFlash } from '../hooks/useButtonFlash'
import { buildExportBundle } from '../utils/exportHtml'

export function CopyExportButton({ character }: { character: Character }) {
  const { active, trigger, successClass } = useButtonFlash(2200)

  const copy = useCallback(async () => {
    const html = buildExportBundle(character)
    try {
      await navigator.clipboard.writeText(html)
      trigger()
    } catch {
      void 0
    }
  }, [character, trigger])

  return (
    <button
      type="button"
      className={`btn btn-primary ${successClass}`}
      onClick={copy}
      aria-live="polite"
    >
      {active ? 'Copied to clipboard' : 'Copy HTML (for Crushon)'}
    </button>
  )
}
