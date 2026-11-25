import { describe, expect, it } from 'vitest'
import {
  decidirNavegacao,
  ehAnexoDoChat,
  ehDoApp,
  interpretarDeepLink,
  frontCarregadoDepois,
  linkNoArgv,
  podeEntregarLink,
  podeAbrirFora,
  ehLinkDoRemote,
  resolverEnderecoDoApp,
} from './navegacao'

const APP = 'https://infinity.voxcity.com.br'

describe('resolverEnderecoDoApp', () => {
  it('usa o site de produção quando não há override', () => {
    expect(resolverEnderecoDoApp({ dev: false })).toBe(APP)
  })

  it('usa o Vite do front em dev', () => {
    expect(resolverEnderecoDoApp({ dev: true })).toBe('http://localhost:5173')
  })

  it('aceita override https sem a barra final', () => {
    expect(resolverEnderecoDoApp({ dev: false, override: 'https://homolog.voxcity.com.br/' })).toBe(
      'https://homolog.voxcity.com.br',
    )
  })

  it('recusa override http fora de localhost', () => {
    expect(resolverEnderecoDoApp({ dev: false, override: 'http://evil.com' })).toBe(APP)
  })

  it('recusa override que não é URL', () => {
    expect(resolverEnderecoDoApp({ dev: false, override: 'nada' })).toBe(APP)
  })
})

describe('ehDoApp', () => {
  it.each([
    [`${APP}/login`, true],
    [`${APP}`, true],
    ['https://infinity.voxcity.com.br.evil.com/', false],
    ['https://evil.com/?infinity.voxcity.com.br', false],
    ['http://infinity.voxcity.com.br/', false],
    ['file:///tmp/x.html', false],
    ['lixo', false],
  ])('%s → %s', (url, esperado) => {
    expect(ehDoApp(url, APP)).toBe(esperado)
  })
})

describe('decidirNavegacao', () => {
  it.each([
    [`${APP}/tela-operacao/chat`, true],
    ['https://api-gateway.voxcity.com.br/core/auth/entra/callback?code=1', true],
    ['https://bucket.voxcity.com.br/arquivo-enviado.html', false],
    ['https://suporte.voxcity.com.br/', false],
    ['https://evil-voxcity.com.br/', false],
    ['http://api-gateway.voxcity.com.br/', false],
    ['https://www.google.com/', false],
    ['https://adfs.prefeitura.sc.gov.br/adfs/ls', false],
  ])('fora do login: %s → %s', (url, permitir) => {
    expect(decidirNavegacao(url, APP, false)).toEqual({ permitir, emLogin: false })
  })

  it.each([
    'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?x=1',
    'https://device.login.microsoftonline.com/',
    'https://passwordreset.microsoftonline.com/',
    'https://login.windows.net/common/oauth2/authorize',
    'https://login.live.com/oauth20_authorize.srf',
    'https://mysignins.microsoft.com/register',
  ])('host de login da Microsoft entra no modo login: %s', (url) => {
    expect(decidirNavegacao(url, APP, false)).toEqual({ permitir: true, emLogin: true })
  })

  it('no modo login, o ADFS da empresa passa', () => {
    expect(decidirNavegacao('https://adfs.prefeitura.sc.gov.br/adfs/ls', APP, true)).toEqual({
      permitir: true,
      emLogin: true,
    })
  })

  it('no modo login, http continua barrado', () => {
    expect(decidirNavegacao('http://adfs.prefeitura.sc.gov.br/', APP, true)).toEqual({
      permitir: false,
      emLogin: true,
    })
  })

  it('a volta pela API mantém o modo login e a chegada ao site o encerra', () => {
    const api = decidirNavegacao('https://api-gateway.voxcity.com.br/core/auth/entra/callback', APP, true)
    expect(api).toEqual({ permitir: true, emLogin: true })
    expect(decidirNavegacao(`${APP}/login?sso=ok`, APP, api.emLogin)).toEqual({
      permitir: true,
      emLogin: false,
    })
  })

  it('o Google não entra no modo login: vai ao navegador do sistema (#34766)', () => {
    expect(decidirNavegacao('https://accounts.google.com/o/oauth2/v2/auth?x=1', APP, false)).toEqual({
      permitir: false,
      emLogin: false,
    })
  })

  it('o login da Microsoft não é sufixo solto (microsoftonline.com.evil.com)', () => {
    expect(decidirNavegacao('https://login.microsoftonline.com.evil.com/', APP, false).permitir).toBe(false)
  })
})

describe('podeAbrirFora', () => {
  it.each([
    ['https://www.google.com/', true],
    ['http://exemplo.com.br/', true],
    ['mailto:a@b.com', true],
    ['file:///C:/Windows/System32/calc.exe', false],
    ['javascript:alert(1)', false],
    ['smb://servidor/pasta', false],
    ['ms-msdt:/id', false],
  ])('%s → %s', (url, esperado) => {
    expect(podeAbrirFora(url)).toBe(esperado)
  })
})

describe('ehLinkDoRemote', () => {
  const UUID = '3f2b8c1e-9a4d-4e6f-8b2a-1c3d5e7f9a0b'
  const TOKEN = `ric_${'a'.repeat(43)}`
  it.each([
    [`infinity-remote://connect/${UUID}`, true],
    [`infinity-remote://convite/${TOKEN}`, true],
    [`infinity-remote://connect/${UUID}?password=123`, false],
    [`infinity-remote://config/${UUID}`, false],
    ['infinity-remote://connect/nao-e-uuid', false],
    [`infinity-remote://convite/${TOKEN}x`, false],
    [`rustdesk://connect/${UUID}`, false],
    [`https://infinity.voxcity.com.br/r/${TOKEN}`, false],
  ])('%s → %s', (url, esperado) => {
    expect(ehLinkDoRemote(url)).toBe(esperado)
  })

  it('não entra no que a casca manda para fora sozinha', () => {
    expect(podeAbrirFora(`infinity-remote://connect/${UUID}`)).toBe(false)
  })
})

describe('interpretarDeepLink', () => {
  it('chat vira a tela de operação na conversa', () => {
    expect(interpretarDeepLink('infinity://chat/abc-123')).toEqual({
      tipo: 'rota',
      rota: '/tela-operacao/chat?id=abc-123',
    })
  })

  it('call vira discagem só com dígitos e símbolos de discagem', () => {
    expect(interpretarDeepLink('infinity://call/+55 (11) 9999-0000')).toEqual({
      tipo: 'discar',
      numero: '+551199990000',
    })
  })

  it('call sem número é ignorado', () => {
    expect(interpretarDeepLink('infinity://call/abc')).toBeNull()
  })

  it('dashboard vira /dashboard', () => {
    expect(interpretarDeepLink('infinity://dashboard/')).toEqual({ tipo: 'rota', rota: '/dashboard' })
  })

  it('caminho qualquer leva a query junto (#32894)', () => {
    expect(interpretarDeepLink('infinity://usuarios?pendencias=42')).toEqual({
      tipo: 'rota',
      rota: '/usuarios?pendencias=42',
    })
  })

  it('volta do login Google pelo navegador do sistema (#34766)', () => {
    expect(interpretarDeepLink('infinity://login?sso_desktop=AbC_-123')).toEqual({
      tipo: 'rota',
      rota: '/login?sso_desktop=AbC_-123',
    })
    expect(interpretarDeepLink('infinity://login?sso_error=sso_failed')).toEqual({
      tipo: 'rota',
      rota: '/login?sso_error=sso_failed',
    })
  })

  it('outro esquema é ignorado', () => {
    expect(interpretarDeepLink('https://infinity.voxcity.com.br/x')).toBeNull()
  })

  it('URL inválida é ignorada', () => {
    expect(interpretarDeepLink('infinity://')).toBeNull()
    expect(interpretarDeepLink('lixo')).toBeNull()
  })

  it('a rota nunca sai do app (//host vira caminho)', () => {
    const r = interpretarDeepLink('infinity://x//evil.com')
    expect(r).toEqual({ tipo: 'rota', rota: '/x/evil.com' })
  })
})

describe('linkNoArgv (#34766)', () => {
  it('acha o link que abriu o app no argv do Windows', () => {
    expect(
      linkNoArgv(['C:\\Infinity\\Infinity.exe', '--allow-file-access', 'infinity://login?sso_desktop=abc']),
    ).toBe('infinity://login?sso_desktop=abc')
  })

  it('sem link, nada', () => {
    expect(linkNoArgv(['/opt/Infinity/infinity', '--no-sandbox'])).toBeNull()
  })
})

describe('podeEntregarLink (#34766)', () => {
  const base = { frontCarregado: true, urlAtual: `${APP}/login`, enderecoDoApp: APP }

  it('tela do site carregada: entrega já', () => {
    expect(podeEntregarLink(base)).toBe(true)
  })

  it('quadro principal ainda carregando: fica pendente', () => {
    expect(podeEntregarLink({ ...base, frontCarregado: false })).toBe(false)
  })

  it('página "sem conexão" (fora do site): fica pendente', () => {
    expect(podeEntregarLink({ ...base, urlAtual: 'file:///app/out/renderer/index.html?volta=x' })).toBe(false)
  })

  it('janela no login da Microsoft: fica pendente até voltar ao site', () => {
    expect(podeEntregarLink({ ...base, urlAtual: 'https://login.microsoftonline.com/x' })).toBe(false)
  })
})

describe('frontCarregadoDepois (#34766)', () => {
  it('carregamento normal: navega (zera) e termina de carregar (liga)', () => {
    let pronto = frontCarregadoDepois(true, 'did-start-navigation')
    pronto = frontCarregadoDepois(pronto, 'did-navigate')
    expect(pronto).toBe(false)
    expect(frontCarregadoDepois(pronto, 'did-finish-load')).toBe(true)
  })

  it('navegação cancelada pela casca (mailto:, tel:, link externo) não segura o link', () => {
    // Só chega o did-start-navigation; não vem did-navigate nem did-finish-load.
    expect(frontCarregadoDepois(true, 'did-start-navigation')).toBe(true)
  })
})

describe('ehAnexoDoChat (Card VoxPlan #36028)', () => {
  const ID = '0f1e0000-0000-4000-8000-000000000006'

  it('o anexo do chat no site do app abre em janela do app', () => {
    expect(ehAnexoDoChat(`${APP}/chat/anexo/${ID}`, APP)).toBe(true)
  })

  it.each([
    ['outro site com o mesmo caminho', `https://outro.com/chat/anexo/${ID}`],
    ['outra rota do app', `${APP}/tela-operacao/chat`],
    ['id que não é uuid', `${APP}/chat/anexo/local-1`],
    ['algo abaixo do id', `${APP}/chat/anexo/${ID}/x`],
    ['a mídia da mensageria', `https://api-gateway.voxcity.com.br/mensageria/midia/x/contrato.pdf`],
    ['lixo', 'nao é url'],
  ])('%s: não', (_, url) => {
    expect(ehAnexoDoChat(url, APP)).toBe(false)
  })
})
