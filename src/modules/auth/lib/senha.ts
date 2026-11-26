import { z } from "zod";

// Regras alinhadas com @SenhaValida do backend: 8 a 72 bytes, letra + número, sem espaços nas pontas.
export const SENHA_DICA = "Mínimo 8 caracteres, com letras e números.";

export function erroSenha(senha: string): string | null {
  if (senha.length < 8) return `A palavra-passe tem de ter pelo menos 8 caracteres (tem ${senha.length}).`;
  if (new TextEncoder().encode(senha).length > 72) return "A palavra-passe é demasiado longa (máximo 72 bytes).";
  if (!/\p{L}/u.test(senha)) return "A palavra-passe tem de ter pelo menos uma letra.";
  if (!/\d/.test(senha)) return "A palavra-passe tem de ter pelo menos um número.";
  if (senha.trim() !== senha) return "A palavra-passe não pode começar nem acabar com espaços.";
  return null;
}

export const senhaNovaSchema = z.string().superRefine((s, ctx) => {
  const erro = erroSenha(s);
  if (erro) ctx.addIssue({ code: z.ZodIssueCode.custom, message: erro });
});
