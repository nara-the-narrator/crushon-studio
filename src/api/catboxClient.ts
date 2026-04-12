function catboxEndpoint(): string {
  const full = import.meta.env.VITE_CATBOX_PROXY_URL as string | undefined
  if (full) return full.replace(/\/$/, '')
  return '/api/catbox'
}

function shortenEndpoint(): string {
  const full = import.meta.env.VITE_SHORTENER_PROXY_URL as string | undefined
  if (full) return full.replace(/\/$/, '')
  return '/api/vgd'
}

export function resolveCatboxUserhash(stored: string): string {
  const fromEnv = (import.meta.env.VITE_CATBOX_USERHASH as string | undefined)?.trim()
  const s = stored.trim()
  if (s) return s
  if (fromEnv) return fromEnv
  return ''
}

export function isCatboxPausedResponse(status: number, body: string): boolean {
  return (
    status === 412 ||
    /\b412\b/.test(body) ||
    /uploads?\s*paused|please\s*wait/i.test(body)
  )
}

function errorLooksLikeCatboxPaused(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  return isCatboxPausedResponse(0, err.message)
}

const PAUSED_RETRY_ATTEMPTS = 6
const PAUSED_RETRY_BASE_MS = 2500

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

async function runWithPausedRetry<T>(fn: () => Promise<T>): Promise<T> {
  let last: unknown
  for (let attempt = 1; attempt <= PAUSED_RETRY_ATTEMPTS; attempt++) {
    try {
      return await fn()
    } catch (e) {
      last = e
      if (!errorLooksLikeCatboxPaused(e) || attempt === PAUSED_RETRY_ATTEMPTS) {
        if (
          errorLooksLikeCatboxPaused(e) &&
          attempt === PAUSED_RETRY_ATTEMPTS &&
          e instanceof Error
        ) {
          throw new Error(
            `${e.message.trim()} After ${PAUSED_RETRY_ATTEMPTS} automatic retries, Catbox is still pausing uploads — wait several minutes, try another network, or use pasted image URLs until it clears.`,
          )
        }
        throw e
      }
      const waitMs = Math.min(16_000, PAUSED_RETRY_BASE_MS * 2 ** (attempt - 1))
      await delay(waitMs)
    }
  }
  throw last
}

async function postCatboxFormData(fd: FormData): Promise<{ ok: boolean; status: number; text: string }> {
  const res = await fetch(catboxEndpoint(), {
    method: 'POST',
    body: fd,
  })
  const text = (await res.text()).trim()
  return { ok: res.ok, status: res.status, text }
}

async function uploadFileToCatboxOnce(file: File, userhash: string): Promise<string> {
  const h = userhash.trim()
  if (!h) {
    throw new Error('Catbox userhash is required. Add it in the footer (Catbox account).')
  }
  const fd = new FormData()
  fd.append('reqtype', 'fileupload')
  fd.append('userhash', h)
  fd.append('fileToUpload', file, file.name)

  const { ok, status, text } = await postCatboxFormData(fd)
  if (!ok || !text.startsWith('http')) {
    const extra = isCatboxPausedResponse(status, text)
      ? ' (Catbox may be rate-limiting or pausing uploads.)'
      : ''
    throw new Error((text || `HTTP ${status}`) + extra)
  }
  return text
}

export async function uploadFileToCatbox(file: File, userhash: string): Promise<string> {
  return runWithPausedRetry(() => uploadFileToCatboxOnce(file, userhash))
}

export function catboxFileNameFromUrl(catboxUrl: string): string | null {
  try {
    const u = new URL(catboxUrl)
    if (!u.hostname.endsWith('catbox.moe')) return null
    const seg = u.pathname.split('/').filter(Boolean).pop()
    if (!seg || !/^[a-z0-9._-]+\.[a-z0-9]+$/i.test(seg)) return null
    return seg
  } catch {
    return null
  }
}

export function parseAlbumShortFromResponse(body: string): string | null {
  const m = body.match(/catbox\.moe\/c\/([a-z0-9]{6})\b/i)
  if (m) return m[1].toLowerCase()
  const m2 = body.match(/^([a-z0-9]{6})$/i)
  if (m2) return m2[1].toLowerCase()
  return null
}

async function createAlbumOnce(
  userhash: string,
  title: string,
  desc: string,
  fileNames: string[],
): Promise<string> {
  const h = userhash.trim()
  if (!h) throw new Error('Catbox userhash is required.')
  const files = fileNames.map((f) => f.trim()).filter(Boolean).join(' ')
  if (!files) throw new Error('No filenames for createalbum.')

  const fd = new FormData()
  fd.append('reqtype', 'createalbum')
  fd.append('userhash', h)
  fd.append('title', title.slice(0, 200))
  fd.append('desc', desc.slice(0, 2000))
  fd.append('files', files)

  const { ok, status, text } = await postCatboxFormData(fd)
  if (parseAlbumShortFromResponse(text)) return text
  if (ok) return text
  const msg = text || `createalbum failed (HTTP ${status})`
  if (isCatboxPausedResponse(status, text)) {
    throw new Error(`${msg} (Catbox may be rate-limiting or pausing.)`)
  }
  throw new Error(msg)
}

export async function createAlbum(
  userhash: string,
  title: string,
  desc: string,
  fileNames: string[],
): Promise<string> {
  return runWithPausedRetry(() => createAlbumOnce(userhash, title, desc, fileNames))
}

async function addToAlbumOnce(userhash: string, albumShort: string, fileNames: string[]): Promise<void> {
  const h = userhash.trim()
  if (!h) throw new Error('Catbox userhash is required.')
  const files = fileNames.map((f) => f.trim()).filter(Boolean).join(' ')
  if (!files) return

  const fd = new FormData()
  fd.append('reqtype', 'addtoalbum')
  fd.append('userhash', h)
  fd.append('short', albumShort.trim().toLowerCase())
  fd.append('files', files)

  const { ok, status, text } = await postCatboxFormData(fd)
  if (!ok) {
    const msg = text || `addtoalbum failed (HTTP ${status})`
    if (isCatboxPausedResponse(status, text)) {
      throw new Error(`${msg} (Catbox may be rate-limiting or pausing.)`)
    }
    throw new Error(msg)
  }
}

export async function addToAlbum(userhash: string, albumShort: string, fileNames: string[]): Promise<void> {
  return runWithPausedRetry(() => addToAlbumOnce(userhash, albumShort, fileNames))
}

async function removeFromAlbumOnce(
  userhash: string,
  albumShort: string,
  fileNames: string[],
): Promise<void> {
  const h = userhash.trim()
  if (!h) throw new Error('Catbox userhash is required.')
  const files = fileNames.map((f) => f.trim()).filter(Boolean).join(' ')
  if (!files) return

  const fd = new FormData()
  fd.append('reqtype', 'removefromalbum')
  fd.append('userhash', h)
  fd.append('short', albumShort.trim().toLowerCase())
  fd.append('files', files)

  const { ok, status, text } = await postCatboxFormData(fd)
  if (!ok) {
    const msg = text || `removefromalbum failed (HTTP ${status})`
    if (isCatboxPausedResponse(status, text)) {
      throw new Error(`${msg} (Catbox may be rate-limiting or pausing.)`)
    }
    throw new Error(msg)
  }
}

export async function removeFromAlbum(
  userhash: string,
  albumShort: string,
  fileNames: string[],
): Promise<void> {
  return runWithPausedRetry(() => removeFromAlbumOnce(userhash, albumShort, fileNames))
}

export async function shortenUrlVgd(longUrl: string): Promise<string> {
  const q = new URLSearchParams({ format: 'simple', url: longUrl })
  const url = `${shortenEndpoint()}?${q.toString()}`
  const res = await fetch(url, { method: 'GET' })
  const text = (await res.text()).trim()
  if (!res.ok || text.startsWith('Error') || !text.startsWith('http')) {
    throw new Error(text || 'URL shortener failed.')
  }
  return text
}

export type AuthenticatedUploadResult = {
  catboxUrl: string
  shortUrl: string
  fileName: string
}

export async function uploadAuthenticatedWithShorten(
  file: File,
  userhash: string,
): Promise<AuthenticatedUploadResult> {
  const catboxUrl = await uploadFileToCatbox(file, userhash)
  const fileName = catboxFileNameFromUrl(catboxUrl)
  if (!fileName) {
    throw new Error('Upload succeeded but filename could not be parsed for album sync.')
  }
  let shortUrl = catboxUrl
  try {
    shortUrl = await shortenUrlVgd(catboxUrl)
  } catch {
    void 0
  }
  return { catboxUrl, shortUrl, fileName }
}

export async function normalizePastedImageUrl(raw: string): Promise<{ catboxUrl: string; shortUrl: string }> {
  const u = raw.trim()
  if (!/^https?:\/\//i.test(u)) {
    throw new Error('URL must start with http:// or https://')
  }
  try {
    const shortUrl = await shortenUrlVgd(u)
    return { catboxUrl: u, shortUrl }
  } catch {
    return { catboxUrl: u, shortUrl: u }
  }
}
