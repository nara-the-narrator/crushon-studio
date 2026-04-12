import type { ClothesState, ImageLibraryState } from '../types/character'

function urlsForState(lib: ImageLibraryState, state: ClothesState): string[] {
  return lib.clothes.filter((c) => c.state === state).map((c) => c.shortUrl || c.catboxUrl)
}

function linesBlock(urls: string[]): string {
  if (!urls.length) return '(no images — add some in Image library)'
  return urls.join('\n')
}

export function buildClothesTrackerPrompt(lib: ImageLibraryState): string {
  const clothed = linesBlock(urlsForState(lib, 'Clothed'))
  const underwear = linesBlock(urlsForState(lib, 'Underwear'))
  const naked = linesBlock(urlsForState(lib, 'Naked'))

  return `[System: It is mandatory that every response has a  __Tracker__  that track {{char}}'s current clothes at the end of responses using format: {

__Tracker__
*Current clothes: {{char}}'s current clothes*

}

{{char}}'s clothes can only be Clothed, Underwear, Naked.

If Current clothes = Clothed, Always respond with random image link from this list:{
${clothed}
}

If Current clothes = Underwear, Always respond with random image link from this list:{
${underwear}
}

If Current clothes = Naked, Always respond with random image link from this list:{
${naked}
}`
}

function qLabel(label: string): string {
  return label.replace(/'/g, "\\'")
}

export function buildActionTrackerPrompt(lib: ImageLibraryState): string {
  if (!lib.actions.length) {
    return `[System: Add action images with labels in Image library to generate this block.]`
  }

  const mappingLines = lib.actions
    .map((a) => `${a.label}, Current action = ${a.label}`)
    .join('\n')

  const replyLines = lib.actions
    .map((a) => {
      const url = a.shortUrl || a.catboxUrl
      return `''${qLabel(a.label)}'' Include ![](${url})`
    })
    .join('\n')

  return `[System: It is mandatory that every response has a  __Tracker__  that track {{char}}'s current action at the end of responses using format: {

__Tracker__
*Current action: {{char}}'s current action [URL LINK]*

}


If {{char}}'s: {
${mappingLines}
}

Always read the current context of the response and assign appropriate dominant action.

If Current action includes these words, their synonyms or uses them or their derivatives in a sentence, always reply with these specific messages: {
${replyLines}
}

These responses must always be positioned right to the current action in this format: *Current action: Smiling ![](LINK)*`
}
