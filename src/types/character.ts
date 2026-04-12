/** Extensible character model — add new feature blocks under `features` later. */

export interface ColorPalette {
  primary: string
  secondary: string
  accent: string
  surface: string
  surfaceElevated: string
  text: string
  muted: string
}

export interface IntroductionSection {
  id: string
  title: string
  /** HTML fragment (images as <img src="data:..."> or URLs). */
  html: string
}

/** Document edited in Introduction studio (maps to Crushon “Introduction” / Tavern JSON `description`). */
export interface IntroductionStudioContent {
  /** Top “placeholder” block — intro / cover copy you can rewrite anytime. */
  openingHtml: string
  sections: IntroductionSection[]
  palette: ColorPalette
}

/**
 * Crushon.ai card fields (separate from Introduction studio).
 * Maps to Personality, Scenario, Greeting, Appearance on import.
 */
export interface CrushonCardFields {
  /** Long-form personality — Crushon “Personality” (long-term memory). */
  personality: string
  /** World / scene framing — Crushon “Scenario”. */
  scenario: string
  /** First message — Crushon “Greeting”. */
  greeting: string
  /** Looks / visual detail — Crushon “Appearance”. */
  appearance: string
}

export function defaultCrushonCardFields(): CrushonCardFields {
  return {
    personality: '',
    scenario: '',
    greeting: '',
    appearance: '',
  }
}

/** Frame-based GIF with optional transitions between slides. */
export type GifTransitionStyle = 'cut' | 'fade' | 'slide'

export interface GifFrameEntry {
  id: string
  dataUrl: string
  /** How long this slide stays on screen before the next transition (ms). */
  durationMs: number
}

/** Clothes tracker: one of three wardrobe states. */
export type ClothesState = 'Clothed' | 'Underwear' | 'Naked'

/** Where the hosted image URL came from (for UI). */
export type ImageHostSource = 'catbox' | 'manual'

/** Catbox-hosted file tied to this app’s album sync (filename on files.catbox.moe). */
export interface HostedAsset {
  catboxUrl: string
  shortUrl: string
  /** e.g. ab12cd.png — used with addtoalbum / removefromalbum. */
  fileName: string
}

export interface ClothesImageEntry {
  id: string
  state: ClothesState
  /** Catbox URL or pasted external URL. */
  catboxUrl: string
  shortUrl: string
  source?: ImageHostSource
  /** Set when uploaded through the app with your userhash (album sync). */
  catboxFileName?: string
}

export interface ActionImageEntry {
  id: string
  /** Dominant action label (e.g. shy, Staring, undressing). */
  label: string
  catboxUrl: string
  shortUrl: string
  source?: ImageHostSource
  catboxFileName?: string
}

export interface ImageLibraryState {
  clothes: ClothesImageEntry[]
  actions: ActionImageEntry[]
}

export interface GifConstructorState {
  frames: GifFrameEntry[]
  transitionStyle: GifTransitionStyle
  /** Time spent animating from slide A → B (ms). Ignored when style is `cut`. */
  transitionDurationMs: number
  /**
   * Sampling rate while a transition plays (frames per second).
   * Higher = smoother motion, larger file.
   */
  transitionFps: number
  outputWidth: number
  outputHeight: number
  /** When true, animation repeats; first-frame repeat metadata uses GIF “forever”. */
  loop: boolean
  /**
   * When looping, optionally animate from the last slide back to the first
   * (same transition style / duration as between other slides).
   */
  loopClosingTransition: boolean
}

export interface Character {
  id: string
  name: string
  avatarDataUrl: string | null
  /** Catbox-hosted avatar (same album as library); preferred for cards / export when set. */
  avatarHosted: HostedAsset | null
  /**
   * Catbox album id (6 chars in https://catbox.moe/c/SHORT).
   * Created on first authenticated upload for this character.
   */
  catboxAlbumShort: string | null
  tags: string[]
  createdAt: number
  updatedAt: number
  /** Introduction studio document (Crushon “Introduction” + HTML copy export). */
  description: IntroductionStudioContent
  /** Crushon card slots separate from Introduction studio. */
  crushonCard: CrushonCardFields
  gifConstructor: GifConstructorState
  /** Hosted GIF from the constructor (uploaded to the same Catbox album). */
  gifHosted: HostedAsset | null
  imageLibrary: ImageLibraryState
  /** Reserved for future feature modules (scenarios, lore, etc.). */
  featureFlags?: Record<string, boolean>
}

export const DEFAULT_PALETTE: ColorPalette = {
  primary: '#14101f',
  secondary: '#1f1a2e',
  accent: '#c4a35a',
  surface: '#0c0a12',
  surfaceElevated: '#1a1628',
  text: '#ebe6f4',
  muted: '#8f879e',
}

export function defaultImageLibrary(): ImageLibraryState {
  return { clothes: [], actions: [] }
}

export function defaultGifConstructor(): GifConstructorState {
  return {
    frames: [],
    transitionStyle: 'fade',
    transitionDurationMs: 450,
    transitionFps: 20,
    outputWidth: 400,
    outputHeight: 400,
    loop: true,
    loopClosingTransition: true,
  }
}
