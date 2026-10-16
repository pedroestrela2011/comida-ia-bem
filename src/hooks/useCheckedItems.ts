import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Marcações de "já comprei" da lista de compras, guardadas no aparelho.
 * Cada storageKey isola as marcações de um cardápio, dieta adaptada ou modo esporte,
 * para que marcar itens de um cardápio não afete outro.
 */
export function useCheckedItems(storageKey: string) {
  const read = (key: string): Record<string, boolean> => {
    try {
      const raw = localStorage.getItem(`lista-compras:${key}`);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === "object" ? (parsed as Record<string, boolean>) : {};
    } catch {
      return {};
    }
  };

  const [checked, setChecked] = useState<Record<string, boolean>>(() => read(storageKey));
  const keyRef = useRef(storageKey);

  useEffect(() => {
    // Ao trocar de cardápio, carrega as marcações dele antes de gravar qualquer coisa.
    if (keyRef.current !== storageKey) {
      keyRef.current = storageKey;
      setChecked(read(storageKey));
      return;
    }
    try {
      localStorage.setItem(`lista-compras:${storageKey}`, JSON.stringify(checked));
    } catch {
      /* armazenamento indisponível: segue sem persistir */
    }
  }, [storageKey, checked]);

  const toggle = useCallback(
    (key: string) => setChecked((c) => ({ ...c, [key]: !c[key] })),
    []
  );

  const markAll = useCallback(
    (keys: string[]) =>
      setChecked(() => {
        const next: Record<string, boolean> = {};
        keys.forEach((k) => { next[k] = true; });
        return next;
      }),
    []
  );

  const clear = useCallback(() => setChecked({}), []);

  return { checked, setChecked, toggle, markAll, clear };
}
