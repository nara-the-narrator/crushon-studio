const LS_KEY = 'nara-catbox-userhash-v1'
const STYLE_API_KEY_LS_KEY = 'nara-style-api-key-v1'

export function getStoredCatboxUserhash(): string {
  try {
    return localStorage.getItem(LS_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setStoredCatboxUserhash(userhash: string): void {
  try {
    if (userhash.trim()) localStorage.setItem(LS_KEY, userhash.trim())
    else localStorage.removeItem(LS_KEY)
  } catch {
    void 0 // ignore localStorage write errors
  }
}

export function getStoredStyleApiKey(): string {
  try {
    return localStorage.getItem(STYLE_API_KEY_LS_KEY) ?? ''
  } catch {
    return ''
  }
}

export function setStoredStyleApiKey(apiKey: string): void {
  try {
    if (apiKey.trim()) localStorage.setItem(STYLE_API_KEY_LS_KEY, apiKey.trim())
    else localStorage.removeItem(STYLE_API_KEY_LS_KEY)
  } catch {
    void 0 // ignore localStorage write errors
  }
}
