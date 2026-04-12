/** Insert an HTML img snippet at caret in a textarea. */
export function insertAtCursor(
  el: HTMLTextAreaElement,
  text: string,
  onChange: (value: string) => void,
): void {
  const start = el.selectionStart
  const end = el.selectionEnd
  const v = el.value
  const next = v.slice(0, start) + text + v.slice(end)
  onChange(next)
  requestAnimationFrame(() => {
    el.focus()
    const pos = start + text.length
    el.setSelectionRange(pos, pos)
  })
}

export function imageHtmlFromDataUrl(dataUrl: string, alt: string): string {
  const safeAlt = alt.replace(/"/g, '&quot;')
  const wrap =
    'margin:1rem 0;border-radius:12px;overflow:hidden;border:1px solid rgba(143,135,158,0.3);box-sizing:border-box'
  const img = 'display:block;width:100%;height:auto;vertical-align:middle'
  return `\n<div style="${wrap}"><img src="${dataUrl}" alt="${safeAlt}" style="${img}" /></div>\n`
}
