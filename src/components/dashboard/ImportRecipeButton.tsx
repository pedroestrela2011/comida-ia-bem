import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { readCbRecipeFile } from "@/lib/cbrecipe";
import type { FavoriteRecipeData } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

interface Props {
  onImport: (recipe: FavoriteRecipeData) => void;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "default";
  className?: string;
  label?: string;
}

export function ImportRecipeButton({ onImport, variant = "outline", size = "sm", className, label = "Importar Receita" }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (file: File) => {
    setLoading(true);
    try {
      const recipe = await readCbRecipeFile(file);
      onImport(recipe);
      toast({ title: "Receita importada!", description: recipe.nome });
    } catch (e: any) {
      toast({ title: "Erro ao importar", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={ref}
        type="file"
        accept=".cbrecipe,application/json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn("gap-1.5", className)}
        onClick={() => ref.current?.click()}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {label}
      </Button>
    </>
  );
}
