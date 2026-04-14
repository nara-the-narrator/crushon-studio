import type { Character, IntroductionStudioContent } from '../types/character'
import { sanitizeLimitedHtml } from './sanitizeLimitedHtml'

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

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.max(0, Math.min(1, value))
}

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
        `background:${hexToRgba(p.surfaceElevated, clamp01(s.opacity ?? 0.9))}`,
        s.showBorder ?? true
          ? `border:1px solid ${hexToRgba(s.borderColor ?? p.muted, 0.5)}`
          : 'border:none',
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
      const sectionBodyHtml = sanitizeLimitedHtml(s.html)

      return `<div style="${sectionShellStyle}">
  <div style="${titleStyle}">${escapeHtml(s.title)}</div>
  <div style="${bodyStyle}">${sectionBodyHtml}</div>
</div>`
    })
    .join('\n')

  const openingInner = sanitizeLimitedHtml(feature.openingHtml)

  return `<div style="${rootStyle}">
<div style="${openingStyle}">${openingInner}</div>
${sectionsHtml}
</div>`
}

export function buildPreviewSrcDoc(fragmentHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Preview</title>
<style>
  * {
    box-sizing: border-box;
  }
  img,
  video,
  iframe {
    display: block;
    max-width: 100%;
    height: auto;
  }
  pre {
    max-width: 100%;
    overflow-x: auto;
  }
</style>
</head>
<body style="margin:0;padding:0;">
${fragmentHtml}
</body>
</html>`
}

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
