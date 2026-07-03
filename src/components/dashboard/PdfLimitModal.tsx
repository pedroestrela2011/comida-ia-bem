import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export function PdfLimitModal({
  open,
  onOpenChange,
  used,
  limit,
  planLabel,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  used: number;
  limit: number;
  planLabel: string;
}) {
  const navigate = useNavigate();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <DialogTitle>Limite de PDFs atingido</DialogTitle>
          </div>
          <DialogDescription>
            Você atingiu seu limite de PDFs este mês. Faça upgrade para continuar baixando!
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-1 text-sm">
          <p><span className="text-muted-foreground">Plano atual:</span> <strong>{planLabel}</strong></p>
          <p><span className="text-muted-foreground">Usados este mês:</span> <strong>{used} de {limit}</strong></p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button
            onClick={() => { onOpenChange(false); navigate("/planos"); }}
            style={{ backgroundColor: "#2d6a4f", color: "#ffffff" }}
            className="hover:opacity-90"
          >
            Ver Planos →
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function PdfRemainingBadge({ used, limit, isUnlimited }: { used: number; limit: number; isUnlimited: boolean }) {
  if (isUnlimited) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        PDFs: ilimitados
      </span>
    );
  }
  const remaining = Math.max(0, limit - used);
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      PDFs restantes este mês: <strong className="text-foreground">{remaining} de {limit}</strong>
    </span>
  );
}
