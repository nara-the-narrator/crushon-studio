import { useMemo } from 'react'
import type { Character } from '../types/character'
import { buildPreviewDocument } from '../utils/exportHtml'

export function LivePreview({ character }: { character: Character }) {
  const srcDoc = useMemo(() => buildPreviewDocument(character), [character])

  return (
    <div className="live-preview">
      <div className="live-preview-label">Live preview</div>
      <iframe
        title="Introduction preview"
        className="live-preview-frame"
        sandbox="allow-same-origin"
        srcDoc={srcDoc}
      />
    </div>
  )
}
