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
    const toast = montarToastDeChamada(aviso)
    expect(toast).toContain('scenario="incomingCall"')
    expect(toast).toContain('<audio silent="true"/>')
    expect(toast).toContain(`content="Atender" arguments="${LINK_ATENDER}" activationType="protocol"`)
    expect(toast).toContain(`content="Recusar" arguments="${LINK_RECUSAR}" activationType="protocol"`)
    expect(toast).toContain(`launch="${LINK_ABRIR}"`)
  })

  it('o nome de quem liga não quebra o XML', () => {
    const toast = montarToastDeChamada(normalizarAviso({ de: `<b>"Zé" & Cia's</b>` }))
    expect(toast).toContain('<text>&lt;b&gt;&quot;Zé&quot; &amp; Cia&apos;s&lt;/b&gt;</text>')
    expect(toast).not.toContain('<b>')
  })

  it('os links dos botões voltam ao app como ação de chamada', () => {
    expect(interpretarDeepLink(LINK_ATENDER)).toEqual({ tipo: 'chamada', acao: 'atender' })
    expect(interpretarDeepLink(LINK_RECUSAR)).toEqual({ tipo: 'chamada', acao: 'recusar' })
    expect(interpretarDeepLink(LINK_ABRIR)).toEqual({ tipo: 'chamada', acao: 'abrir' })
  })

  it('ação desconhecida não vira rota nem chamada', () => {
    expect(interpretarDeepLink('infinity://chamada/apagar')).toBeNull()
  })
})
