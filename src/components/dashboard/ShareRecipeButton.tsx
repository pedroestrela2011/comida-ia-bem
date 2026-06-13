import { useState } from "react";
import { Share2, Download, Image as ImageIcon, Send, Loader2, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { downloadCbRecipe, generateRecipeCard } from "@/lib/cbrecipe";
import { supabase } from "@/integrations/supabase/client";
import type { FavoriteRecipeData } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

interface Props {
  recipe: FavoriteRecipeData;
  variant?: "default" | "ghost" | "outline";
  size?: "sm" | "default" | "icon";
  className?: string;
  label?: string;
}

export function ShareRecipeButton({ recipe, variant = "outline", size = "sm", className, label }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [generatingImg, setGeneratingImg] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleDownload = () => {
    downloadCbRecipe(recipe);
    setSuccess("Arquivo .cbrecipe baixado!");
    setTimeout(() => setSuccess(null), 2200);
  };

  const handleImageShare = async () => {
    setGeneratingImg(true);
    try {
      const blob = await generateRecipeCard(recipe);
      const file = new File([blob], `${recipe.nome}.png`, { type: "image/png" });
      const nav: any = navigator;
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: recipe.nome, text: `Confira essa receita no NutriPlus 🌿` });
        setSuccess("Card compartilhado!");
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${recipe.nome}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setSuccess("Card baixado! Compartilhe nas suas redes.");
      }
      setTimeout(() => setSuccess(null), 2500);
    } catch (e: any) {
      toast({ title: "Erro ao gerar card", description: e.message, variant: "destructive" });
    } finally {
      setGeneratingImg(false);
    }
  };

  const handleSendToUser = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast({ title: "Informe um e-mail válido", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-recipe", {
        body: { email: email.trim().toLowerCase(), recipe },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setSuccess(`Receita enviada para ${email.trim()}!`);
      setEmail("");
      toast({ title: "Receita enviada com sucesso! 🎉" });
      setTimeout(() => setSuccess(null), 2500);
    } catch (e: any) {
      toast({ title: "Não foi possível enviar", description: e.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          className={cn("gap-1.5", className)}
          onClick={(e) => e.stopPropagation()}
        >
          <Share2 className={size === "icon" ? "h-4 w-4" : "h-3.5 w-3.5"} />
          {size !== "icon" && (label ?? "Compartilhar")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Compartilhar Receita
          </DialogTitle>
          <DialogDescription>{recipe.nome}</DialogDescription>
        </DialogHeader>

        {success && (
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 flex items-center gap-2 text-sm text-primary animate-in fade-in-0 slide-in-from-top-2">
            <Check className="h-4 w-4" /> {success}
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleDownload}
            className="w-full text-left rounded-lg border border-border p-4 hover:border-primary/50 hover:bg-accent transition-all flex items-start gap-3"
          >
            <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Download className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Exportar arquivo .cbrecipe</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Formato exclusivo NutriPlus. Compartilhe por WhatsApp, e-mail, Telegram…
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleImageShare}
            disabled={generatingImg}
            className="w-full text-left rounded-lg border border-border p-4 hover:border-primary/50 hover:bg-accent transition-all flex items-start gap-3 disabled:opacity-60"
          >
            <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              {generatingImg ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Compartilhar card da receita</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Imagem elegante para Instagram, Facebook, WhatsApp, X…
              </p>
            </div>
          </button>

          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Send className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Enviar para outro usuário NutriPlus</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  A receita chegará na aba "Receitas Recebidas" da pessoa.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-email" className="text-xs">E-mail do destinatário</Label>
              <div className="flex gap-2">
                <Input
                  id="share-email"
                  type="email"
                  placeholder="amigo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={sending}
                />
                <Button onClick={handleSendToUser} disabled={sending || !email.trim()}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
