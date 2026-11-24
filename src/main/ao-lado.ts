import { stat, writeFile } from 'fs/promises'
import { basename, dirname, extname, isAbsolute, join } from 'path'

// O conversor no app do computador: o arquivo
// solto na janela vem de uma pasta do PC, o site converte pelo storage e a
// casca grava o novo AO LADO do original. Quem diz a pasta é o preload
// (webUtils.getPathForFile do arquivo solto); aqui o main só grava se o
// original existe, o nome é só um nome e a extensão é uma das que o conversor
// devolve. Nunca sobrescreve: "foto.png" vira "foto (2).png".

/** O que o conversor do storage devolve (formatos, ferramentas e compactados). */
export const EXTENSOES_DO_CONVERSOR = new Set([
  'png', 'jpg', 'jpeg', 'webp', 'tiff', 'gif',
  'pdf', 'docx', 'txt',
  'mp4', 'mov', 'mkv',
  'm4a', 'mp3', 'wav', 'flac',
  'zip', 'tar', 'gz', 'gzip',
])

/** Teto do que a casca grava de uma vez (o anexo entra com até 50 MB; o vídeo pode crescer). */
export const TETO_AO_LADO = 500 * 1024 * 1024

export type ResultadoAoLado =
  | { ok: true; caminho: string; nome: string }
  | { ok: false; motivo: 'original' | 'nome' | 'tamanho' | 'gravar' }

/** O nome que o site mandou, se for só um nome de arquivo com extensão do conversor. */
export function nomeSeguro(nome: unknown): string | null {
  if (typeof nome !== 'string') return null
  const limpo = nome.trim()
  if (!limpo || limpo.length > 200) return null
  if (/[\\/:*?"<>|\u0000-\u001f]/.test(limpo)) return null
  if (limpo.startsWith('.') || limpo.endsWith('.') || limpo.endsWith(' ')) return null
  if (basename(limpo) !== limpo) return null
  const extensao = extname(limpo).slice(1).toLowerCase()
  if (!EXTENSOES_DO_CONVERSOR.has(extensao)) return null
  // Nome reservado do Windows (CON, NUL, COM1…): grava em lugar nenhum.
  if (/^(con|prn|aux|nul|com\d|lpt\d)$/i.test(limpo.split('.')[0].trim())) {
    return null
  }
  return limpo
}

/** "foto.png", e se já houver, "foto (2).png", "foto (3).png"… */
export async function caminhoLivre(
  pasta: string,
  nome: string,
  existe: (caminho: string) => Promise<boolean>,
): Promise<string | null> {
  const extensao = extname(nome)
  const base = nome.slice(0, nome.length - extensao.length)
  for (let n = 1; n <= 100; n++) {
    const candidato = join(pasta, n === 1 ? nome : `${base} (${n})${extensao}`)
    if (!(await existe(candidato))) return candidato
  }
  return null
}

const existeNoDisco = (caminho: string) =>
  stat(caminho).then(
    () => true,
    () => false,
  )

/** Grava o convertido ao lado do original. `gravados` guarda o que a casca escreveu (o "Mostrar na pasta" só abre esses). */
export async function salvarAoLado(
  original: unknown,
  nome: unknown,
  bytes: unknown,
  gravados: Set<string>,
): Promise<ResultadoAoLado> {
  if (typeof original !== 'string' || !isAbsolute(original)) return { ok: false, motivo: 'original' }
  const doOriginal = await stat(original).catch(() => null)
  if (!doOriginal?.isFile()) return { ok: false, motivo: 'original' }
  const seguro = nomeSeguro(nome)
  if (!seguro) return { ok: false, motivo: 'nome' }
  if (!(bytes instanceof ArrayBuffer) && !ArrayBuffer.isView(bytes)) return { ok: false, motivo: 'tamanho' }
  const tamanho = bytes.byteLength
  if (tamanho === 0 || tamanho > TETO_AO_LADO) return { ok: false, motivo: 'tamanho' }

  const destino = await caminhoLivre(dirname(original), seguro, existeNoDisco)
  if (!destino) return { ok: false, motivo: 'gravar' }
  const conteudo = ArrayBuffer.isView(bytes)
    ? Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength)
    : Buffer.from(bytes)
  try {
    // 'wx': se outro arquivo nasceu ali entre a conta e a gravação, falha em vez de sobrescrever.
    await writeFile(destino, conteudo, { flag: 'wx' })
  } catch {
    return { ok: false, motivo: 'gravar' }
  }
  gravados.add(destino)
  return { ok: true, caminho: destino, nome: basename(destino) }
}
