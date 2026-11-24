// Regras puras de como o app começa: abrir junto com o computador e começar
// escondido na bandeja. Sem import do Electron para ser
// testável.

/** Argumento que o Windows passa ao abrir o app no login: começa na bandeja. */
export const ARG_NA_BANDEJA = '--na-bandeja'

export type PreferenciasDaCasca = {
  /** A casca já ligou o "abrir com o computador" de fábrica, ou a pessoa já escolheu. */
  inicioDecidido?: boolean
}

/** Só Windows e macOS sabem abrir um app no login (no Linux a API do Electron não faz nada). */
export function inicioSuportado(plataforma: string, empacotado: boolean): boolean {
  return empacotado && (plataforma === 'win32' || plataforma === 'darwin')
}

/**
 * Liga de fábrica UMA vez: na primeira abertura da versão que traz o recurso.
 * Quem desligou depois não é religado por atualização, porque a escolha fica
 * gravada em `inicioDecidido`.
 */
export function deveLigarDeFabrica(
  preferencias: PreferenciasDaCasca,
  plataforma: string,
  empacotado: boolean,
): boolean {
  return inicioSuportado(plataforma, empacotado) && !preferencias.inicioDecidido
}

/**
 * As opções do `app.setLoginItemSettings`. No Windows o item de login guarda o
 * caminho E os argumentos: a consulta (`getLoginItemSettings`) precisa dos
 * mesmos `args`, senão responde desligado.
 */
export function opcoesDoInicio(ligado: boolean): {
  openAtLogin: boolean
  openAsHidden: boolean
  args: string[]
} {
  return { openAtLogin: ligado, openAsHidden: true, args: [ARG_NA_BANDEJA] }
}

/** O app abriu pelo login do computador: a janela fica na bandeja, o site carrega e o ramal registra. */
export function comecaNaBandeja(argv: readonly string[], abriuNoLoginDoMac: boolean): boolean {
  return argv.includes(ARG_NA_BANDEJA) || abriuNoLoginDoMac
}
