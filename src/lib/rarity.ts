export type Rarity = "comum" | "rara" | "epica" | "lendaria";

export const RARITY_INFO: Record<Rarity, { label: string; color: string; borderClass: string; bgClass: string; textClass: string; glowClass: string }> = {
  comum: {
    label: "Comum",
    color: "#9ca3af",
    borderClass: "border-[#9ca3af]/60",
    bgClass: "bg-[#9ca3af]/10",
    textClass: "text-[#6b7280] dark:text-[#d1d5db]",
    glowClass: "",
  },
  rara: {
    label: "Rara",
    color: "#3b82f6",
    borderClass: "border-[#3b82f6]/70",
    bgClass: "bg-[#3b82f6]/10",
    textClass: "text-[#2563eb] dark:text-[#93c5fd]",
    glowClass: "shadow-[0_0_12px_rgba(59,130,246,0.35)]",
  },
  epica: {
    label: "Épica",
    color: "#8b5cf6",
    borderClass: "border-[#8b5cf6]/70",
    bgClass: "bg-[#8b5cf6]/10",
    textClass: "text-[#7c3aed] dark:text-[#c4b5fd]",
    glowClass: "shadow-[0_0_14px_rgba(139,92,246,0.45)] animate-epic-pulse",
  },
  lendaria: {
    label: "Lendária",
    color: "#f59e0b",
    borderClass: "border-[#f59e0b]",
    bgClass: "bg-gradient-to-br from-[#fde68a]/40 to-[#f59e0b]/20",
    textClass: "text-[#b45309] dark:text-[#fde68a]",
    glowClass: "shadow-[0_0_18px_rgba(245,158,11,0.55)] animate-legendary-shine",
  },
};
