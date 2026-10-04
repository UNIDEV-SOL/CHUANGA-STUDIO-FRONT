import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiData } from "@/lib/httpClient";
import { useInfiniteList, type PageResponse } from "@/lib/pagination";
import type {
  ComunidadeItem, ContactoChat, Conversa, DetalhesChat, FavoritaChat, HistoricoChat, InfoMensagemChat, MensagemChat,
} from "@/types/api";

const BASE = "/api/chat";
const CONVERSAS = `${BASE}/conversas`;

async function get<T>(url: string, params?: Record<string, unknown>) {
  return extractApiData<T>((await apiClient.get(url, { params })).data);
}

export type FiltroConversas = "todas" | "nao-lidas" | "grupos" | "arquivadas";

/** Lista de conversas (paginada), atualizada de 5 em 5 s. */
export function useConversas(busca: string, filtro: FiltroConversas = "todas", enabled = true) {
  return useInfiniteList<Conversa>(CONVERSAS, { busca, filtro }, { enabled, refetchInterval: 5_000, size: 30 });
}

/** Uma conversa (quando não está na página carregada da lista, ex. aberta por link). */
export function useConversa(id: string | null) {
  return useQuery({
    queryKey: [CONVERSAS, "uma", id],
    queryFn: () => get<Conversa>(`${CONVERSAS}/${id}`),
    enabled: !!id,
    refetchInterval: 10_000,
  });
}

export function useDetalhesConversa(id: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [CONVERSAS, "detalhes", id],
    queryFn: () => get<DetalhesChat>(`${CONVERSAS}/${id}/detalhes`),
    enabled: !!id && enabled,
    refetchInterval: 15_000,
  });
}

export function useChatNaoLidas(enabled = true) {
  return useQuery({
    queryKey: [BASE, "nao-lidas"],
    queryFn: () => get<{ naoLidas: number }>(`${BASE}/nao-lidas`),
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
    enabled,
  });
}

export function useContactos(busca: string, enabled: boolean) {
  return useQuery({
    queryKey: [BASE, "contactos", busca],
    queryFn: () => get<ContactoChat[]>(`${BASE}/contactos`, { busca }),
    enabled,
  });
}

export function useComunidade(enabled: boolean) {
  return useQuery({
    queryKey: [BASE, "comunidade"],
    queryFn: () => get<ComunidadeItem[]>(`${BASE}/comunidade`),
    enabled,
    refetchInterval: 15_000,
  });
}

export function useFavoritas(conversaId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: [BASE, "favoritas", conversaId],
    queryFn: () => get<FavoritaChat[]>(`${BASE}/favoritas`, conversaId ? { conversa: conversaId } : undefined),
    enabled,
  });
}

export function useMidia(conversaId: string | null, tipo: "IMAGEM" | "DOCUMENTO", enabled: boolean) {
  return useQuery({
    queryKey: [BASE, "midia", conversaId, tipo],
    queryFn: () => get<PageResponse<MensagemChat>>(`${CONVERSAS}/${conversaId}/midia`, { tipo, size: 60 }),
    enabled: !!conversaId && enabled,
  });
}

export function usePesquisaMensagens(conversaId: string | null, q: string) {
  return useQuery({
    queryKey: [BASE, "pesquisa", conversaId, q],
    queryFn: () => get<PageResponse<MensagemChat>>(`${CONVERSAS}/${conversaId}/pesquisar`, { q, size: 50 }),
    enabled: !!conversaId && q.trim().length >= 2,
  });
}

export function useInfoMensagem(id: string | null) {
  return useQuery({
    queryKey: [BASE, "info", id],
    queryFn: () => get<InfoMensagemChat>(`${BASE}/mensagens/${id}/info`),
    enabled: !!id,
    refetchInterval: 5_000,
  });
}

const ordenar = (lista: MensagemChat[]) => [...lista].sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));

/** Junta mensagens por id (novas, editadas, apagadas ou com reações substituem a versão anterior). */
function juntar(atuais: MensagemChat[], novas: MensagemChat[]) {
  const mapa = new Map(atuais.map((m) => [m.id, m]));
  novas.forEach((m) => mapa.set(m.id, m));
  return ordenar([...mapa.values()]);
}

export interface EstadoConversa {
  lidaPorTodosAte: string | null;
  aEscrever: string[];
  online: boolean;
  vistoEm: string | null;
}

const ESTADO_VAZIO: EstadoConversa = { lidaPorTodosAte: null, aEscrever: [], online: false, vistoEm: null };

/**
 * Mensagens de uma conversa: carrega as mais recentes, sobe para as antigas a pedido, salta para uma mensagem
 * antiga (pesquisa/resposta/fixada) e, a cada 3 s, pede só o que mudou (com vistos, "a escrever" e presença).
 */
export function useMensagens(conversaId: string | null) {
  const queryClient = useQueryClient();
  const [mensagens, setMensagens] = useState<MensagemChat[]>([]);
  const [temMais, setTemMais] = useState(false);
  const [aCarregar, setACarregar] = useState(false);
  const [aCarregarAntigas, setACarregarAntigas] = useState(false);
  const [estado, setEstado] = useState<EstadoConversa>(ESTADO_VAZIO);
  const cursor = useRef<string | null>(null);

  const marcarLida = useCallback(async (id: string) => {
    await apiClient.put(`${CONVERSAS}/${id}/lida`);
    void queryClient.invalidateQueries({ queryKey: [BASE, "nao-lidas"] });
  }, [queryClient]);

  const aplicarEstado = (h: HistoricoChat) =>
    setEstado({ lidaPorTodosAte: h.lidaPorTodosAte, aEscrever: h.aEscrever ?? [], online: h.online, vistoEm: h.vistoEm });

  useEffect(() => {
    setMensagens([]);
    setTemMais(false);
    setEstado(ESTADO_VAZIO);
    cursor.current = null;
    if (!conversaId) return;
    let cancelado = false;
    setACarregar(true);
    get<HistoricoChat>(`${CONVERSAS}/${conversaId}/mensagens`)
      .then((h) => {
        if (cancelado) return;
        setMensagens(h.mensagens);
        setTemMais(h.temMais);
        aplicarEstado(h);
        cursor.current = h.cursor;
        void marcarLida(conversaId);
      })
      .catch(() => undefined)
      .finally(() => !cancelado && setACarregar(false));
    return () => { cancelado = true; };
  }, [conversaId, marcarLida]);

  useEffect(() => {
    if (!conversaId) return;
    const t = setInterval(async () => {
      if (!cursor.current || document.hidden) return;
      try {
        const h = await get<HistoricoChat>(`${CONVERSAS}/${conversaId}/sincronizar`, { desde: cursor.current });
        cursor.current = h.cursor;
        aplicarEstado(h);
        if (h.mensagens.length) {
          setMensagens((atuais) => juntar(atuais, h.mensagens));
          if (h.mensagens.some((m) => !m.minha)) void marcarLida(conversaId);
        }
      } catch {
        // falha pontual de rede: tenta outra vez no próximo ciclo
      }
    }, 3_000);
    return () => clearInterval(t);
  }, [conversaId, marcarLida]);

  const carregarAntigas = useCallback(async () => {
    if (!conversaId || !temMais || aCarregarAntigas || mensagens.length === 0) return;
    setACarregarAntigas(true);
    try {
      const h = await get<HistoricoChat>(`${CONVERSAS}/${conversaId}/mensagens`, { antes: mensagens[0].criadoEm });
      setMensagens((atuais) => juntar(atuais, h.mensagens));
      setTemMais(h.temMais);
    } finally {
      setACarregarAntigas(false);
    }
  }, [conversaId, temMais, aCarregarAntigas, mensagens]);

  /** Garante que a mensagem está carregada (carrega desde ela até agora, se for preciso). */
  const irPara = useCallback(async (mensagemId: string) => {
    if (!conversaId) return false;
    if (mensagens.some((m) => m.id === mensagemId)) return true;
    try {
      const h = await get<HistoricoChat>(`${CONVERSAS}/${conversaId}/mensagens`, { aPartirDe: mensagemId });
      setMensagens((atuais) => juntar(atuais, h.mensagens));
      setTemMais(h.temMais);
      return true;
    } catch {
      return false;
    }
  }, [conversaId, mensagens]);

  /** Aplica logo a resposta do servidor (sem esperar pela próxima sincronização). */
  const aplicar = useCallback((m: MensagemChat) => setMensagens((atuais) => juntar(atuais, [m])), []);
  const remover = useCallback((id: string, paraTodos: boolean) =>
    setMensagens((atuais) => paraTodos
      ? atuais.map((m) => (m.id === id ? { ...m, apagada: true, conteudo: null, temAnexo: false, podeEditarAte: null, podeApagarAte: null, reacoes: [] } : m))
      : atuais.filter((m) => m.id !== id)), []);

  return { mensagens, temMais, aCarregar, aCarregarAntigas, carregarAntigas, irPara, aplicar, remover, estado };
}

/** Invalida a lista de conversas e o que depende dela. */
function useAtualizarChat() {
  const queryClient = useQueryClient();
  return () => Promise.all([
    queryClient.invalidateQueries({ queryKey: [CONVERSAS] }),
    queryClient.invalidateQueries({ queryKey: [BASE, "comunidade"] }),
    queryClient.invalidateQueries({ queryKey: [BASE, "nao-lidas"] }),
  ]);
}

export function useEnviarMensagem() {
  const atualizar = useAtualizarChat();
  return useMutation({
    mutationFn: async ({ conversaId, texto, respostaA }: { conversaId: string; texto: string; respostaA?: string | null }) =>
      extractApiData<MensagemChat>((await apiClient.post(`${CONVERSAS}/${conversaId}/mensagens`, { texto, respostaA })).data),
    onSuccess: () => void atualizar(),
  });
}

/** Foto (rota "imagens") ou documento/voz (rota "ficheiros"). */
export function useEnviarAnexo() {
  const atualizar = useAtualizarChat();
  return useMutation({
    mutationFn: async ({ conversaId, dados, rota }: { conversaId: string; dados: FormData; rota: "imagens" | "ficheiros" }) =>
      extractApiData<MensagemChat>((await apiClient.post(`${CONVERSAS}/${conversaId}/${rota}`, dados, {
        headers: { "Content-Type": "multipart/form-data" },
      })).data),
    onSuccess: () => void atualizar(),
  });
}

export function useEditarMensagem() {
  return useMutation({
    mutationFn: async ({ id, texto }: { id: string; texto: string }) =>
      extractApiData<MensagemChat>((await apiClient.put(`${BASE}/mensagens/${id}`, { texto })).data),
  });
}

export function useApagarMensagem() {
  return useMutation({
    mutationFn: async ({ id, paraTodos }: { id: string; paraTodos: boolean }) => {
      await apiClient.delete(`${BASE}/mensagens/${id}`, { params: { paraTodos } });
    },
  });
}

export function useReagir() {
  return useMutation({
    mutationFn: async ({ id, emoji }: { id: string; emoji: string | null }) =>
      extractApiData<MensagemChat>((await apiClient.put(`${BASE}/mensagens/${id}/reacao`, { emoji })).data),
  });
}

export function useFavoritar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, favorita }: { id: string; favorita: boolean }) =>
      extractApiData<MensagemChat>((await apiClient.put(`${BASE}/mensagens/${id}/favorita`, { favorita })).data),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: [BASE, "favoritas"] }),
  });
}

export function useEncaminhar() {
  const atualizar = useAtualizarChat();
  return useMutation({
    mutationFn: async ({ id, conversas }: { id: string; conversas: string[] }) => {
      const res = await apiClient.post(`${BASE}/mensagens/${id}/encaminhar`, { conversas });
      return (res.data as { mensagem?: string }).mensagem ?? "Mensagem reencaminhada.";
    },
    onSuccess: () => void atualizar(),
  });
}

export function useFixarMensagem() {
  const atualizar = useAtualizarChat();
  return useMutation({
    mutationFn: async ({ conversaId, mensagemId }: { conversaId: string; mensagemId: string | null }) => {
      await apiClient.put(`${CONVERSAS}/${conversaId}/fixada`, { mensagemId });
    },
    onSuccess: () => void atualizar(),
  });
}

export function usePreferencias() {
  const atualizar = useAtualizarChat();
  return useMutation({
    mutationFn: async ({ id, ...p }: { id: string; fixada?: boolean; arquivada?: boolean; silenciada?: boolean }) => {
      await apiClient.patch(`${CONVERSAS}/${id}/preferencias`, p);
    },
    onSuccess: () => void atualizar(),
  });
}

/** Avisa que está a escrever (no máximo de 3 em 3 s). */
export function useAvisarAEscrever(conversaId: string | null) {
  const ultimo = useRef(0);
  return useCallback(() => {
    if (!conversaId || Date.now() - ultimo.current < 3_000) return;
    ultimo.current = Date.now();
    void apiClient.post(`${CONVERSAS}/${conversaId}/a-escrever`).catch(() => undefined);
  }, [conversaId]);
}

export function useAbrirConversaCom() {
  const atualizar = useAtualizarChat();
  return useMutation({
    mutationFn: async (usuarioId: string) =>
      extractApiData<{ id: string }>((await apiClient.post(`${CONVERSAS}/com/${usuarioId}`)).data).id,
    onSuccess: () => void atualizar(),
  });
}

export function useAbrirConversaComCliente() {
  return useMutation({
    mutationFn: async (clienteId: string) =>
      extractApiData<{ id: string }>((await apiClient.post(`${CONVERSAS}/cliente/${clienteId}`)).data).id,
  });
}

// --- Grupos ---

export function useCriarGrupo() {
  const atualizar = useAtualizarChat();
  return useMutation({
    mutationFn: async (dados: { titulo: string; descricao?: string; membros: string[]; comunidade?: boolean; aberto?: boolean; bloqueada?: boolean }) =>
      extractApiData<{ id: string }>((await apiClient.post(`${BASE}/grupos`, dados)).data).id,
    onSuccess: () => void atualizar(),
  });
}

export type AcaoGrupo =
  | { tipo: "atualizar"; dados: Partial<{ titulo: string; descricao: string; bloqueada: boolean; soAdminsEditam: boolean; aberto: boolean; comunidade: boolean }> }
  | { tipo: "foto"; imagem: Blob }
  | { tipo: "adicionar"; usuarios: string[] }
  | { tipo: "remover"; usuarioId: string }
  | { tipo: "admin"; usuarioId: string; admin: boolean }
  | { tipo: "sair" }
  | { tipo: "entrar" }
  | { tipo: "apagar" };

/** Ações de gestão de um grupo (ou sair de uma conversa direta); todas atualizam a lista e os detalhes. */
export function useGestaoGrupo(id: string | null) {
  const queryClient = useQueryClient();
  const atualizar = useAtualizarChat();
  const msg = (res: { data: unknown }) => (res.data as { mensagem?: string }).mensagem ?? "Feito.";
  return useMutation({
    mutationFn: async (acao: AcaoGrupo) => {
      switch (acao.tipo) {
        case "atualizar": return msg(await apiClient.patch(`${BASE}/grupos/${id}`, acao.dados));
        case "foto": {
          const f = new FormData();
          f.append("imagem", acao.imagem, "foto.jpg");
          return msg(await apiClient.put(`${BASE}/grupos/${id}/foto`, f, { headers: { "Content-Type": "multipart/form-data" } }));
        }
        case "adicionar": return msg(await apiClient.post(`${BASE}/grupos/${id}/membros`, { usuarios: acao.usuarios }));
        case "remover": return msg(await apiClient.delete(`${BASE}/grupos/${id}/membros/${acao.usuarioId}`));
        case "admin": return msg(await apiClient.patch(`${BASE}/grupos/${id}/membros/${acao.usuarioId}`, { admin: acao.admin }));
        case "sair": return msg(await apiClient.post(`${CONVERSAS}/${id}/sair`));
        case "entrar": return msg(await apiClient.post(`${BASE}/grupos/${id}/entrar`));
        case "apagar": return msg(await apiClient.delete(`${BASE}/grupos/${id}`));
      }
    },
    onSuccess: () => Promise.all([atualizar(), queryClient.invalidateQueries({ queryKey: [CONVERSAS, "detalhes", id] })]),
  });
}

// --- Ficheiros (o pedido leva o token, por isso não basta um <img src>) ---

export function useAnexoMensagem(mensagemId: string, ativa: boolean) {
  return useQuery({
    queryKey: [BASE, "anexo", mensagemId],
    queryFn: async () => URL.createObjectURL((await apiClient.get<Blob>(`${BASE}/mensagens/${mensagemId}/anexo`, { responseType: "blob" })).data),
    enabled: ativa,
    staleTime: Infinity,
  });
}

/** Foto do grupo; "versao" muda quando a foto muda (para não ficar a antiga em cache). */
export function useFotoConversa(conversaId: string, temFoto: boolean, versao?: string | null) {
  return useQuery({
    queryKey: [BASE, "foto", conversaId, versao],
    queryFn: async () => URL.createObjectURL((await apiClient.get<Blob>(`${CONVERSAS}/${conversaId}/foto`, { responseType: "blob" })).data),
    enabled: temFoto,
    staleTime: Infinity,
    retry: false,
  });
}

export async function descarregarAnexo(m: MensagemChat) {
  const res = await apiClient.get<Blob>(`${BASE}/mensagens/${m.id}/anexo`, { responseType: "blob" });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement("a");
  a.href = url;
  a.download = m.anexoNome ?? "ficheiro";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
