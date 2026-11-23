// Regras únicas de senha da plataforma.
// Usadas pelo indicador visual (PasswordStrength) e por toda validação de cadastro,
// redefinição e troca de senha, para que lista exibida e regra cobrada nunca diverjam.

export const PASSWORD_REQUIREMENTS: { label: string; test: (p: string) => boolean }[] = [
  { label: "Pelo menos 8 caracteres", test: (p) => p.length >= 8 },
  { label: "Pelo menos 1 número", test: (p) => /[0-9]/.test(p) },
  { label: "Pelo menos 1 caractere especial", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export const PASSWORD_HINT =
  "A senha precisa ter pelo menos 8 caracteres, 1 número e 1 caractere especial.";

export const PASSWORD_PLACEHOLDER = "Mínimo 8 caracteres, número e caractere especial";

export function checkPassword(password: string) {
  const missing = PASSWORD_REQUIREMENTS.filter((r) => !r.test(password)).map((r) => r.label);
  return { valid: missing.length === 0, missing };
}
