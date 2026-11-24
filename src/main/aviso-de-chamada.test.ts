import { describe, expect, it } from 'vitest'
import {
  LINK_ABRIR,
  LINK_ATENDER,
  LINK_RECUSAR,
  montarToastDeChamada,
  normalizarAviso,
} from './aviso-de-chamada'
import { interpretarDeepLink } from './navegacao'

describe('normalizarAviso (#37265)', () => {
  it('usa o que o site mandou', () => {
    expect(
      normalizarAviso({ titulo: 'Incoming call', de: 'Ana · 4002', atender: 'Answer', recusar: 'Decline' }),
    ).toEqual({ titulo: 'Incoming call', de: 'Ana · 4002', atender: 'Answer', recusar: 'Decline' })
  })
  it('cai no português quando falta campo ou vem lixo', () => {
    expect(normalizarAviso(undefined)).toEqual({
      titulo: 'Chamada recebida',
      de: 'Número desconhecido',
      atender: 'Atender',
      recusar: 'Recusar',
    })
    expect(normalizarAviso({ de: 42, titulo: '   ' }).de).toBe('Número desconhecido')
  })
  it('corta texto comprido', () => {
    expect(normalizarAviso({ de: 'x'.repeat(500) }).de).toHaveLength(200)
  })
})

describe('montarToastDeChamada (#37265)', () => {
  const aviso = normalizarAviso({ de: 'Ana' })

  it('é um toast de chamada recebida, sem som, com Atender e Recusar', () => {
    const toast = montarToastDeChamada(aviso, 'f1')
    expect(toast).toContain('scenario="incomingCall"')
    expect(toast).toContain('<audio silent="true"/>')
    expect(toast).toContain(`content="Atender" arguments="${LINK_ATENDER}?f=f1" activationType="protocol"`)
    expect(toast).toContain(`content="Recusar" arguments="${LINK_RECUSAR}?f=f1" activationType="protocol"`)
    expect(toast).toContain(`launch="${LINK_ABRIR}?f=f1"`)
  })

  it('o nome de quem liga não quebra o XML', () => {
    const toast = montarToastDeChamada(normalizarAviso({ de: `<b>"Zé" & Cia's</b>` }), 'f1')
    expect(toast).toContain('<text>&lt;b&gt;&quot;Zé&quot; &amp; Cia&apos;s&lt;/b&gt;</text>')
    expect(toast).not.toContain('<b>')
  })

  it('os links dos botões voltam ao app como ação de chamada', () => {
    expect(interpretarDeepLink(LINK_ATENDER)).toEqual({ tipo: 'chamada', acao: 'atender' })
    expect(interpretarDeepLink(LINK_RECUSAR)).toEqual({ tipo: 'chamada', acao: 'recusar' })
    expect(interpretarDeepLink(LINK_ABRIR)).toEqual({ tipo: 'chamada', acao: 'abrir' })
  })

  it('a ficha do aviso volta junto com a ação (sem ela a casca não atende nem recusa)', () => {
    expect(interpretarDeepLink(`${LINK_ATENDER}?f=f1`)).toEqual({ tipo: 'chamada', acao: 'atender', ficha: 'f1' })
    expect(interpretarDeepLink(`${LINK_RECUSAR}?f=f1`)).toEqual({ tipo: 'chamada', acao: 'recusar', ficha: 'f1' })
  })

  it('ação desconhecida não vira rota nem chamada', () => {
    expect(interpretarDeepLink('infinity://chamada/apagar')).toBeNull()
  })
})
