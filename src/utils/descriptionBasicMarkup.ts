/**
 * Introduction studio “basic” markup: **bold**, *italic*, markdown images, compiled to HTML for preview/export.
 */
import type { ColorPalette } from '../types/character'
import { imageHtmlFromDataUrl } from './insertImageInHtml'

export function markdownImageLine(alt: string, imageUrl: string): string {
  const safeAlt = alt.replace(/[[\]]/g, '')
  return `![${safeAlt}](${imageUrl})`
}

function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function inlineBasicToHtml(line: string): string {
  let t = escapeHtmlText(line)
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  t = t.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  return t
}

function isImageMarkdown(line: string): { alt: string; url: string } | null {
  const m = line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/)
  if (!m) return null
  return { alt: m[1], url: m[2] }
}

function imageMarkdownToHtml(alt: string, url: string): string {
  const safeAlt = alt.replace(/"/g, '&quot;')
  if (url.startsWith('data:')) {
    return imageHtmlFromDataUrl(url, alt || 'Image').trim()
  }
  const wrap =
    'margin:1rem 0;border-radius:12px;overflow:hidden;border:1px solid rgba(143,135,158,0.3);box-sizing:border-box'
  const img = 'display:block;width:100%;height:auto;vertical-align:middle'
  return `<div style="${wrap}"><img src="${url.replace(/"/g, '&quot;')}" alt="${safeAlt}" style="${img}" /></div>`
}

export function compileSectionBasicToHtml(basic: string): string {
  const blocks = basic.split(/\n\s*\n/)
  const parts: string[] = []
  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed) continue
    const img = isImageMarkdown(trimmed)
    if (img) {
      parts.push(imageMarkdownToHtml(img.alt, img.url))
      continue
    }
    const inner = trimmed
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .join(' ')
    parts.push(`<p>${inlineBasicToHtml(inner)}</p>`)
  }
  return parts.join('\n')
}

export function compileOpeningBasicToHtml(basic: string, palette: ColorPalette): string {
  const blocks = basic.split(/\n\s*\n/)
  const pStyle = [
    'font-family:Georgia,serif',
    'font-size:1.35rem',
    'line-height:1.45',
    'margin:0',
    `color:${palette.text}`,
  ].join(';')
  const out: string[] = []
  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed) continue
    const img = isImageMarkdown(trimmed)
    if (img) {
      out.push(imageMarkdownToHtml(img.alt, img.url))
      continue
    }
    const inner = trimmed
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .join(' ')
    out.push(`<p style="${pStyle}">${inlineBasicToHtml(inner)}</p>`)
  }
  return out.join('\n')
}

function serializeChildren(el: Element): string {
  let s = ''
  for (const node of el.childNodes) {
    s += serializeNode(node)
  }
  return s
}

function serializeNode(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent ?? ''
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return ''
  const e = node as Element
  const tag = e.tagName.toLowerCase()
  if (tag === 'strong' || tag === 'b') {
    return `**${serializeChildren(e)}**`
  }
  if (tag === 'em' || tag === 'i') {
    return `*${serializeChildren(e)}*`
  }
  if (tag === 'br') {
    return '\n'
  }
  if (tag === 'span' || tag === 'a') {
    return serializeChildren(e)
  }
  return serializeChildren(e)
}

export function htmlToBasicInput(html: string): string {
  if (!html.trim()) return ''
  if (typeof DOMParser === 'undefined') return html

  const wrapped = `<div id="root">${html}</div>`
  const doc = new DOMParser().parseFromString(wrapped, 'text/html')
  const root = doc.getElementById('root')
  if (!root) return html

  const chunks: string[] = []

  for (const child of Array.from(root.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const t = (child.textContent ?? '').trim()
      if (t) chunks.push(t)
      continue
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue
    const el = child as Element
    const tag = el.tagName.toLowerCase()

    if (tag === 'p') {
      chunks.push(serializeChildren(el))
      continue
    }

    if (tag === 'div') {
      const img = el.querySelector('img')
      if (img) {
        const src = img.getAttribute('src') ?? ''
        const alt = img.getAttribute('alt') ?? ''
        chunks.push(`![${alt}](${src})`)
        continue
      }
      chunks.push(serializeChildren(el))
      continue
    }
  }

  return chunks.filter(Boolean).join('\n\n')
}
