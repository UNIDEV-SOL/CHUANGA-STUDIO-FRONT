# syntax=docker/dockerfile:1

# ---------- 1) Build: gera os ficheiros estáticos (dist/) com Node ----------
FROM node:22-alpine AS build
WORKDIR /app
# Primeiro só o package.json e o yarn.lock: as dependências ficam numa camada em cache
# e só voltam a ser instaladas quando estes ficheiros mudam.
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --non-interactive
COPY . .
# Ficam gravadas no JavaScript durante o build (o Vite não as lê em runtime).
# VITE_API_URL vazio = a API está no mesmo domínio, em /api (o nginx abaixo encaminha).
ARG VITE_API_URL=""
ARG VITE_SITE_URL="https://chuanga-studio.com"
ENV VITE_API_URL=$VITE_API_URL \
    VITE_SITE_URL=$VITE_SITE_URL
RUN yarn build

# ---------- 2) Runtime: nginx serve o site e encaminha /api para o backend ----------
FROM nginx:1.27-alpine
LABEL org.opencontainers.image.title="chuanga-studio-frontend" \
      org.opencontainers.image.description="Site e painel do Chuanga Studio (React + nginx)" \
      org.opencontainers.image.source="https://github.com/UNIDEV-SOL/CHUANGA-STUDIO-FRONT"
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
