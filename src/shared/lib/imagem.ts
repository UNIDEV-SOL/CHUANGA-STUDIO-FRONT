import { apiClient } from "@/shared/api/httpClient";

/**
 * Reduz uma foto no browser (canvas) antes de a enviar: fotos de telemóvel têm 3–8 MB,
 * reduzidas ficam com ~200–400 KB sem perda visível na galeria.
 */
export async function redimensionar(ficheiro: File, maxLado: number, qualidade: number) {
  const bitmap = await createImageBitmap(ficheiro);
  const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height));
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);
  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("O browser não conseguiu processar a imagem.");
  ctx.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close();
  const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", qualidade));
  if (!blob) throw new Error("Não foi possível converter a imagem.");
  return { blob, largura, altura };
}

/** Os caminhos de imagem vêm da API como /api/...; no site precisam do host da API. */
export const urlDaApi = (caminho: string) => `${apiClient.defaults.baseURL ?? ""}${caminho}`;

/** Prepara uma foto para a galeria: versão grande (1600 px) e miniatura (600 px), em JPEG. */
export async function prepararFoto(ficheiro: File) {
  if (!ficheiro.type.startsWith("image/")) throw new Error(`${ficheiro.name} não é uma imagem.`);
  if (ficheiro.size > 15 * 1024 * 1024) throw new Error(`${ficheiro.name} tem mais de 15 MB.`);
  const grande = await redimensionar(ficheiro, 1600, 0.82);
  const mini = await redimensionar(ficheiro, 600, 0.75);
  const dados = new FormData();
  dados.append("imagem", grande.blob, "foto.jpg");
  dados.append("miniatura", mini.blob, "miniatura.jpg");
  dados.append("largura", String(grande.largura));
  dados.append("altura", String(grande.altura));
  return dados;
}

/** Título sugerido a partir do nome do ficheiro ("unhas-noiva_2.jpg" → "unhas noiva 2"). */
export const tituloDoFicheiro = (nome: string) => nome.replace(/\.\w+$/, "").replace(/[-_]+/g, " ").trim();
