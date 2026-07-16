// Base URL já vem do VITE_API_URL (ex: http://localhost:8080/api)
// Então aqui usamos apenas os paths a partir de `/api`.
export const API_ENDPOINTS = {
  auth: {
    entrar: `/api/auth/entrar`,
    cadastrar: `/api/auth/cadastrar`,
  },
  publico: {
    servicos: `/api/publico/servicos`,
    marcacoes: `/api/publico/marcacoes`,
    cotacoes: `/api/publico/cotacoes`,
  },
  admin: {
    servicos: `/api/admin/servicos`,
    marcacoes: `/api/admin/marcacoes`,
    cotacoes: `/api/admin/cotacoes`,
    estatisticas: `/api/admin/estatisticas`,
    marcacoesProximas: `/api/admin/marcacoes/proximas`,
    atividadeRecente: `/api/admin/atividade-recente`,
    clientes: `/api/admin/clientes`,
  },
  minhaArea: {
    perfil: `/api/minha-area/perfil`,
    marcacoes: `/api/minha-area/marcacoes`,
  },
} as const;

