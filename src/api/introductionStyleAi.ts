import type { ColorPalette } from '../types/character'

type SectionInput = {
  title: string
  opacity: number
  showBorder: boolean
  borderColor: string
}

type RestyleInput = {
  apiKey: string
  styleRequest: string
  sections: SectionInput[]
  palette: ColorPalette
}

export type IntroductionStylePlan = {
  palette: ColorPalette
  sections: Array<{
    opacity?: number
    showBorder?: boolean
    borderColor?: string
  }>
}

const SYSTEM_PROMPT = `You are a style-only planner for Crushon Studio.

Return JSON only with this exact shape:
{
  "palette": {
    "primary": "#14101f",
    "secondary": "#1f1a2e",
    "accent": "#c4a35a",
    "surface": "#0c0a12",
    "surfaceElevated": "#1a1628",
    "text": "#ebe6f4",
    "muted": "#8f879e"
  },
  "sections": [
    {
      "opacity": 0.9,
      "showBorder": true,
      "borderColor": "#8f879e"
    }
  ]
}

Rules:
- Keep the same number of sections as input, in the same order.
- This is STYLE-ONLY. Do not rewrite, summarize, or return content text/HTML.
- Return only visual settings: palette colors and section appearance.
- Use valid hex colors.
- opacity must be between 0 and 1.
- Be creatively bold with visual direction when asked (moody, neon, gothic, minimal, warm, etc.).
- Prefer noticeable changes over subtle tweaks unless user asks for subtle.
- Keep results readable: text color should contrast with dark surfaces.
- You can vary section opacity/border usage across sections to create hierarchy.`

function stringifyPayload(styleRequest: string, sections: SectionInput[], palette: ColorPalette): string {
  const payload = {
    styleRequest: styleRequest.trim() || 'Elegant cinematic style, readable and balanced.',
    palette,
    sections,
  }
  return JSON.stringify(payload, null, 2)
}

function stripCodeFence(raw: string): string {
  const t = raw.trim()
  if (!t.startsWith('```')) return t
  return t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
}

function isHexColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value.trim())
}

function normalizePalette(candidate: unknown, fallback: ColorPalette): ColorPalette {
  const p = (candidate && typeof candidate === 'object' ? candidate : {}) as Partial<ColorPalette>
  return {
    primary: typeof p.primary === 'string' && isHexColor(p.primary) ? p.primary : fallback.primary,
    secondary: typeof p.secondary === 'string' && isHexColor(p.secondary) ? p.secondary : fallback.secondary,
    accent: typeof p.accent === 'string' && isHexColor(p.accent) ? p.accent : fallback.accent,
    surface: typeof p.surface === 'string' && isHexColor(p.surface) ? p.surface : fallback.surface,
    surfaceElevated:
      typeof p.surfaceElevated === 'string' && isHexColor(p.surfaceElevated)
        ? p.surfaceElevated
        : fallback.surfaceElevated,
    text: typeof p.text === 'string' && isHexColor(p.text) ? p.text : fallback.text,
    muted: typeof p.muted === 'string' && isHexColor(p.muted) ? p.muted : fallback.muted,
  }
}

function normalizeOpacity(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number.NaN
  if (!Number.isFinite(n)) return fallback
  return Math.max(0, Math.min(1, n))
}

function extractRestyleOutput(rawContent: string, input: RestyleInput): IntroductionStylePlan {
  const parsed = JSON.parse(stripCodeFence(rawContent)) as
    | Partial<IntroductionStylePlan>
    | { result?: Partial<IntroductionStylePlan>; data?: Partial<IntroductionStylePlan> }
  const candidate =
    (parsed as { result?: Partial<IntroductionStylePlan> }).result ??
    (parsed as { data?: Partial<IntroductionStylePlan> }).data ??
    (parsed as Partial<IntroductionStylePlan>)

  const palette = normalizePalette(candidate.palette, input.palette)
  const rawSections = Array.isArray(candidate.sections) ? candidate.sections : []
  if (rawSections.length !== input.sections.length) {
    throw new Error('AI response has a different section count. Try a shorter or clearer style prompt.')
  }
  const sections = rawSections.map((raw, i) => {
    const s = (raw && typeof raw === 'object' ? raw : {}) as {
      opacity?: unknown
      showBorder?: unknown
      borderColor?: unknown
    }
    const current = input.sections[i]
    return {
      opacity: normalizeOpacity(s.opacity, current.opacity),
      showBorder: typeof s.showBorder === 'boolean' ? s.showBorder : current.showBorder,
      borderColor:
        typeof s.borderColor === 'string' && isHexColor(s.borderColor) ? s.borderColor : current.borderColor,
    }
  })
  return { palette, sections }
}

function hasVisibleChanges(output: IntroductionStylePlan, input: RestyleInput): boolean {
  if (JSON.stringify(output.palette) !== JSON.stringify(input.palette)) return true
  for (let i = 0; i < input.sections.length; i += 1) {
    const next = output.sections[i]
    const prev = input.sections[i]
    if (!next) continue
    if (next.opacity !== prev.opacity) return true
    if (next.showBorder !== prev.showBorder) return true
    if ((next.borderColor ?? '').toLowerCase() !== (prev.borderColor ?? '').toLowerCase()) return true
  }
  return false
}

async function requestRestyle(input: RestyleInput, forceStronger = false): Promise<IntroductionStylePlan> {
  const apiKey = input.apiKey.trim()
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), 60000)
  try {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.95,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            stringifyPayload(input.styleRequest, input.sections, input.palette) +
            (forceStronger
              ? '\n\nIMPORTANT: Previous attempt was too subtle. Push stronger stylistic contrast and section differentiation.'
              : ''),
        },
      ],
    }),
    signal: controller.signal,
  })

  if (!res.ok) {
    const raw = (await res.text()).trim().slice(0, 500)
    throw new Error(`AI request failed (${res.status}). ${raw || 'No response body.'}`)
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  const content = data.choices?.[0]?.message?.content ?? ''
  if (!content.trim()) {
    throw new Error('AI returned an empty response.')
  }
  return extractRestyleOutput(content, input)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('AI request timed out. Please try again with a shorter prompt.')
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

export async function restyleIntroductionWithAi(input: RestyleInput): Promise<IntroductionStylePlan> {
  const apiKey = input.apiKey.trim()
  if (!apiKey) throw new Error('Missing API key. Add it in Settings next to Catbox userhash.')

  try {
    const first = await requestRestyle(input, false)
    if (hasVisibleChanges(first, input)) return first

    const second = await requestRestyle(input, true)
    if (hasVisibleChanges(second, input)) return second

    throw new Error(
      'AI returned content too similar to the current introduction. Try a more specific style prompt (theme, typography, tone, structure).',
    )
  } catch (error) {
    throw error
  }
}
