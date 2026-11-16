import { ipcMain, Notification } from 'electron'
import { soDoApp } from './origem'
import { montarToastDeChamada, normalizarAviso } from './aviso-de-chamada'

// Um aviso de chamada por vez: o toque novo troca o anterior, e atender,
// recusar ou a chamada cair fecham (Card VoxPlan #37265).
let avisoAberto: Notification | null = null

export function encerrarAvisoDeChamada(): void {
  avisoAberto?.close()
  avisoAberto = null
}

function mostrarAvisoDeChamada(bruto: unknown, aoAbrir: () => void): void {
  encerrarAvisoDeChamada()
  const aviso = normalizarAviso(bruto)
  // Windows: toast de chamada com Atender e Recusar, que voltam por
  // infinity://chamada/<ação>. macOS e Linux: o aviso comum; o clique abre a janela.
  const notificacao =
    process.platform === 'win32'
      ? new Notification({ toastXml: montarToastDeChamada(aviso) })
      : new Notification({ title: aviso.titulo, body: aviso.de, silent: true })
  notificacao.on('click', aoAbrir)
  notificacao.show()
  avisoAberto = notificacao
}

export function setupAvisoDeChamada(enderecoDoApp: string, aoAbrir: () => void): void {
  ipcMain.on(
    'aviso-de-chamada',
    soDoApp(enderecoDoApp, (_event, aviso: unknown) => mostrarAvisoDeChamada(aviso, aoAbrir)),
  )
  ipcMain.on(
    'fim-do-aviso-de-chamada',
    soDoApp(enderecoDoApp, () => encerrarAvisoDeChamada()),
  )
}
