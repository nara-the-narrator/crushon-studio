import type { Character, IntroductionStudioContent } from '../types/character'

/** Hex #rgb or #rrggbb → rgba() for borders/overlays (no &lt;style&gt; tag). */
function hexToRgba(hex: string, alpha: number): string {
  const raw = hex.replace('#', '').trim()
  if (raw.length !== 3 && raw.length !== 6) return `rgba(0,0,0,${alpha})`
  const expand = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw
  const n = Number.parseInt(expand, 16)
  if (Number.isNaN(n)) return `rgba(0,0,0,${alpha})`
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r},${g},${b},${alpha})`
}

/**
 * Crushon-safe fragment: only common allowed tags (div, p, span, img, …) with inline styles.
 * No &lt;style&gt;, &lt;link&gt;, &lt;main&gt;, &lt;section&gt;, &lt;h1&gt;–&lt;h6&gt;, or class-based layout.
 */
export function buildIntroductionStudioFragment(feature: IntroductionStudioContent): string {
  const p = feature.palette

  const rootStyle = [
    'max-width:42rem',
    'margin:0 auto',
    'padding:2.5rem 1.25rem 4rem',
    'box-sizing:border-box',
    'font-family:system-ui,Segoe UI,sans-serif',
    'font-size:16px',
    'line-height:1.65',
    `color:${p.text}`,
    `background:radial-gradient(120% 80% at 50% 0%, ${p.secondary} 0%, ${p.surface} 55%)`,
    'min-height:100vh',
  ].join(';')

  const openingStyle = [
    'margin-bottom:2rem',
    'padding:1.25rem 1.35rem',
    'border-radius:14px',
    'box-sizing:border-box',
    'background:linear-gradient(145deg, rgba(255,255,255,0.04), transparent)',
    `border:1px solid ${hexToRgba(p.accent, 0.22)}`,
    'box-shadow:0 12px 40px rgba(0,0,0,0.35)',
  ].join(';')

  const sectionsHtml = feature.sections
    .map((s) => {
      const sectionShellStyle = [
        'margin-bottom:2rem',
        'padding:1.25rem 1.35rem',
        'border-radius:14px',
        'box-sizing:border-box',
        `background:${p.surfaceElevated}`,
        `border:1px solid ${hexToRgba(p.muted, 0.25)}`,
      ].join(';')

      const titleStyle = [
        "font-family:Georgia,'Times New Roman',serif",
        'font-size:1.5rem',
        'font-weight:600',
        'margin:0 0 0.75rem',
        'letter-spacing:0.02em',
        `color:${p.accent}`,
      ].join(';')

      const bodyStyle = 'margin:0'

      return `<div style="${sectionShellStyle}">
  <div style="${titleStyle}">${escapeHtml(s.title)}</div>
  <div style="${bodyStyle}">${s.html}</div>
</div>`
    })
    .join('\n')

  return `<div style="${rootStyle}">
<div style="${openingStyle}">${feature.openingHtml}</div>
${sectionsHtml}
</div>`
}

/** Minimal document so the in-app iframe can render the fragment (preview only; not for Crushon paste). */
export function buildPreviewSrcDoc(fragmentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Preview</title>
</head>
<body style="margin:0;padding:0;">
${fragmentHtml}
</body>
</html>`
}

/** Single-file copy: Crushon-safe HTML fragment (allowed tags + inline CSS only). */
export function buildExportBundle(character: Character): string {
  return buildIntroductionStudioFragment(character.description)
}

export function buildPreviewDocument(character: Character): string {
  return buildPreviewSrcDoc(buildIntroductionStudioFragment(character.description))
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
