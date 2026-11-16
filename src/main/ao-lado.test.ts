import { mkdtemp, readFile, readdir, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { caminhoLivre, nomeSeguro, salvarAoLado } from './ao-lado'

describe('nomeSeguro', () => {
  it.each(['foto.png', 'Relatório final.pdf', 'foto (2).jpg', 'audio.mp3', 'pacote.tar'])(
    'aceita %s',
    (nome) => expect(nomeSeguro(nome)).toBe(nome),
  )

  it.each([
    ['caminho relativo', '../foto.png'],
    ['pasta', 'sub/foto.png'],
    ['barra do Windows', 'sub\\foto.png'],
    ['unidade', 'C:foto.png'],
    ['executável', 'foto.exe'],
    ['atalho', 'foto.lnk'],
    ['script', 'foto.png.bat'],
    ['sem extensão', 'foto'],
    ['oculto', '.bashrc.txt'],
    ['ponto no fim', 'foto.png.'],
    ['nome reservado', 'CON.png'],
    ['vazio', '   '],
    ['não texto', 42],
  ])('recusa %s', (_caso, nome) => expect(nomeSeguro(nome)).toBeNull())
})

describe('caminhoLivre', () => {
  it('numera quando o nome já existe', async () => {
    const ocupados = new Set(['/p/foto.png', '/p/foto (2).png'])
    expect(await caminhoLivre('/p', 'foto.png', async (c) => ocupados.has(c))).toBe('/p/foto (3).png')
  })
})

describe('salvarAoLado', () => {
  let pasta: string
  beforeEach(async () => {
    pasta = await mkdtemp(join(tmpdir(), 'ao-lado-'))
  })
  afterEach(() => rm(pasta, { recursive: true, force: true }))

  it('grava ao lado do original, sem sobrescrever, e guarda o que gravou', async () => {
    const original = join(pasta, 'foto.heic')
    await writeFile(original, 'heic')
    await writeFile(join(pasta, 'foto.png'), 'antigo')
    const gravados = new Set<string>()

    const r = await salvarAoLado(original, 'foto.png', new TextEncoder().encode('png').buffer, gravados)

    expect(r).toEqual({ ok: true, caminho: join(pasta, 'foto (2).png'), nome: 'foto (2).png' })
    expect(await readFile(join(pasta, 'foto (2).png'), 'utf8')).toBe('png')
    expect(await readFile(join(pasta, 'foto.png'), 'utf8')).toBe('antigo')
    expect([...gravados]).toEqual([join(pasta, 'foto (2).png')])
  })

  it.each([
    ['original que não existe', () => join(pasta, 'nao-existe.heic'), 'foto.png', 'original'],
    ['original que é pasta', () => pasta, 'foto.png', 'original'],
    ['caminho relativo', () => 'foto.heic', 'foto.png', 'original'],
    ['nome de executável', () => join(pasta, 'foto.heic'), 'foto.exe', 'nome'],
    ['nome que sai da pasta', () => join(pasta, 'foto.heic'), '../foto.png', 'nome'],
  ])('recusa %s', async (_caso, original, nome, motivo) => {
    await writeFile(join(pasta, 'foto.heic'), 'heic')
    const gravados = new Set<string>()
    const r = await salvarAoLado(original(), nome, new ArrayBuffer(3), gravados)
    expect(r).toEqual({ ok: false, motivo })
    expect(gravados.size).toBe(0)
    expect(await readdir(pasta)).toEqual(['foto.heic'])
  })

  it('recusa bytes vazios', async () => {
    const original = join(pasta, 'foto.heic')
    await writeFile(original, 'heic')
    expect(await salvarAoLado(original, 'foto.png', new ArrayBuffer(0), new Set())).toEqual({
      ok: false,
      motivo: 'tamanho',
    })
  })
})
