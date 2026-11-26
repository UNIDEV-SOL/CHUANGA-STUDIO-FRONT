// Espelho dos DTOs do backend (chuanga-studio-backend). Datas chegam como
// strings ISO sem fuso: LocalDate "yyyy-MM-dd", LocalTime "HH:mm:ss",
// LocalDateTime "yyyy-MM-ddTHH:mm:ss".

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
