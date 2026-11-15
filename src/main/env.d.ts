// Variáveis que o electron-vite injeta no build do main (prefixo MAIN_VITE_).
interface ImportMetaEnv {
  readonly MAIN_VITE_INFINITY_DESKTOP_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
