/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CATBOX_USERHASH?: string
  /** Full origin + path prefix if you host your own reverse proxy to catbox (e.g. https://my.app/api/catbox-proxy → user/api.php) */
  readonly VITE_CATBOX_PROXY_URL?: string
  readonly VITE_LITTERBOX_PROXY_URL?: string
  readonly VITE_SHORTENER_PROXY_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
