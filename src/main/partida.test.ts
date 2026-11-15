import { describe, expect, it } from 'vitest'
import {
  ARG_NA_BANDEJA,
  comecaNaBandeja,
  deveLigarDeFabrica,
  inicioSuportado,
  opcoesDoInicio,
} from './partida'

describe('inicioSuportado (#37265)', () => {
  it('Windows e macOS empacotados sabem abrir no login', () => {
    expect(inicioSuportado('win32', true)).toBe(true)
    expect(inicioSuportado('darwin', true)).toBe(true)
  })
  it('Linux e o modo de desenvolvimento não', () => {
    expect(inicioSuportado('linux', true)).toBe(false)
    expect(inicioSuportado('win32', false)).toBe(false)
  })
})

describe('deveLigarDeFabrica (#37265)', () => {
  it('liga na primeira abertura da versão nova', () => {
    expect(deveLigarDeFabrica({}, 'win32', true)).toBe(true)
  })
  it('quem já decidiu (ou já foi ligado uma vez) não é religado', () => {
    expect(deveLigarDeFabrica({ inicioDecidido: true }, 'win32', true)).toBe(false)
  })
  it('não liga onde o sistema não suporta', () => {
    expect(deveLigarDeFabrica({}, 'linux', true)).toBe(false)
    expect(deveLigarDeFabrica({}, 'win32', false)).toBe(false)
  })
})

describe('opcoesDoInicio (#37265)', () => {
  it('grava e consulta com o mesmo argumento da bandeja', () => {
    expect(opcoesDoInicio(true)).toEqual({ openAtLogin: true, openAsHidden: true, args: [ARG_NA_BANDEJA] })
    expect(opcoesDoInicio(false).openAtLogin).toBe(false)
    expect(opcoesDoInicio(false).args).toEqual([ARG_NA_BANDEJA])
  })
})

describe('comecaNaBandeja (#37265)', () => {
  it('aberto pelo login do Windows começa escondido', () => {
    expect(comecaNaBandeja(['Infinity.exe', ARG_NA_BANDEJA], false)).toBe(true)
  })
  it('aberto pelo login do macOS começa escondido', () => {
    expect(comecaNaBandeja(['Infinity'], true)).toBe(true)
  })
  it('aberto pela pessoa (atalho ou link) mostra a janela', () => {
    expect(comecaNaBandeja(['Infinity.exe'], false)).toBe(false)
    expect(comecaNaBandeja(['Infinity.exe', 'infinity://chat/1'], false)).toBe(false)
  })
})
