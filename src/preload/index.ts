import { contextBridge, ipcRenderer, webUtils } from 'electron'

// Expose protected APIs to the renderer process via window.electronAPI
const electronAPI = {
  // --- Notifications ---
  showNotification: (title: string, body: string, options?: { silent?: boolean; tag?: string }) =>
    ipcRenderer.invoke('show-notification', title, body, options),

  onNotificationClicked: (callback: (tag?: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, tag?: string) => callback(tag)
    ipcRenderer.on('notification-clicked', handler)
    return () => ipcRenderer.removeListener('notification-clicked', handler)
  },

  // --- File Downloads ---
  saveFile: (
    buffer: ArrayBuffer,
    defaultName: string,
    filters?: { name: string; extensions: string[] }[],
  ) => ipcRenderer.invoke('save-file', buffer, defaultName, filters),

  // --- Conversor no computador ---
  // O arquivo solto da pasta do PC tem caminho; o que veio de outro lugar (uma
  // imagem arrastada de um site, um arquivo montado pela página) não tem.
  temCaminhoNoComputador: (arquivo: File) => {
    try {
      return webUtils.getPathForFile(arquivo) !== ''
    } catch {
      return false
    }
  },
  /** Grava o convertido na mesma pasta do original, sem sobrescrever. */
  salvarAoLado: (original: File, nome: string, bytes: ArrayBuffer) => {
    let caminho = ''
    try {
      caminho = webUtils.getPathForFile(original)
    } catch {
      caminho = ''
    }
    if (!caminho) return Promise.resolve({ ok: false as const, motivo: 'original' as const })
    return ipcRenderer.invoke('salvar-ao-lado', caminho, nome, bytes) as Promise<
      | { ok: true; caminho: string; nome: string }
      | { ok: false; motivo: 'original' | 'nome' | 'tamanho' | 'gravar' }
    >
  },
  /** Abre a pasta do arquivo que a casca acabou de gravar, com ele selecionado. */
  mostrarNaPasta: (caminho: string) => ipcRenderer.send('mostrar-na-pasta', caminho),

  // --- Confirm Dialog ---
  showConfirmDialog: (title: string, message: string) =>
    ipcRenderer.invoke('show-confirm-dialog', title, message) as Promise<boolean>,

  // --- Window ---
  setTitle: (title: string) => ipcRenderer.send('set-title', title),

  // --- Bloqueio de captura do sistema ("ver uma vez" do chat, #32852) ---
  setProtecaoDeCaptura: (ligada: boolean) => ipcRenderer.send('protecao-de-captura', ligada),

  // --- Call State (renderer → main, updates tray) ---
  setCallState: (state: 'idle' | 'ringing' | 'in-call') =>
    ipcRenderer.send('call-state-changed', state),

  // --- Aviso de chamada do sistema (Windows: Atender e Recusar) ---
  avisarChamada: (aviso: { titulo: string; de: string; atender: string; recusar: string }) =>
    ipcRenderer.send('aviso-de-chamada', aviso),
  encerrarAvisoDeChamada: () => ipcRenderer.send('fim-do-aviso-de-chamada'),

  // --- Auto-Start ---
  getAutoStart: () => ipcRenderer.invoke('get-auto-start') as Promise<boolean>,
  setAutoStart: (enabled: boolean) =>
    ipcRenderer.invoke('set-auto-start', enabled) as Promise<boolean>,

  // --- App Info ---
  getAppVersion: () => ipcRenderer.invoke('get-app-version') as Promise<string>,
  isElectron: () => ipcRenderer.invoke('is-electron') as Promise<boolean>,

  // --- Badge Count ---
  setBadgeCount: (count: number) => ipcRenderer.send('set-badge-count', count),

  // --- IPC Listeners (main → renderer) ---
  onTrayAction: (callback: (action: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, action: string) => callback(action)
    ipcRenderer.on('tray-action', handler)
    return () => ipcRenderer.removeListener('tray-action', handler)
  },

  onUpdateAvailable: (callback: (info: { version: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, info: { version: string }) =>
      callback(info)
    ipcRenderer.on('update-available', handler)
    return () => ipcRenderer.removeListener('update-available', handler)
  },

  // "Reiniciar agora": fecha e instala a versão baixada.
  installUpdate: () => ipcRenderer.send('instalar-atualizacao'),

  onUpdateDownloaded: (callback: (info: { version: string }) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, info: { version: string }) =>
      callback(info)
    ipcRenderer.on('update-downloaded', handler)
    return () => ipcRenderer.removeListener('update-downloaded', handler)
  },

  // --- Deep Linking (infinity://) ---
  onDeepLink: (callback: (route: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, route: string) => callback(route)
    ipcRenderer.on('deep-link', handler)
    return () => ipcRenderer.removeListener('deep-link', handler)
  },
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// Type declaration for the renderer
export type ElectronAPI = typeof electronAPI
