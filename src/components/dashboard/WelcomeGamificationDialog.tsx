import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onConfirm: () => void;
}

export function WelcomeGamificationDialog({ open, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onConfirm(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Jornada de Evolução
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="text-center text-5xl">🌱</div>
          <p className="text-sm text-foreground/90 text-center leading-relaxed">
            Bem-vindo à sua Jornada de Evolução! Acumule XP, desbloqueie conquistas e
            transforme sua alimentação em uma aventura diária.
          </p>
          <Button onClick={onConfirm} className="w-full">
            Vamos lá! →
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
