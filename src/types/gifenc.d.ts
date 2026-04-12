declare module 'gifenc' {
  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: Record<string, unknown>,
  ): number[][]

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: number[][],
    format?: string,
  ): Uint8Array

  export function GIFEncoder(opts?: Record<string, unknown>): {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      opts?: {
        palette?: number[][]
        delay?: number
        repeat?: number
        transparent?: boolean
        transparentIndex?: number
        first?: boolean
      },
    ): void
    finish(): void
    bytes(): Uint8Array
    bytesView(): Uint8Array
  }
}
