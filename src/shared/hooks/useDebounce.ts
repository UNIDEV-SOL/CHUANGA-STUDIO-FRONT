import { useEffect, useState } from "react";

/** Valor que só muda depois de o utilizador parar de escrever (para não pedir à API a cada tecla). */
export function useDebounce<T>(valor: T, atrasoMs = 350) {
  const [atrasado, setAtrasado] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setAtrasado(valor), atrasoMs);
    return () => clearTimeout(t);
  }, [valor, atrasoMs]);
  return atrasado;
}
