// Espelho dos DTOs do backend (chuanga-studio-backend). Datas chegam como
// strings ISO sem fuso: LocalDate "yyyy-MM-dd", LocalTime "HH:mm:ss",
// LocalDateTime "yyyy-MM-ddTHH:mm:ss".

export type PapelUsuario = "ADMIN" | "CLIENTE";

export type StatusMarcacao =
  | "AGUARDA_CONFIRMACAO"
  | "CONFIRMADA"
  | "CONCLUIDA"
  | "CANCELADA"
  | "NAO_COMPARECEU";

export type MetodoPagamento = "MPESA" | "EMOLA";

export type StatusCotacao = "NOVO" | "RESPONDIDO" | "ARQUIVADO";

export type StatusFatura = "PENDENTE" | "PAGA" | "ANULADA";

/** Como o cliente pagou a fatura na caixa. */
export type FormaPagamento = "NUMERARIO" | "MPESA" | "EMOLA" | "CARTAO" | "TRANSFERENCIA";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  papel: PapelUsuario;
  contaAtiva: boolean;
  criadoEm: string;
}

export interface AutenticacaoResponse {
  token: string;
  usuario: Usuario;
}

export interface Servico {
  id: string;
  nome: string;
  categoria: string;
  descricao: string | null;
  preco: number;
  duracaoMinutos: number;
  destaque: boolean;
  ativo: boolean;
  /** Dias até ao lembrete de manutenção (null = sem lembrete). */
  manutencaoDias?: number | null;
}

export interface MarcacaoServicoItem {
  servicoId: string;
  nome: string;
  preco: number;
}

export interface Marcacao {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone: string;
  data: string;
  hora: string;
  status: StatusMarcacao;
  valorTotal: number;
  valorAdiantamento: number;
  adiantamentoPago: boolean;
  metodoPagamento: MetodoPagamento | null;
  /** Soma das durações dos serviços. */
  duracaoMinutos: number;
  profissionalId?: string | null;
  profissionalNome?: string | null;
  // Só na lista do painel:
  faturaId?: string;
  faturaNumero?: string;
  faturaStatus?: StatusFatura;
  clienteFaltas?: number;
  servicos: MarcacaoServicoItem[];
}

export interface FaturaItem {
  servicoId: string | null;
  descricao: string;
  quantidade: number;
  precoUnitario: number;
  total: number;
}

export interface Fatura {
  id: string;
  numero: string;
  status: StatusFatura;
  marcacaoId: string;
  dataMarcacao: string;
  horaMarcacao: string;
  clienteId: string;
  clienteNome: string;
  clienteTelefone: string | null;
  clienteEmail: string | null;
  clienteNuit: string | null;
  dataEmissao: string;
  subtotal: number;
  desconto: number;
  adiantamentoDeduzido: number;
  descontoFidelizacao?: number;
  valeCodigo?: string | null;
  valorVale?: number;
  totalAPagar: number;
  formaPagamento: FormaPagamento | null;
  referenciaPagamento: string | null;
  pagoEm: string | null;
  observacoes: string | null;
  /** Link público do PDF (sem login), para partilhar. */
  pdfUrl: string;
  itens: FaturaItem[];
}

export interface Disponibilidade {
  data: string;
  aberto: boolean;
  /** Porque é que não há horas (dia fechado, sem vagas...). */
  motivo: string | null;
  duracaoMinutos: number;
  horarios: { hora: string; disponivel: boolean }[];
}

/** Um dia da semana: 1 = segunda ... 7 = domingo. Horas "HH:mm" ou "HH:mm:ss". */
export interface HorarioDia {
  diaSemana: number;
  aberto: boolean;
  abre: string | null;
  fecha: string | null;
  pausaInicio: string | null;
  pausaFim: string | null;
}

export interface ConfiguracaoHorario {
  semana: HorarioDia[];
  diasFechados: { id: string; data: string; motivo: string | null }[];
  intervaloMinutos: number;
  diasAntecedenciaMaxima: number;
}

export interface RelatorioCaixa {
  inicio: string;
  fim: string;
  faturado: number;
  recebido: number;
  descontos: number;
  adiantamentosDeduzidos: number;
  porReceber: number;
  faturasPorReceber: number;
  atendimentos: number;
  ticketMedio: number;
  marcacoesCanceladas: number;
  porForma: { forma: string; rotulo: string; total: number; quantidade: number }[];
  porDia: { data: string; faturado: number; recebido: number }[];
  topServicos: { descricao: string; quantidade: number; total: number }[];
}

export interface Cotacao {
  id: string;
  nome: string;
  telefone: string;
  email: string | null;
  mensagem: string | null;
  totalEstimado: number;
  status: StatusCotacao;
  criadoEm: string;
  servicosNomes: string[];
}

export interface ClienteResumo {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  criadoEm: string;
  provincia: string | null;
  distrito: string | null;
  totalMarcacoes: number;
  totalInvestido: number;
  faltas: number;
}

export interface Profissional {
  id: string;
  nome: string;
  telefone: string | null;
  ativo: boolean;
  ordem: number;
}

export interface ClienteDetalhe {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  criadoEm: string;
  notasInternas: string | null;
  totalMarcacoes: number;
  concluidas: number;
  canceladas: number;
  faltas: number;
  totalFaturado: number;
  ultimaVisita: string | null;
  marcacoes: Marcacao[];
  faturas: Fatura[];
}

export interface EstatisticasAdmin {
  marcacoesHoje: number;
  receitaDoMes: number;
  totalClientes: number;
  totalCotacoes: number;
}

export interface ApiResponse<T> {
  sucesso: boolean;
  mensagem?: string | null;
  dados: T;
  timestamp: string;
}

export interface ServicoRequest {
  nome: string;
  categoria: string;
  descricao?: string | null;
  preco: number;
  duracaoMinutos: number;
  manutencaoDias?: number | null;
  destaque: boolean;
  ativo: boolean;
}

export interface CriarMarcacaoRequest {
  servicosIds: string[];
  data: string; // yyyy-MM-dd
  hora: string; // HH:mm
  nome?: string;
  email?: string;
  telefone?: string;
  senha?: string;
  metodoPagamento: MetodoPagamento;
  referenciaPagamento: string;
  profissionalId?: string;
  provinciaId?: number;
  distritoId?: number;
}

export interface EmitirFaturaItem {
  servicoId?: string | null;
  descricao?: string;
  precoUnitario?: number;
  quantidade: number;
}

export interface EmitirFaturaRequest {
  itens: EmitirFaturaItem[];
  desconto?: number;
  observacoes?: string;
  /** Preenchido = o cliente já pagou na caixa (a fatura sai como paga). */
  formaPagamento?: FormaPagamento;
  referenciaPagamento?: string;
  clienteNuit?: string;
  aplicarFidelizacao?: boolean;
  codigoVale?: string;
}

// --- Fidelização, vales e avaliações ---

export interface FidelizacaoConfig {
  ativo: boolean;
  visitasPorRecompensa: number;
  valorRecompensa: number;
}

export interface EstadoFidelizacao {
  ativo: boolean;
  visitas: number;
  visitasPorRecompensa: number;
  carimbos: number;
  recompensasDisponiveis: number;
  valorRecompensa: number;
}

export type EstadoVale = "ATIVO" | "ESGOTADO" | "ANULADO";

export interface Vale {
  id: string;
  codigo: string;
  valorInicial: number;
  saldo: number;
  compradorNome: string | null;
  compradorContacto: string | null;
  beneficiarioNome: string | null;
  beneficiarioEmail: string | null;
  mensagem: string | null;
  validoAte: string | null;
  estado: EstadoVale;
  expirado: boolean;
  criadoEm: string;
}

export interface SaldoVale {
  codigo: string;
  saldo: number;
  validoAte: string | null;
  estado: EstadoVale;
  expirado: boolean;
}

export interface CriarValeRequest {
  valor: number;
  compradorNome?: string;
  compradorContacto?: string;
  beneficiarioNome?: string;
  beneficiarioEmail?: string;
  mensagem?: string;
  validoAte?: string;
}

export interface Avaliacao {
  id: string;
  clienteNome: string;
  nota: number | null;
  comentario: string | null;
  respondidaEm: string | null;
  publicada: boolean;
  dataAtendimento: string;
  servicos: string;
}

export interface ResumoAvaliacoes {
  media: number;
  total: number;
}

export interface PedidoAvaliacao {
  primeiroNome: string;
  data: string;
  servicos: string;
  respondida: boolean;
  nota: number | null;
}

export interface RegistarPagamentoFaturaRequest {
  formaPagamento: FormaPagamento;
  referenciaPagamento?: string;
}

export interface CriarCotacaoRequest {
  nome: string;
  telefone: string;
  email?: string | null;
  mensagem?: string | null;
  servicosIds: string[];
}

export interface CadastroRequest {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
  provinciaId?: number;
  distritoId?: number;
}

export interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string | null;
  link: string | null;
  criadoEm: string;
  lida: boolean;
}

export interface GaleriaItem {
  id: string;
  titulo: string | null;
  descricao: string | null;
  categoria: string | null;
  largura: number | null;
  altura: number | null;
  ordem: number;
  publicado: boolean;
  destaque: boolean;
  estado: "PENDENTE" | "APROVADA" | "REJEITADA";
  sugeridoPorNome: string | null;
  motivoRejeicao: string | null;
  /** Caminhos relativos à API (/api/publico/galeria/...). */
  imagemUrl: string;
  miniaturaUrl: string;
  criadoEm: string;
}

export type TipoConversa = "PRIVADA" | "DIRETA" | "GRUPO";

export interface Conversa {
  id: string;
  tipo: TipoConversa;
  titulo: string;
  descricao: string | null;
  temFoto: boolean;
  /** Grupos fixos da comunidade. */
  sistema: "COMUNIDADE" | "AVISOS" | null;
  servicoId: string | null;
  comunidade: boolean;
  aberto: boolean;
  clienteId: string | null;
  /** Na conversa direta: a outra pessoa. */
  outroUsuarioId: string | null;
  ultimaMensagem: string | null;
  ultimaMensagemEm: string | null;
  naoLidas: number;
  /** Só as administradoras enviam. */
  bloqueada: boolean;
  soAdminsEditam: boolean;
  fixada: boolean;
  arquivada: boolean;
  silenciada: boolean;
  membro: boolean;
  souAdmin: boolean;
  totalMembros: number;
  mensagemFixadaId: string | null;
  mensagemFixadaPreview: string | null;
  criadoEm: string;
  atualizadoEm: string | null;
}

export type TipoMensagem = "TEXTO" | "IMAGEM" | "AUDIO" | "DOCUMENTO" | "SISTEMA";

export interface ReacaoChat {
  emoji: string;
  total: number;
  minha: boolean;
  nomes: string[];
}

export interface MensagemChat {
  id: string;
  conversaId: string;
  remetenteId: string;
  remetenteNome: string;
  remetenteEquipa: boolean;
  minha: boolean;
  tipo: TipoMensagem;
  conteudo: string | null;
  temAnexo: boolean;
  anexoNome: string | null;
  anexoTamanho: number | null;
  anexoTipo: string | null;
  duracaoSegundos: number | null;
  respostaA: string | null;
  respostaPreview: string | null;
  respostaNome: string | null;
  editada: boolean;
  apagada: boolean;
  encaminhada: boolean;
  favorita: boolean;
  reacoes: ReacaoChat[];
  criadoEm: string;
  /** Até quando a autora pode editar (15 min) ou apagar para todos (2 dias). */
  podeEditarAte: string | null;
  podeApagarAte: string | null;
  /** Administradora do grupo pode apagar mensagens de outras. */
  podeApagarModeracao: boolean;
}

export interface HistoricoChat {
  mensagens: MensagemChat[];
  temMais: boolean;
  cursor: string;
  /** As minhas mensagens até este instante já foram vistas (✓✓ azul). */
  lidaPorTodosAte: string | null;
  aEscrever: string[];
  online: boolean;
  vistoEm: string | null;
}

export interface MembroChat {
  usuarioId: string;
  nome: string;
  admin: boolean;
  equipa: boolean;
  eu: boolean;
  online: boolean;
  vistoEm: string | null;
  telefone: string | null;
  entrouEm: string | null;
}

export interface DetalhesChat {
  conversa: Conversa;
  detalhes: {
    membros: MembroChat[];
    contacto: {
      usuarioId: string | null;
      nome: string;
      telefone: string | null;
      email: string | null;
      equipa: boolean;
      online: boolean;
      vistoEm: string | null;
      clienteDesde: string | null;
      visitas: number | null;
    } | null;
    gruposEmComum: { id: string; titulo: string }[];
    totalFotos: number;
    totalDocumentos: number;
    podeEditarInfo: boolean;
    podeSair: boolean;
    podeApagar: boolean;
  };
}

export interface ContactoChat {
  usuarioId: string | null;
  nome: string;
  equipa: boolean;
}

export interface ComunidadeItem {
  id: string;
  titulo: string;
  descricao: string | null;
  temFoto: boolean;
  sistema: "COMUNIDADE" | "AVISOS" | null;
  servicoId: string | null;
  aberto: boolean;
  membro: boolean;
  podeEntrar: boolean;
  totalMembros: number;
  ultimaMensagemEm: string | null;
}

export interface FavoritaChat {
  mensagem: MensagemChat;
  conversaTitulo: string;
}

export interface InfoMensagemChat {
  lidaPor: { usuarioId: string; nome: string; lidaEm: string }[];
  porLer: string[];
}
