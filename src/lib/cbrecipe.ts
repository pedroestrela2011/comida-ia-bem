// NutriPlus Recipe format (.cbrecipe) — exclusive sharing format.
import type { FavoriteRecipeData } from "@/hooks/useFavorites";

export const CBRECIPE_VERSION = 1;
export const CBRECIPE_EXT = ".cbrecipe";

export type CbRecipe = {
  formato: "cbrecipe";
  versao: number;
  origem: "NutriPlus";
  exportado_em: string;
  receita: FavoriteRecipeData & {
    vitaminas?: string;
    sais_minerais?: string;
  };
};

export function buildCbRecipe(recipe: FavoriteRecipeData): CbRecipe {
  return {
    formato: "cbrecipe",
    versao: CBRECIPE_VERSION,
    origem: "NutriPlus",
    exportado_em: new Date().toISOString(),
    receita: recipe,
  };
}

export function downloadCbRecipe(recipe: FavoriteRecipeData) {
  const payload = buildCbRecipe(recipe);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const safe = recipe.nome.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "receita";
  a.href = url;
  a.download = `${safe}${CBRECIPE_EXT}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function parseCbRecipe(text: string): FavoriteRecipeData {
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Arquivo .cbrecipe inválido (JSON malformado)");
  }
  if (!parsed || parsed.formato !== "cbrecipe" || !parsed.receita?.nome) {
    throw new Error("Este arquivo não é um .cbrecipe válido");
  }
  return parsed.receita as FavoriteRecipeData;
}

export async function readCbRecipeFile(file: File): Promise<FavoriteRecipeData> {
  const text = await file.text();
  return parseCbRecipe(text);
}

// Generate an elegant share card as a PNG dataURL using canvas
export async function generateRecipeCard(recipe: FavoriteRecipeData): Promise<Blob> {
  const W = 1080;
  const H = 1350; // Instagram-friendly 4:5
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient (earth/green)
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#f3f7ef");
  grad.addColorStop(1, "#dfeacb");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Optional dish photo
  if (recipe.foto) {
    try {
      const img = await loadImage(recipe.foto);
      const ph = 720;
      drawImageCover(ctx, img, 0, 0, W, ph);
      // soft fade
      const fade = ctx.createLinearGradient(0, ph - 200, 0, ph);
      fade.addColorStop(0, "rgba(243,247,239,0)");
      fade.addColorStop(1, "rgba(243,247,239,1)");
      ctx.fillStyle = fade;
      ctx.fillRect(0, ph - 200, W, 200);
    } catch {
      drawPlaceholder(ctx, W, 720);
    }
  } else {
    drawPlaceholder(ctx, W, 720);
  }

  // Card area
  const cardY = 700;
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 60, cardY, W - 120, H - cardY - 60, 32);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.06)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Title
  ctx.fillStyle = "#2d4a1f";
  ctx.font = "700 56px system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  wrapText(ctx, recipe.nome, 110, cardY + 90, W - 220, 64, 2);

  // Info row
  const infoY = cardY + 250;
  ctx.font = "500 30px system-ui, sans-serif";
  ctx.fillStyle = "#4a6b3a";
  const parts: string[] = [];
  if (recipe.informacoes_nutricionais?.calorias) parts.push(`🔥 ${recipe.informacoes_nutricionais.calorias}`);
  if (recipe.tempo_preparo) parts.push(`⏱ ${recipe.tempo_preparo}`);
  if (recipe.porcoes) parts.push(`👥 ${recipe.porcoes}`);
  ctx.fillText(parts.join("    "), 110, infoY);

  // Macros
  const macroY = infoY + 90;
  const nut = recipe.informacoes_nutricionais;
  if (nut) {
    const macros = [
      ["Proteínas", nut.proteinas],
      ["Carbos", nut.carboidratos],
      ["Gorduras", nut.gorduras],
    ].filter(([, v]) => v);
    const colW = (W - 220) / Math.max(macros.length, 1);
    macros.forEach(([label, val], i) => {
      const x = 110 + i * colW;
      ctx.fillStyle = "#f3f7ef";
      roundRect(ctx, x, macroY, colW - 20, 130, 20);
      ctx.fill();
      ctx.fillStyle = "#6b8e4e";
      ctx.font = "500 24px system-ui, sans-serif";
      ctx.fillText(String(label), x + 24, macroY + 46);
      ctx.fillStyle = "#2d4a1f";
      ctx.font = "700 36px system-ui, sans-serif";
      ctx.fillText(String(val), x + 24, macroY + 96);
    });
  }

  // Footer with brand
  ctx.fillStyle = "#2d4a1f";
  ctx.font = "700 32px system-ui, sans-serif";
  ctx.fillText("🌿 NutriPlus", 110, H - 100);
  ctx.fillStyle = "#6b8e4e";
  ctx.font = "400 24px system-ui, sans-serif";
  ctx.fillText("Sua nutrição inteligente", 110, H - 70);

  return await new Promise<Blob>((res) =>
    canvas.toBlob((b) => res(b!), "image/png", 0.95)
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawImageCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const ir = img.width / img.height;
  const tr = w / h;
  let sw = img.width, sh = img.height, sx = 0, sy = 0;
  if (ir > tr) { sw = img.height * tr; sx = (img.width - sw) / 2; }
  else { sh = img.width / tr; sy = (img.height - sh) / 2; }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function drawPlaceholder(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, "#b6d094");
  g.addColorStop(1, "#6b8e4e");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = "700 140px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("🍃", w / 2, h / 2 + 50);
  ctx.textAlign = "start";
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const words = text.split(" ");
  let line = "";
  let lines = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + " " + words[i] : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      if (lines >= maxLines - 1) {
        ctx.fillText(line + "…", x, y);
        return;
      }
      ctx.fillText(line, x, y);
      line = words[i];
      y += lineHeight;
      lines++;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y);
}
