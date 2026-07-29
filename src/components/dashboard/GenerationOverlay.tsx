import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Leaf } from "lucide-react";

const MESSAGES = [
  "Analisando seus objetivos...",
  "Selecionando os melhores alimentos para você...",
  "Calculando informações nutricionais...",
  "Organizando suas refeições...",
  "Gerando sua lista de compras...",
  "Quase pronto!",
];

interface Props {
  open: boolean;
  title?: string;
}

export function GenerationOverlay({ open, title = "Criando seu cardápio personalizado..." }: Props) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (!open) { setIdx(0); return; }
    const t = setInterval(() => setIdx((i) => (i + 1 < MESSAGES.length ? i + 1 : i)), 3000);
    return () => clearInterval(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    // Block scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Warn before closing/reloading
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Seu cardápio ainda está sendo gerado. Tem certeza que deseja sair?";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", beforeUnload);

    // Block browser back button
    window.history.pushState(null, "", window.location.href);
    const onPop = () => {
      window.history.pushState(null, "", window.location.href);
    };
    window.addEventListener("popstate", onPop);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("popstate", onPop);
    };
  }, [open]);

  if (!open) return null;

  const progress = Math.min(96, ((idx + 1) / MESSAGES.length) * 100);

  return createPortal(
    <div
      role="alertdialog"
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in-0"
      style={{ backgroundColor: "rgba(0,0,0,0.75)" }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="w-full max-w-sm rounded-2xl bg-card p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center">
          <Leaf className="h-12 w-12 animate-spin" style={{ color: "#2d6a4f", animationDuration: "2.4s" }} />
        </div>
        <h2 className="text-lg font-bold text-foreground">{title} 🌿</h2>
        <p key={idx} className="mt-2 min-h-[40px] text-sm text-muted-foreground animate-in fade-in-0 slide-in-from-bottom-1 duration-500">
          {MESSAGES[idx]}
        </p>
        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%`, backgroundColor: "#2d6a4f" }}
          />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Não feche esta página.</p>
      </div>
    </div>,
    document.body,
  );
}
