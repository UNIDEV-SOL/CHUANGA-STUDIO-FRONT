import { apiClient } from "./httpClient";

/** PDF de um endpoint autenticado (o token vai no header, por isso não basta um <a href>). */
export async function obterPdf(url: string) {
  const res = await apiClient.get<Blob>(url, { responseType: "blob" });
  return res.data;
}

export function guardarFicheiro(blob: Blob, nomeFicheiro: string) {
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = nomeFicheiro;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 10_000);
}

export async function descarregarPdf(url: string, nomeFicheiro: string) {
  guardarFicheiro(await obterPdf(url), nomeFicheiro);
}

/**
 * Abre o menu "Partilhar" do sistema com o PDF anexado (WhatsApp, Mail, ...).
 * Só existe em contexto seguro (https ou localhost) e em browsers que partilham ficheiros.
 * Devolve false quando não é possível, para o chamador usar outra via.
 */
export async function partilharPdf(blob: Blob, nomeFicheiro: string, texto: string) {
  const ficheiro = new File([blob], nomeFicheiro, { type: "application/pdf" });
  if (!navigator.canShare?.({ files: [ficheiro] })) return false;
  try {
    await navigator.share({ files: [ficheiro], text: texto });
  } catch (e) {
    // Fechar o menu sem escolher nada não é erro.
    if ((e as Error).name !== "AbortError") throw e;
  }
  return true;
}

export const nomeFicheiroFatura = (numero: string) => `Fatura-${numero.replace(/[^A-Za-z0-9]+/g, "-")}.pdf`;
