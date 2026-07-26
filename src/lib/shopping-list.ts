/**
 * Geração automática e determinística da lista de compras
 * a partir dos ingredientes das refeições de um cardápio.
 */

export type ShoppingCategory =
  | "proteinas"
  | "legumes_verduras"
  | "frutas"
  | "carboidratos"
  | "laticinios"
  | "temperos"
  | "outros";

export const CATEGORY_ORDER: ShoppingCategory[] = [
  "proteinas",
  "legumes_verduras",
  "frutas",
  "carboidratos",
  "laticinios",
  "temperos",
  "outros",
];

export const CATEGORY_LABEL: Record<ShoppingCategory, string> = {
  proteinas: "Proteínas",
  legumes_verduras: "Legumes e Verduras",
  frutas: "Frutas",
  carboidratos: "Carboidratos e Grãos",
  laticinios: "Laticínios",
  temperos: "Temperos e Condimentos",
  outros: "Outros",
};

export type ShoppingItem = {
  /** chave estável usada para preservar marcações entre atualizações */
  key: string;
  nome: string;
  quantidade: string;
  unidade: string;
  categoria: ShoppingCategory;
  altaProteina: boolean;
};

export type ShoppingList = {
  items: ShoppingItem[];
  byCategory: { categoria: ShoppingCategory; items: ShoppingItem[] }[];
};

const KEYWORDS: Record<Exclude<ShoppingCategory, "outros">, string[]> = {
  proteinas: [
    "frango", "peito de frango", "carne", "patinho", "acem", "acém", "alcatra", "coxao", "coxão",
    "file", "filé", "bife", "boi", "porco", "lombo", "costela", "linguica", "linguiça", "bacon",
    "peixe", "salmao", "salmão", "tilapia", "tilápia", "atum", "sardinha", "bacalhau", "camarao", "camarão",
    "ovo", "ovos", "clara", "peru", "peito de peru", "presunto", "carne moida", "carne moída",
    "feijao", "feijão", "lentilha", "grao de bico", "grão de bico", "ervilha", "soja", "tofu",
    "proteina", "proteína", "whey", "albumina", "sardinhas", "fígado", "figado",
  ],
  legumes_verduras: [
    "alface", "rucula", "rúcula", "agriao", "agrião", "espinafre", "couve", "repolho", "brocolis",
    "brócolis", "couve-flor", "couve flor", "cenoura", "abobrinha", "abobora", "abóbora", "berinjela",
    "chuchu", "pepino", "tomate", "cebola", "pimentao", "pimentão", "beterraba", "vagem", "quiabo",
    "batata doce", "batata-doce", "batata", "mandioca", "aipim", "inhame", "milho", "aspargo",
    "champignon", "cogumelo", "salsao", "salsão", "nabo", "acelga", "escarola", "broto",
  ],
  frutas: [
    "banana", "maca", "maçã", "laranja", "limao", "limão", "abacaxi", "mamao", "mamão", "manga",
    "melancia", "melao", "melão", "uva", "morango", "abacate", "pera", "kiwi", "goiaba", "acerola",
    "tangerina", "mexerica", "ameixa", "pessego", "pêssego", "framboesa", "mirtilo", "coco", "acai", "açaí",
    "fruta", "frutas vermelhas", "damasco", "tamara", "tâmara", "uva passa", "uvas passas",
  ],
  carboidratos: [
    "arroz", "macarrao", "macarrão", "massa", "pao", "pão", "aveia", "granola", "quinoa", "cuscuz",
    "tapioca", "farinha", "trigo", "centeio", "torrada", "biscoito", "cereal", "polenta", "fuba", "fubá",
    "batata inglesa", "wrap", "tortilha", "panqueca", "cevada", "amido",
  ],
  laticinios: [
    "leite", "iogurte", "queijo", "requeijao", "requeijão", "ricota", "cottage", "manteiga", "creme de leite",
    "nata", "coalhada", "mussarela", "muçarela", "parmesao", "parmesão", "minas", "kefir",
  ],
  temperos: [
    "sal", "pimenta", "alho", "azeite", "oleo", "óleo", "vinagre", "oregano", "orégano", "manjericao",
    "manjericão", "salsinha", "cebolinha", "coentro", "cominho", "colorau", "paprica", "páprica",
    "curry", "canela", "gengibre", "cúrcuma", "curcuma", "louro", "alecrim", "tomilho", "shoyu",
    "mostarda", "molho", "tempero", "caldo", "acucar", "açúcar", "adocante", "adoçante", "mel",
  ],
};

const HIGH_PROTEIN = [
  "frango", "carne", "peixe", "salmao", "salmão", "atum", "tilapia", "tilápia", "sardinha", "ovo",
  "ovos", "clara", "whey", "proteina", "proteína", "albumina", "peru", "tofu", "lentilha",
  "grao de bico", "grão de bico", "feijao", "feijão", "queijo", "cottage", "ricota", "iogurte grego",
  "camarao", "camarão", "patinho", "alcatra", "lombo", "soja",
];

const UNIT_PATTERN =
  "kg|quilos?|quilo|g|gramas?|grama|mg|litros?|litro|l|ml|xicaras?|xícaras?|copos?|copo|colheres?|colher|" +
  "unidades?|unidade|un|und|uni|fatias?|fatia|dentes?|dente|ramos?|ramo|punhados?|punhado|pacotes?|pacote|" +
  "latas?|lata|potes?|pote|folhas?|folha|pitadas?|pitada|filés?|files?|filé|file|postas?|posta";

const UNIT_NORMALIZE: Record<string, string> = {
  kg: "kg", quilo: "kg", quilos: "kg",
  g: "g", grama: "g", gramas: "g",
  mg: "mg",
  l: "l", litro: "l", litros: "l",
  ml: "ml",
};

export function normalizeName(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function parseQuantity(raw: string): number | null {
  const cleaned = raw.trim().replace(",", ".");
  if (cleaned.includes("/")) {
    const [a, b] = cleaned.split("/").map(Number);
    if (a && b) return a / b;
    return null;
  }
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function categorize(nome: string): ShoppingCategory {
  const n = normalizeName(nome);
  for (const cat of CATEGORY_ORDER) {
    if (cat === "outros") continue;
    const list = KEYWORDS[cat as Exclude<ShoppingCategory, "outros">];
    if (list.some((k) => n.includes(normalizeName(k)))) return cat;
  }
  return "outros";
}

function isHighProtein(nome: string): boolean {
  const n = normalizeName(nome);
  return HIGH_PROTEIN.some((k) => n.includes(normalizeName(k)));
}

type Parsed = { nome: string; qtd: number | null; unidade: string };

export function parseIngredient(raw: string): Parsed | null {
  let text = String(raw || "").trim();
  if (!text) return null;
  // remove marcadores e observações entre parênteses
  text = text.replace(/^[-•*\s]+/, "").replace(/\(([^)]*)\)/g, "").trim();
  if (!text) return null;

  const re = new RegExp(`^([\\d.,/]+)\\s*(${UNIT_PATTERN})?\\b\\s*(?:de\\s+|da\\s+|do\\s+)?(.*)$`, "i");
  const m = text.match(re);

  let qtd: number | null = null;
  let unidade = "";
  let nome = text;

  if (m) {
    qtd = parseQuantity(m[1]);
    const rawUnit = (m[2] || "").toLowerCase();
    unidade = UNIT_NORMALIZE[rawUnit] ?? rawUnit;
    nome = (m[3] || "").trim();
    if (!nome) {
      nome = text;
      qtd = null;
      unidade = "";
    }
  }

  // "colher de sopa de azeite" -> limpa restos de preposição
  nome = nome.replace(/^(de\s+sopa|de\s+cha|de\s+chá|de\s+sobremesa)\s+(de\s+)?/i, "").trim();
  nome = nome.replace(/^(de|da|do)\s+/i, "").trim();
  nome = nome.replace(/\s*,.*$/, "").trim();
  if (!nome) return null;

  if (!unidade && qtd !== null) unidade = "unidade";
  return { nome, qtd, unidade };
}

function formatQuantity(qtd: number | null, unidade: string): { quantidade: string; unidade: string } {
  if (qtd === null) return { quantidade: "a gosto", unidade: "" };
  let q = qtd;
  let u = unidade;
  if (u === "g" && q >= 1000) { q = q / 1000; u = "kg"; }
  if (u === "ml" && q >= 1000) { q = q / 1000; u = "l"; }
  const rounded = Math.round(q * 100) / 100;
  const str = Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(".", ",");
  return { quantidade: str, unidade: u };
}

type MealLike = { ingredientes?: string[] } | null | undefined;

/** Extrai todos os ingredientes de um cardápio (opcionalmente filtrando dias). */
export function collectIngredients(
  cardapio: Record<string, Record<string, MealLike>> | undefined,
  dias?: string[]
): string[] {
  if (!cardapio) return [];
  const out: string[] = [];
  const diasKeys = dias?.length ? dias : Object.keys(cardapio);
  for (const dia of diasKeys) {
    const refeicoes = cardapio[dia];
    if (!refeicoes) continue;
    for (const ref of Object.values(refeicoes)) {
      if (ref && Array.isArray(ref.ingredientes)) out.push(...ref.ingredientes);
    }
  }
  return out;
}

/** Constrói a lista de compras agregada e categorizada. */
export function buildShoppingList(
  cardapio: Record<string, Record<string, MealLike>> | undefined,
  dias?: string[]
): ShoppingList {
  const ingredientes = collectIngredients(cardapio, dias);
  const map = new Map<string, { nome: string; unidade: string; total: number | null }>();

  for (const raw of ingredientes) {
    const parsed = parseIngredient(raw);
    if (!parsed) continue;
    const nameKey = normalizeName(parsed.nome);
    if (!nameKey || nameKey.length < 2) continue;
    const key = `${nameKey}|${parsed.unidade}`;
    const existing = map.get(key);
    if (existing) {
      if (parsed.qtd !== null) existing.total = (existing.total ?? 0) + parsed.qtd;
    } else {
      map.set(key, { nome: parsed.nome, unidade: parsed.unidade, total: parsed.qtd });
    }
  }

  const items: ShoppingItem[] = Array.from(map.entries()).map(([key, v]) => {
    const { quantidade, unidade } = formatQuantity(v.total, v.unidade);
    return {
      key,
      nome: titleCase(v.nome),
      quantidade,
      unidade,
      categoria: categorize(v.nome),
      altaProteina: isHighProtein(v.nome),
    };
  });

  items.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const byCategory = CATEGORY_ORDER.map((categoria) => ({
    categoria,
    items: items.filter((i) => i.categoria === categoria),
  })).filter((g) => g.items.length > 0);

  return { items, byCategory };
}

/** Rótulo do período (ex: "Semana de 14 a 20 de julho"). */
export function periodoLabel(): string {
  const now = new Date();
  const day = now.getDay(); // 0 dom
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const start = new Date(now);
  start.setDate(now.getDate() + diffToMonday);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  if (start.getMonth() === end.getMonth()) {
    return `Semana de ${start.getDate()} a ${end.getDate()} de ${meses[end.getMonth()]}`;
  }
  return `Semana de ${start.getDate()} de ${meses[start.getMonth()]} a ${end.getDate()} de ${meses[end.getMonth()]}`;
}
