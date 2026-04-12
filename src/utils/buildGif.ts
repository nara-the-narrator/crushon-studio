import { GIFEncoder, applyPalette, quantize } from 'gifenc'
import type { GifConstructorState, GifTransitionStyle } from '../types/character'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = src
  })
}

function drawContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
): void {
  const iw = img.naturalWidth || img.width
  const ih = img.naturalHeight || img.height
  if (!iw || !ih) return
  const scale = Math.min(w / iw, h / ih)
  const dw = iw * scale
  const dh = ih * scale
  const x = (w - dw) / 2
  const y = (h - dh) / 2
  ctx.fillStyle = '#0a0a12'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, x, y, dw, dh)
}

function drawFade(
  ctx: CanvasRenderingContext2D,
  a: HTMLImageElement,
  b: HTMLImageElement,
  w: number,
  h: number,
  t: number,
): void {
  ctx.globalAlpha = 1
  drawContain(ctx, a, w, h)
  ctx.globalAlpha = Math.min(1, Math.max(0, t))
  drawContain(ctx, b, w, h)
  ctx.globalAlpha = 1
}

function drawSlide(
  ctx: CanvasRenderingContext2D,
  a: HTMLImageElement,
  b: HTMLImageElement,
  w: number,
  h: number,
  p: number,
): void {
  ctx.globalAlpha = 1
  drawContain(ctx, a, w, h)
  ctx.save()
  ctx.translate(w * (1 - p), 0)
  drawContain(ctx, b, w, h)
  ctx.restore()
}

function drawTransition(
  ctx: CanvasRenderingContext2D,
  a: HTMLImageElement,
  b: HTMLImageElement,
  w: number,
  h: number,
  style: GifTransitionStyle,
  t: number,
): void {
  if (style === 'fade') {
    drawFade(ctx, a, b, w, h, t)
    return
  }
  drawSlide(ctx, a, b, w, h, t)
}

export interface EncodeGifProgress {
  phase: string
  current: number
  total: number
}

function transitionSteps(state: GifConstructorState): number {
  const fps = Math.min(40, Math.max(6, state.transitionFps))
  const raw = Math.round((state.transitionDurationMs / 1000) * fps)
  return Math.max(2, Math.min(80, raw))
}

/**
 * Encodes an animated GIF from slide frames + transition settings.
 */
export async function encodeGifFromState(
  state: GifConstructorState,
  onProgress?: (p: EncodeGifProgress) => void,
): Promise<Uint8Array> {
  const { frames, outputWidth: w, outputHeight: h } = state
  if (!frames.length) {
    throw new Error('Add at least one image to build a GIF.')
  }

  const images = await Promise.all(frames.map((f) => loadImage(f.dataUrl)))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) {
    throw new Error('Canvas is not available.')
  }
  const ctx2d = ctx

  const gif = GIFEncoder()
  const repeat = state.loop ? 0 : -1
  let firstWritten = true

  const report = (phase: string, cur: number, tot: number) => {
    onProgress?.({ phase, current: cur, total: tot })
  }

  function writeCurrentFrame(delayMs: number): void {
    const data = ctx2d.getImageData(0, 0, w, h).data
    const palette = quantize(data, 256)
    const index = applyPalette(data, palette)
    gif.writeFrame(index, w, h, {
      palette,
      delay: Math.max(20, Math.round(delayMs)),
      ...(firstWritten ? { repeat } : {}),
    })
    firstWritten = false
  }

  const n = images.length
  const steps = transitionSteps(state)
  const useTransitions = state.transitionStyle !== 'cut' && n > 1
  const stepDelay = state.transitionDurationMs / steps

  if (n === 1) {
    report('Encoding', 0, 1)
    drawContain(ctx2d, images[0], w, h)
    writeCurrentFrame(frames[0].durationMs)
    report('Encoding', 1, 1)
    gif.finish()
    return gif.bytes()
  }

  for (let i = 0; i < n; i++) {
    report('Slide', i + 1, n)
    drawContain(ctx2d, images[i], w, h)
    writeCurrentFrame(frames[i].durationMs)

    if (i < n - 1 && useTransitions) {
      for (let s = 0; s < steps; s++) {
        const t = steps <= 1 ? 1 : s / (steps - 1)
        report('Transition', s + 1, steps)
        drawTransition(
          ctx2d,
          images[i],
          images[i + 1],
          w,
          h,
          state.transitionStyle,
          t,
        )
        writeCurrentFrame(stepDelay)
      }
    }
  }

  if (useTransitions && state.loop && state.loopClosingTransition && n > 1) {
    for (let s = 0; s < steps; s++) {
      const t = steps <= 1 ? 1 : s / (steps - 1)
      report('Loop closing', s + 1, steps)
      drawTransition(
        ctx2d,
        images[n - 1],
        images[0],
        w,
        h,
        state.transitionStyle,
        t,
      )
      writeCurrentFrame(stepDelay)
    }
  }

  gif.finish()
  return gif.bytes()
}

export function downloadGifBytes(bytes: Uint8Array, filename: string): void {
  const blob = new Blob([new Uint8Array(bytes)], { type: 'image/gif' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.gif') ? filename : `${filename}.gif`
  a.click()
  URL.revokeObjectURL(url)
}
