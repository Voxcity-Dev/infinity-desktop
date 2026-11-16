import { app, ipcMain } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { soDoApp } from './origem'
import {
  ARG_NA_BANDEJA,
  deveLigarDeFabrica,
  inicioSuportado,
  opcoesDoInicio,
  type PreferenciasDaCasca,
} from './partida'

// Abrir junto com o computador (Card VoxPlan #37265): vem ligado de fábrica e
// abre escondido na bandeja, com o site carregado e o ramal registrado. O
// interruptor fica no Editar perfil do front (aba Aplicativos).

function arquivoDePreferencias(): string {
  return join(app.getPath('userData'), 'preferencias-da-casca.json')
}

function lerPreferencias(): PreferenciasDaCasca {
  try {
    return JSON.parse(readFileSync(arquivoDePreferencias(), 'utf8')) as PreferenciasDaCasca
  } catch {
    return {}
  }
}

function gravarPreferencias(preferencias: PreferenciasDaCasca): void {
  try {
    writeFileSync(arquivoDePreferencias(), JSON.stringify(preferencias))
  } catch (erro) {
    console.warn('[inicio] não gravou as preferências:', (erro as Error).message)
  }
}

function suportado(): boolean {
  return inicioSuportado(process.platform, app.isPackaged)
}

function estaLigado(): boolean {
  if (!suportado()) return false
  // No Windows a consulta precisa dos mesmos args da gravação (partida.ts).
  return app.getLoginItemSettings({ args: [ARG_NA_BANDEJA] }).openAtLogin
}

export function setupStartup(enderecoDoApp: string): void {
  const preferencias = lerPreferencias()
  if (deveLigarDeFabrica(preferencias, process.platform, app.isPackaged)) {
    app.setLoginItemSettings(opcoesDoInicio(true))
    gravarPreferencias({ ...preferencias, inicioDecidido: true })
  }

  ipcMain.handle('get-auto-start', () => estaLigado())

  ipcMain.handle(
    'set-auto-start',
    soDoApp(enderecoDoApp, (_event, enabled: boolean) => {
      if (!suportado()) return false
      app.setLoginItemSettings(opcoesDoInicio(enabled === true))
      gravarPreferencias({ ...lerPreferencias(), inicioDecidido: true })
      return estaLigado()
    }),
  )
}
