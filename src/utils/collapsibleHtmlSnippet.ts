function escapeHtmlText(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Inline-styled &lt;details&gt; block for introduction export (no external CSS). */
export function collapsibleDetailsSnippet(summaryLabel = 'More'): string {
  const label = escapeHtmlText(summaryLabel)
  return `\n<details style="margin:1rem 0;border:1px solid rgba(143,135,158,0.35);border-radius:12px;padding:0.35rem 0.75rem;box-sizing:border-box;background:rgba(0,0,0,0.12)">
<summary style="cursor:pointer;font-weight:600;outline:none">${label}</summary>
<div style="margin-top:0.65rem;padding-top:0.65rem;border-top:1px solid rgba(143,135,158,0.25)">
<p>…</p>
</div>
</details>\n`
}
