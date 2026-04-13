/** Theme colors for introduction preview and exported inline HTML. */
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
  html: string
  opacity: number
  showBorder: boolean
  borderColor: string
}

/** Opening HTML + titled sections + palette (Crushon “Introduction” / Tavern `personality` when exported). */
export interface IntroductionStudioContent {
  openingHtml: string
  sections: IntroductionSection[]
  palette: ColorPalette
}

/** Long-form fields: map to Tavern `description`, `scenario`, `first_mes`, `appearance`. */
export interface CrushonCardFields {
  personality: string
  scenario: string
  greeting: string
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

export type GifTransitionStyle = 'cut' | 'fade' | 'slide'

export interface GifFrameEntry {
  id: string
  dataUrl: string
  durationMs: number
}

export type ClothesState = 'Clothed' | 'Underwear' | 'Naked'

export type ImageHostSource = 'catbox' | 'manual'

export interface HostedAsset {
  catboxUrl: string
  shortUrl: string
  fileName: string
}

export interface ClothesImageEntry {
  id: string
  state: ClothesState
  catboxUrl: string
  shortUrl: string
  source?: ImageHostSource
  catboxFileName?: string
}

export interface ActionImageEntry {
  id: string
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
  transitionDurationMs: number
  transitionFps: number
  outputWidth: number
  outputHeight: number
  loop: boolean
  loopClosingTransition: boolean
}

/** Single character document (IndexedDB + optional workspace file). */
export interface Character {
  id: string
  name: string
  age: string
  avatarDataUrl: string | null
  avatarHosted: HostedAsset | null
  catboxAlbumShort: string | null
  tags: string[]
  createdAt: number
  updatedAt: number
  description: IntroductionStudioContent
  crushonCard: CrushonCardFields
  gifConstructor: GifConstructorState
  gifHosted: HostedAsset | null
  imageLibrary: ImageLibraryState
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
