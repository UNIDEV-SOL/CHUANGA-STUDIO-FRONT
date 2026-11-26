/** Morada escolhida nos formulários (ids em texto, como os Select devolvem). */
export interface Morada {
  provinciaId: string;
  distritoId: string;
}

/** Para enviar à API: ids numéricos ou nada. */
export const moradaParaApi = (m: Morada) => ({
  ...(m.provinciaId ? { provinciaId: Number(m.provinciaId) } : {}),
  ...(m.distritoId ? { distritoId: Number(m.distritoId) } : {}),
});
