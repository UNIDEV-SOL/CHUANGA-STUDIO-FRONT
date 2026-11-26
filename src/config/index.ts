// Variáveis de ambiente num só sítio. Só as que começam por VITE_ chegam ao browser,
// e ficam gravadas no JavaScript no momento do build (não são lidas em runtime).

/**
 * Endereço do backend (sem /api no fim).
 * - Em produção (Docker) fica vazio: o site e a API estão no mesmo domínio e o nginx
 *   encaminha /api para o backend, por isso os pedidos vão para o próprio site.
 * - Em desenvolvimento, por omissão, o backend local.
 */
const apiDoEnv = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

export const ConfigValue = {
  API_URL: (apiDoEnv ?? (import.meta.env.DEV ? "http://localhost:8080" : "")).replace(/\/+$/, "").replace(/\/api$/, ""),
  /** URL público do site, usado no SEO (canonical, Open Graph). */
  SITE_URL: ((import.meta.env.VITE_SITE_URL as string | undefined)?.trim() || "https://chuanga-studio.com").replace(/\/+$/, ""),
} as const;
