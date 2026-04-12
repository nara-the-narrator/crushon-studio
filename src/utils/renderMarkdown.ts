import DOMPurify from 'dompurify'
import { marked } from 'marked'

marked.setOptions({ gfm: true, breaks: true })

/** Renders Markdown to HTML and sanitizes for display (Crushon field previews). */
export function renderMarkdownToSafeHtml(src: string): string {
  const html = marked.parse(src ?? '', { async: false }) as string
  return DOMPurify.sanitize(html)
}
