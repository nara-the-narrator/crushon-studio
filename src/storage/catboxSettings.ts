const LS_KEY = 'nara-catbox-userhash-v1'

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
    // ignore
  }
}
