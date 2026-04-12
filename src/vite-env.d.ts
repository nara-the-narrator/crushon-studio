/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CATBOX_USERHASH?: string
  readonly VITE_CATBOX_PROXY_URL?: string
  readonly VITE_LITTERBOX_PROXY_URL?: string
  readonly VITE_SHORTENER_PROXY_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
