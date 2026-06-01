import { Star } from "lucide-react";
import { useFavorites, type FavoriteRecipeData, type FavoriteOrigem } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

interface Props {
  recipe: FavoriteRecipeData;
  origem: FavoriteOrigem;
  className?: string;
  size?: "sm" | "md";
}

export function FavoriteButton({ recipe, origem, className, size = "md" }: Props) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(recipe.nome);

  const handle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggle(recipe, origem);
  };

  const dim = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={active ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      title={active ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      className={cn(
        "inline-flex items-center justify-center rounded-full border bg-background/90 backdrop-blur transition-all hover:scale-110 active:scale-95 shadow-sm",
        active ? "border-yellow-400 text-yellow-500" : "border-border text-muted-foreground hover:text-yellow-500 hover:border-yellow-400",
        dim,
        className,
      )}
    >
      <Star className={cn(icon, active && "fill-yellow-400")} />
    </button>
  );
}
