import DOMPurify from 'dompurify'

const ALLOWED_TAGS = [
  'b',
  'i',
  'strong',
  'em',
  'u',
  's',
  'br',
  'p',
  'blockquote',
  'ul',
  'ol',
  'li',
  'img',
  'figure',
  'figcaption',
  'a',
  'table',
  'thead',
  'tbody',
  'tr',
  'td',
  'th',
  'div',
  'span',
  'pre',
  'hr',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'details',
  'summary',
] as const

const ALLOWED_ATTR = [
  'href',
  'target',
  'rel',
  'src',
  'alt',
  'style',
  'colspan',
  'rowspan',
  'open',
] as const

export function sanitizeLimitedHtml(html: string): string {
  return DOMPurify.sanitize(html ?? '', {
    ALLOWED_TAGS: [...ALLOWED_TAGS],
    ALLOWED_ATTR: [...ALLOWED_ATTR],
    ALLOW_DATA_ATTR: false,
  })
}
