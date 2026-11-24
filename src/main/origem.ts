import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron'
import { ehDoApp } from './navegacao'

// A ponte electronAPI só atende o site do app. Com o site carregado da rede,
// é aqui (e não no preload) que um popup ou uma página de fora deixa de poder
// mandar notificação, gravar arquivo ou mexer no auto-start.
// Janelas que mostram o site mas não falam pela ponte (a do anexo do chat).
const janelasSemPonte = new Set<number>()

export function semPonte(webContents: { id: number; once(evento: 'destroyed', cb: () => void): unknown }): void {
  janelasSemPonte.add(webContents.id)
  webContents.once('destroyed', () => janelasSemPonte.delete(webContents.id))
}

export function soDoApp<E extends IpcMainEvent | IpcMainInvokeEvent, A extends unknown[], R>(
  enderecoDoApp: string,
  handler: (event: E, ...args: A) => R,
): (event: E, ...args: A) => R | undefined {
  return (event, ...args) => {
    const url = event.senderFrame?.url ?? ''
    if (janelasSemPonte.has(event.sender?.id)) {
      console.warn('[ipc] chamada recusada de janela sem ponte:', url.slice(0, 120))
      return undefined
    }
    if (!ehDoApp(url, enderecoDoApp)) {
      console.warn('[ipc] chamada recusada de fora do app:', url.slice(0, 120))
      return undefined
    }
    return handler(event, ...args)
  }
}
