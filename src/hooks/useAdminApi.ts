import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient, extractApiData } from "@/lib/httpClient";
import { setSessionToken } from "@/lib/session";
import { API_ENDPOINTS } from "@/lib/apiEndpoints";
import { buscarPagina, buscarTudo, useInfiniteList, type Filtros } from "@/lib/pagination";
import type {
  ClienteDetalhe,
  ClienteResumo,
  ConfiguracaoHorario,
  Cotacao,
  EmitirFaturaRequest,
  EstatisticasAdmin,
  Fatura,
  GaleriaItem,
  HorarioDia,
  Marcacao,
  Profissional,
  RegistarPagamentoFaturaRequest,
  RelatorioCaixa,
  Notificacao,
  StatusMarcacao,
  Usuario,
} from "@/types/api";

// O painel mostra "Em tempo real": refaz o pedido periodicamente.
const LIVE = { refetchInterval: 30_000, refetchOnWindowFocus: true } as const;

async function get<T>(url: string) {
  const res = await apiClient.get(url);
  return extractApiData<T>(res.data);
}

export function useAdminEstatisticas() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.estatisticas],
    queryFn: () => get<EstatisticasAdmin>(API_ENDPOINTS.admin.estatisticas),
    ...LIVE,
  });
}

export function useAdminMarcacoesProximas() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.marcacoesProximas],
    queryFn: () => buscarTudo<Marcacao>(API_ENDPOINTS.admin.marcacoesProximas, {}, 10),
    ...LIVE,
  });
}

export function useAdminAtividadeRecente() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.atividadeRecente],
    queryFn: () => buscarTudo<Marcacao>(API_ENDPOINTS.admin.atividadeRecente, {}, 10),
    ...LIVE,
  });
}

// --- Listas paginadas (scroll infinito; filtros enviados à API) ---

export function useAdminClientes(filtros: Filtros = {}) {
  return useInfiniteList<ClienteResumo>(API_ENDPOINTS.admin.clientes, filtros);
}

export function useAdminMarcacoes(filtros: Filtros = {}) {
  return useInfiniteList<Marcacao>(API_ENDPOINTS.admin.marcacoes, filtros, { refetchInterval: LIVE.refetchInterval });
}

export function useAdminCotacoes(filtros: Filtros = {}) {
  return useInfiniteList<Cotacao>(API_ENDPOINTS.admin.cotacoes, filtros);
}

export function useAdminMarcacao(id: string | null) {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.marcacoes, "detalhe", id],
    queryFn: () => get<Marcacao>(`${API_ENDPOINTS.admin.marcacoes}/${id}`),
    enabled: !!id,
  });
}

/** Qualquer alteração a marcações afeta lista, dashboard e resumo de clientes. */
function useInvalidateAdmin() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      predicate: (q) => String(q.queryKey[0] ?? "").startsWith("/api/admin/"),
    });
}

export function useAdminAtualizarStatusMarcacao() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusMarcacao }) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.admin.marcacoes}/${id}/status`, { status });
      return extractApiData<Marcacao>(res.data);
    },
    onSuccess: invalidate,
  });
}

export function useAdminConfirmarPagamento() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.admin.marcacoes}/${id}/confirmar-pagamento`);
      return extractApiData<Marcacao>(res.data);
    },
    onSuccess: invalidate,
  });
}

export function useAdminEliminarMarcacao() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${API_ENDPOINTS.admin.marcacoes}/${id}`);
    },
    onSuccess: invalidate,
  });
}

export function useAdminAtualizarCotacao() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async ({ id, acao }: { id: string; acao: "respondido" | "arquivar" }) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.admin.cotacoes}/${id}/${acao}`);
      return extractApiData<Cotacao>(res.data);
    },
    onSuccess: invalidate,
  });
}

export function useAdminFaturas(filtros: Filtros = {}) {
  return useInfiniteList<Fatura>(API_ENDPOINTS.admin.faturas, filtros, { refetchInterval: LIVE.refetchInterval });
}

export function useAdminFatura(id: string | null) {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.faturas, "detalhe", id],
    queryFn: () => get<Fatura>(`${API_ENDPOINTS.admin.faturas}/${id}`),
    enabled: !!id,
  });
}

/** Fecho de conta na caixa: emite a fatura e conclui a marcação. */
export function useAdminEmitirFatura() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async ({ marcacaoId, ...payload }: EmitirFaturaRequest & { marcacaoId: string }) => {
      const res = await apiClient.post(`${API_ENDPOINTS.admin.marcacoes}/${marcacaoId}/fatura`, payload);
      return extractApiData<Fatura>(res.data);
    },
    onSuccess: invalidate,
  });
}

export function useAdminPagarFatura() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async ({ id, ...payload }: RegistarPagamentoFaturaRequest & { id: string }) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.admin.faturas}/${id}/pagar`, payload);
      return extractApiData<Fatura>(res.data);
    },
    onSuccess: invalidate,
  });
}

export function useAdminAnularFatura() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.admin.faturas}/${id}/anular`);
      return extractApiData<Fatura>(res.data);
    },
    onSuccess: invalidate,
  });
}

/** Reenvio manual (ex.: o cliente diz que não recebeu). Sem email vai para o da conta. */
export function useAdminReenviarFatura() {
  return useMutation({
    mutationFn: async ({ id, email }: { id: string; email?: string }) => {
      await apiClient.post(`${API_ENDPOINTS.admin.faturas}/${id}/reenviar`, email ? { email } : {});
    },
  });
}

export function useAdminHorario() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.horario],
    queryFn: () => get<ConfiguracaoHorario>(API_ENDPOINTS.admin.horario),
  });
}

/** Horário e dias fechados mudam as horas livres da reserva: invalida também a disponibilidade. */
function useInvalidateHorario() {
  const queryClient = useQueryClient();
  return (data: ConfiguracaoHorario) => {
    queryClient.setQueryData([API_ENDPOINTS.admin.horario], data);
    return queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.publico.disponibilidade] });
  };
}

export function useAdminGuardarHorario() {
  const onSuccess = useInvalidateHorario();
  return useMutation({
    mutationFn: async (semana: HorarioDia[]) => {
      const res = await apiClient.put(API_ENDPOINTS.admin.horario, { semana });
      return extractApiData<ConfiguracaoHorario>(res.data);
    },
    onSuccess,
  });
}

export function useAdminAdicionarDiaFechado() {
  const onSuccess = useInvalidateHorario();
  return useMutation({
    mutationFn: async (payload: { data: string; motivo?: string }) => {
      const res = await apiClient.post(API_ENDPOINTS.admin.diasFechados, payload);
      return extractApiData<ConfiguracaoHorario>(res.data);
    },
    onSuccess,
  });
}

export function useAdminRemoverDiaFechado() {
  const onSuccess = useInvalidateHorario();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.delete(`${API_ENDPOINTS.admin.diasFechados}/${id}`);
      return extractApiData<ConfiguracaoHorario>(res.data);
    },
    onSuccess,
  });
}

export function useAdminRemarcar() {
  const invalidate = useInvalidateAdmin();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data, hora }: { id: string; data: string; hora: string }) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.admin.marcacoes}/${id}/remarcar`, { data, hora });
      return extractApiData<Marcacao>(res.data);
    },
    onSuccess: () =>
      Promise.all([invalidate(), queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.publico.disponibilidade] })]),
  });
}

export function useAdminRelatorioCaixa(inicio: string, fim: string) {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.relatorioCaixa, inicio, fim],
    queryFn: () => get<RelatorioCaixa>(`${API_ENDPOINTS.admin.relatorioCaixa}?inicio=${inicio}&fim=${fim}`),
    enabled: !!inicio && !!fim && inicio <= fim,
  });
}

// --- Fase 3: equipa, ficha da cliente, utilizadores ---

export function useAdminProfissionais() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.profissionais],
    queryFn: () => buscarTudo<Profissional>(API_ENDPOINTS.admin.profissionais, {}, 100),
  });
}

/** Mudar a equipa muda a capacidade: invalida também a disponibilidade e a lista pública. */
function useInvalidateEquipa() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.profissionais] }),
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.publico.profissionais] }),
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.publico.disponibilidade] }),
    ]);
}

export function useAdminGuardarProfissional() {
  const onSuccess = useInvalidateEquipa();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id?: string; nome: string; telefone?: string | null; ativo: boolean; ordem: number }) => {
      const res = id
        ? await apiClient.put(`${API_ENDPOINTS.admin.profissionais}/${id}`, payload)
        : await apiClient.post(API_ENDPOINTS.admin.profissionais, payload);
      return extractApiData<Profissional>(res.data);
    },
    onSuccess,
  });
}

export function useAdminRemoverProfissional() {
  const onSuccess = useInvalidateEquipa();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${API_ENDPOINTS.admin.profissionais}/${id}`);
    },
    onSuccess,
  });
}

export function useAdminAtribuirProfissional() {
  const invalidate = useInvalidateAdmin();
  return useMutation({
    mutationFn: async ({ id, profissionalId }: { id: string; profissionalId: string | null }) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.admin.marcacoes}/${id}/profissional`, { profissionalId });
      return extractApiData<Marcacao>(res.data);
    },
    onSuccess: invalidate,
  });
}

export function useAdminClienteDetalhe(id: string | null) {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.clientes, id],
    queryFn: () => get<ClienteDetalhe>(`${API_ENDPOINTS.admin.clientes}/${id}`),
    enabled: !!id,
  });
}

export function useAdminGuardarNotasCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notas }: { id: string; notas: string }) => {
      await apiClient.patch(`${API_ENDPOINTS.admin.clientes}/${id}/notas`, { notas });
    },
    onSuccess: (_, { id }) => queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.clientes, id] }),
  });
}

export function useAdminUtilizadores() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.utilizadores],
    queryFn: () => buscarTudo<Usuario>(API_ENDPOINTS.admin.utilizadores, {}, 100),
  });
}

export function useAdminCriarUtilizador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { nome: string; email: string; telefone?: string; senha: string }) => {
      const res = await apiClient.post(API_ENDPOINTS.admin.utilizadores, payload);
      return extractApiData<Usuario>(res.data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.utilizadores] }),
  });
}

export function useAdminAtivarUtilizador() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.admin.utilizadores}/${id}/ativo`, { ativo });
      return extractApiData<Usuario>(res.data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.utilizadores] }),
  });
}

/** Qualquer utilizador autenticado (admin ou cliente). */
export function useTrocarSenha() {
  return useMutation({
    mutationFn: async (payload: { senhaAtual: string; novaSenha: string }) => {
      const res = await apiClient.patch(API_ENDPOINTS.minhaArea.senha, payload);
      // O backend termina as sessões antigas (incluindo esta) e devolve um token novo.
      const dados = extractApiData<{ token: string }>(res.data);
      if (dados?.token) setSessionToken(dados.token);
    },
  });
}

// --- Notificações do sistema (sino do painel) ---

export function useNotificacoesResumo() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.notificacoes, "resumo"],
    queryFn: () => get<{ naoLidas: number }>(`${API_ENDPOINTS.admin.notificacoes}/resumo`),
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });
}

export function useNotificacoes(soNaoLidas: boolean, enabled: boolean) {
  return useInfiniteList<Notificacao>(API_ENDPOINTS.admin.notificacoes, { naoLidas: soNaoLidas || undefined }, { size: 15, enabled });
}

function useInvalidateNotificacoes() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.notificacoes] });
}

export function useMarcarNotificacaoLida() {
  const invalidate = useInvalidateNotificacoes();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.patch(`${API_ENDPOINTS.admin.notificacoes}/${id}/lida`);
    },
    onSuccess: invalidate,
  });
}

export function useMarcarTodasNotificacoesLidas() {
  const invalidate = useInvalidateNotificacoes();
  return useMutation({
    mutationFn: async () => {
      await apiClient.patch(`${API_ENDPOINTS.admin.notificacoes}/lidas`);
    },
    onSuccess: invalidate,
  });
}

// --- Galeria (painel) ---

export function useAdminGaleria(filtros: Filtros = {}) {
  return useInfiniteList<GaleriaItem>(API_ENDPOINTS.admin.galeria, filtros, { size: 24 });
}

function useInvalidateGaleria() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.galeria] }),
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.publico.galeria] }),
    ]);
}

export function useCarregarFoto() {
  const invalidate = useInvalidateGaleria();
  return useMutation({
    mutationFn: async (dados: FormData) => {
      const res = await apiClient.post(API_ENDPOINTS.admin.galeria, dados, { headers: { "Content-Type": "multipart/form-data" } });
      return extractApiData<GaleriaItem>(res.data);
    },
    onSuccess: invalidate,
  });
}

export function useAtualizarFoto() {
  const invalidate = useInvalidateGaleria();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; titulo?: string | null; descricao?: string | null; categoria?: string | null; publicado?: boolean; destaque?: boolean; ordem?: number }) => {
      const res = await apiClient.put(`${API_ENDPOINTS.admin.galeria}/${id}`, payload);
      return extractApiData<GaleriaItem>(res.data);
    },
    onSuccess: invalidate,
  });
}

export function useRemoverFoto() {
  const invalidate = useInvalidateGaleria();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${API_ENDPOINTS.admin.galeria}/${id}`);
    },
    onSuccess: invalidate,
  });
}

export function useSubstituirFoto() {
  const invalidate = useInvalidateGaleria();
  return useMutation({
    mutationFn: async ({ id, dados }: { id: string; dados: FormData }) => {
      const res = await apiClient.put(`${API_ENDPOINTS.admin.galeria}/${id}/imagem`, dados, { headers: { "Content-Type": "multipart/form-data" } });
      return extractApiData<GaleriaItem>(res.data);
    },
    onSuccess: invalidate,
  });
}

export function useCuradoriaFoto() {
  const invalidate = useInvalidateGaleria();
  return useMutation({
    mutationFn: async ({ id, acao, motivo }: { id: string; acao: "aprovar" | "rejeitar"; motivo?: string }) => {
      const res = await apiClient.patch(`${API_ENDPOINTS.admin.galeria}/${id}/${acao}`, acao === "rejeitar" ? { motivo } : undefined);
      return extractApiData<GaleriaItem>(res.data);
    },
    onSuccess: invalidate,
  });
}

/** Nº de sugestões por aprovar (para o separador do painel). */
export function useSugestoesPendentes() {
  return useQuery({
    queryKey: [API_ENDPOINTS.admin.galeria, "pendentes"],
    queryFn: async () => (await buscarPagina<GaleriaItem>(API_ENDPOINTS.admin.galeria, { estado: "PENDENTE" }, 0, 1)).totalItems,
    refetchInterval: 60_000,
  });
}
