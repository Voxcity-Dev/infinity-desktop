// O aviso de chamada do sistema (Card VoxPlan #37265): no Windows é o toast de
// chamada recebida, o mesmo tipo do Teams, que fica na tela enquanto toca e tem
// Atender e Recusar. Os botões voltam ao app por infinity://chamada/<ação>
// (second-instance), então funcionam com a janela escondida na bandeja.

export type AvisoDeChamada = {
  titulo: string
  de: string
  atender: string
  recusar: string
}

const LIMITE = 200

function texto(valor: unknown, padrao: string): string {
  return typeof valor === 'string' && valor.trim() ? valor.trim().slice(0, LIMITE) : padrao
}

/** O que vem do site pela ponte, com padrão em português se faltar algo. */
export function normalizarAviso(bruto: unknown): AvisoDeChamada {
  const a = (bruto ?? {}) as Record<string, unknown>
  return {
    titulo: texto(a.titulo, 'Chamada recebida'),
    de: texto(a.de, 'Número desconhecido'),
    atender: texto(a.atender, 'Atender'),
    recusar: texto(a.recusar, 'Recusar'),
  }
}

function xml(valor: string): string {
  return valor
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export const LINK_ATENDER = 'infinity://chamada/atender'
export const LINK_RECUSAR = 'infinity://chamada/recusar'
export const LINK_ABRIR = 'infinity://chamada/abrir'

/**
 * O XML do toast do Windows. `scenario="incomingCall"` deixa o aviso na tela
 * até a pessoa agir (ou a casca fechar quando a chamada acaba) e põe os botões
 * grandes. Sem som: o site já toca o toque do Infinity.
 */
export function montarToastDeChamada(aviso: AvisoDeChamada): string {
  return [
    `<toast scenario="incomingCall" launch="${LINK_ABRIR}" activationType="protocol">`,
    '<visual><binding template="ToastGeneric">',
    `<text>${xml(aviso.titulo)}</text>`,
    `<text>${xml(aviso.de)}</text>`,
    '</binding></visual>',
    '<actions>',
    `<action content="${xml(aviso.atender)}" arguments="${LINK_ATENDER}" activationType="protocol"/>`,
    `<action content="${xml(aviso.recusar)}" arguments="${LINK_RECUSAR}" activationType="protocol"/>`,
    '</actions>',
    '<audio silent="true"/>',
    '</toast>',
  ].join('')
}
