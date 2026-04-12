import { useMemo } from 'react'
import type { Character } from '../types/character'
import { renderMarkdownToSafeHtml } from '../utils/renderMarkdown'

function avatarSrc(c: Character): string | null {
  return c.avatarHosted?.catboxUrl ?? c.avatarDataUrl ?? null
}

export function GreetingChatPreview({ text, character }: { text: string; character: Character }) {
  const html = useMemo(() => renderMarkdownToSafeHtml(text), [text])
  const empty = !text.trim()
  const label = character.name.trim() || 'Character'
  const src = avatarSrc(character)

  return (
    <div className="greeting-chat-preview">
      <div className="greeting-chat-preview-label">Preview</div>
      <div className="greeting-chat-window" role="region" aria-label="Greeting message preview">
        <div className="greeting-chat-bubble-row">
          <div className="greeting-chat-avatar" title={label}>
            {src ? (
              <img src={src} alt="" className="greeting-chat-avatar-img" />
            ) : (
              <span className="greeting-chat-avatar-fallback" aria-hidden>
                {label.slice(0, 1).toUpperCase()}
              </span>
            )}
          </div>
          <div className="greeting-chat-bubble-column">
            <span className="greeting-chat-sender">{label}</span>
            <div className="greeting-chat-bubble">
              {empty ? (
                <p className="greeting-chat-empty">No message yet — write a greeting on the left.</p>
              ) : (
                <div className="greeting-chat-body" dangerouslySetInnerHTML={{ __html: html }} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
