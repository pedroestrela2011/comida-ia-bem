// Health / onboarding utilities

export type Objetivo =
  | "Emagrecer"
  | "Ganhar Massa Muscular"
  | "Manter o Peso"
  | "Melhorar a Saúde Geral"
  | "Melhorar Performance Esportiva";

export const OBJETIVOS: Objetivo[] = [
  "Emagrecer",
  "Ganhar Massa Muscular",
  "Manter o Peso",
  "Melhorar a Saúde Geral",
  "Melhorar Performance Esportiva",
];

export type NivelAtividade =
  | "Sedentário"
  | "Levemente Ativo"
  | "Moderadamente Ativo"
  | "Muito Ativo"
  | "Atleta";

export const NIVEIS_ATIVIDADE: { value: NivelAtividade; desc: string }[] = [
  { value: "Sedentário", desc: "Pouco ou nenhum exercício" },
  { value: "Levemente Ativo", desc: "1 a 3 dias por semana" },
  { value: "Moderadamente Ativo", desc: "3 a 5 dias por semana" },
  { value: "Muito Ativo", desc: "6 a 7 dias por semana" },
  { value: "Atleta", desc: "Exercícios intensos diários" },
];

export const REFEICOES_OPCOES = [2, 3, 4, 5, 6] as const;

export const RESTRICOES_OPCOES = [
  "Nenhuma",
  "Vegetariano",
  "Vegano",
  "Sem Glúten",
  "Sem Lactose",
  "Sem Frutos do Mar",
  "Sem Carne Vermelha",
  "Halal",
  "Kosher",
] as const;

export const CONDICOES_OPCOES = [
  "Nenhuma",
  "Diabetes Tipo 1",
  "Diabetes Tipo 2",
  "Hipertensão",
  "Colesterol Alto",
  "Doença Celíaca",
  "Intolerância à Lactose",
  "Síndrome do Intestino Irritável",
  "Outras",
] as const;

export type HealthProfile = {
  peso_kg?: number | null;
  altura_cm?: number | null;
  imc?: number | null;
  objetivo?: string | null;
  nivel_atividade?: string | null;
  refeicoes_dia?: number | null;
  restricoes_alimentares?: string[] | null;
  alergias?: string | null;
  condicoes_saude?: string[] | null;
  condicoes_outras?: string | null;
  unidade_peso?: "kg" | "lb" | null;
  unidade_altura?: "cm" | "ft" | null;
  idioma?: "pt" | "en" | null;
  onboarding_completo?: boolean | null;
};

// Unit helpers
export function unitsForCountry(pais?: string | null): {
  peso: "kg" | "lb";
  altura: "cm" | "ft";
  idioma: "pt" | "en";
} {
  if (pais === "Estados Unidos") return { peso: "lb", altura: "ft", idioma: "en" };
  if (pais === "Brasil") return { peso: "kg", altura: "cm", idioma: "pt" };
  return { peso: "kg", altura: "cm", idioma: "en" };
}

export function lbToKg(lb: number) {
  return lb * 0.45359237;
}
export function kgToLb(kg: number) {
  return kg / 0.45359237;
}
export function ftToCm(ft: number) {
  return ft * 30.48;
}
export function cmToFt(cm: number) {
  return cm / 30.48;
}

// IMC
export function calcIMC(pesoKg: number, alturaCm: number): number | null {
  if (!pesoKg || !alturaCm) return null;
  const m = alturaCm / 100;
  if (m <= 0) return null;
  return Math.round((pesoKg / (m * m)) * 100) / 100;
}

export function faixaIMC(imc: number | null | undefined): {
  label: "Abaixo do Peso" | "Normal" | "Sobrepeso" | "Obesidade" | "—";
  color: string;
} {
  if (imc == null) return { label: "—", color: "text-muted-foreground" };
  if (imc < 18.5) return { label: "Abaixo do Peso", color: "text-blue-500" };
  if (imc < 25) return { label: "Normal", color: "text-primary" };
  if (imc < 30) return { label: "Sobrepeso", color: "text-amber-500" };
  return { label: "Obesidade", color: "text-destructive" };
}

// Age from date-of-birth string (YYYY-MM-DD)
export function calcIdade(dataNascimento?: string | null): number | null {
  if (!dataNascimento) return null;
  const d = new Date(dataNascimento + "T00:00:00");
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

// Build a compact context block to inject into AI prompts
export function buildHealthContext(profile?: HealthProfile | null): string {
  if (!profile) return "";
  const parts: string[] = [];
  if (profile.peso_kg) parts.push(`Peso: ${profile.peso_kg}kg`);
  if (profile.altura_cm) parts.push(`Altura: ${profile.altura_cm}cm`);
  if (profile.imc) parts.push(`IMC: ${profile.imc}`);
  if (profile.objetivo) parts.push(`Objetivo: ${profile.objetivo}`);
  if (profile.nivel_atividade) parts.push(`Atividade: ${profile.nivel_atividade}`);
  if (profile.refeicoes_dia) parts.push(`Refeições/dia: ${profile.refeicoes_dia}`);
  const rest = (profile.restricoes_alimentares || []).filter((r) => r && r !== "Nenhuma");
  if (rest.length) parts.push(`Restrições: ${rest.join(", ")}`);
  if (profile.alergias) parts.push(`Alergias: ${profile.alergias}`);
  const cond = (profile.condicoes_saude || []).filter((c) => c && c !== "Nenhuma");
  if (cond.length) parts.push(`Condições de saúde: ${cond.join(", ")}`);
  if (profile.condicoes_outras) parts.push(`Outras condições: ${profile.condicoes_outras}`);
  if (!parts.length) return "";
  return `CONTEXTO DE SAÚDE DO USUÁRIO (usar para personalizar, evitar sugestões incompatíveis e emitir avisos quando aplicável):\n- ${parts.join("\n- ")}`;
}
