# Chuanga Studio — Frontend

Site público e painel de administração do Chuanga Studio (estúdio de unhas em Maputo):
**React 19 + TypeScript + Vite**, Tailwind 4, shadcn/ui (Radix), TanStack Query e React Router.

O backend está em [CHUANGA-STUDIO-BACK](https://github.com/UNIDEV-SOL/CHUANGA-STUDIO-BACK).

## Correr localmente

```bash
yarn install
cp .env.example .env.local   # ajustar VITE_API_URL se o backend não estiver em localhost:8080
yarn dev                     # http://localhost:5173
```

| Script           | O que faz                                      |
|------------------|------------------------------------------------|
| `yarn dev`       | servidor de desenvolvimento                    |
| `yarn build`     | verifica os tipos (tsc) e gera o `dist/`       |
| `yarn typecheck` | só a verificação de tipos                      |
| `yarn lint`      | ESLint                                         |
| `yarn preview`   | serve o `dist/` localmente                     |

## Estrutura de pastas

Arquitetura modular, igual ao SPO-FRONT: cada área do negócio tem a sua pasta em `src/modules/`;
o que é usado por vários módulos fica em `src/shared/`.

```
src/
├── main.tsx            providers (React Query, tema, sessão) + router
├── routes/index.tsx    todas as rotas; cada página é carregada só quando é aberta (lazy)
├── config/index.ts     variáveis de ambiente (VITE_API_URL, VITE_SITE_URL)
├── styles.css
├── assets/             imagens do site
├── modules/
│   ├── site/           home, sobre, contacto
│   ├── auth/           entrar, recuperar senha, sessão, RequireAuth
│   ├── catalog/        serviços (público + admin)
│   ├── bookings/       reservar e gerir marcações
│   ├── schedule/       horário e disponibilidade
│   ├── quotations/     cotações
│   ├── invoices/       faturas e fecho de conta
│   ├── clients/        "Minha área" e fichas de clientes
│   ├── gallery/        galeria
│   ├── loyalty/        fidelização e vales-oferta
│   ├── reviews/        avaliações
│   ├── chat/           mensagens
│   ├── team/           equipa e utilizadores
│   ├── reports/        visão geral e relatórios de caixa
│   ├── notifications/  sino de notificações
│   └── locations/      províncias, distritos e morada
│
│   Dentro de cada módulo (só as que fazem falta):
│   pages/  components/  hooks/ (use<Módulo>Api.ts: chamadas à API)  models/ (tipos)  lib/
│
└── shared/
    ├── ui/             componentes shadcn/ui
    ├── components/     Navbar, Footer, tabelas, estados de erro/carregamento...
    ├── layouts/        PublicLayout, AdminLayout
    ├── api/            httpClient (axios), apiEndpoints, paginação, helpers de queries
    ├── models/         tipos comuns (ApiResponse)
    ├── hooks/  lib/  providers/
```

Imports sempre com o alias `@/` (ex.: `@/modules/bookings/hooks/useBookingsApi`).

## Docker e deploy

- `Dockerfile` — build com Node e imagem final com **nginx**, que serve o site e encaminha `/api` para o backend.
- `nginx.conf` — configuração desse nginx (SPA, cache, `/api`, healthcheck em `/healthz`).
- `.github/workflows/docker-publish.yml` — verifica e publica a imagem em `ghcr.io/unidev-sol/chuanga-studio-frontend`.

O `compose.yaml` de produção e o passo a passo estão no backend, em `deploy/DEPLOY.md`.
