// Regras únicas de senha da plataforma.
// Usadas pelos textos dos formulários e por toda validação de cadastro,
// redefinição e troca de senha, para que lista exibida e regra cobrada nunca diverjam.

export const PASSWORD_REQUIREMENTS: { label: string; test: (p: string) => boolean }[] = [
  { label: "Pelo menos 6 caracteres", test: (p) => p.length >= 6 },
];

export const PASSWORD_HINT =
  "Use pelo menos 6 caracteres. Não é obrigatório usar números, símbolos ou letras maiúsculas.";

export const PASSWORD_PLACEHOLDER = "Mínimo 6 caracteres";

export function passwordErrorMessage(error: { message?: string; code?: string; reasons?: string[] }) {
  const message = (error.message || "").toLowerCase();
  if (error.reasons?.includes("pwned") || /known to be weak|pwned|compromised|leaked/.test(message)) {
    return "Esta senha já apareceu em vazamentos ou é muito fácil de adivinhar. Escolha outra para proteger sua conta; não é obrigatório usar números, símbolos ou maiúsculas.";
  }
  if (/same password/.test(message)) return "A nova senha não pode ser igual à senha anterior.";
  if (/password/.test(message) && /characters|length/.test(message)) {
    return "A senha não atende ao tamanho mínimo exigido. " + (message.match(/\d+/)?.[0] ? `Use pelo menos ${message.match(/\d+/)?.[0]} caracteres.` : "Escolha uma senha mais longa.");
  }
  if (error.code === "weak_password" || /weak password/.test(message)) {
    return "A senha foi recusada pela proteção de acesso. Escolha outra senha; se isso persistir, contate o suporte.";
  }
  return null;
}

export function checkPassword(password: string) {
  const missing = PASSWORD_REQUIREMENTS.filter((r) => !r.test(password)).map((r) => r.label);
  return { valid: missing.length === 0, missing };
}
