import { lazy, type ComponentType } from "react";

// Depois de um deploy novo, os ficheiros .js antigos deixam de existir no servidor. Quem tinha o
// site aberto recebe um erro ao abrir uma página que ainda não tinha carregado: nesse caso
// recarregamos a página uma vez para obter a versão nova (como no SPO-FRONT).
const RELOAD_KEY = "chuanga:chunk-reload-at";
const RELOAD_GUARD_MS = 30_000;

const CHUNK_ERROR =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|ChunkLoadError|Loading chunk [\w-]+ failed/i;

export const isChunkLoadError = (error: unknown) => {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? "");
  return CHUNK_ERROR.test(message);
};

function reloadOnceForNewVersion() {
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < RELOAD_GUARD_MS) return false;
    window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyWithRetry<T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  return lazy(() =>
    factory().catch((error) => {
      if (isChunkLoadError(error) && reloadOnceForNewVersion()) {
        return new Promise<{ default: T }>(() => undefined);
      }
      throw error;
    }),
  );
}
