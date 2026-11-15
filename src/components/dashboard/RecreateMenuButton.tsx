import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Props = { remaining: number; limit: number; unlimited?: boolean; disabled?: boolean; onConfirm: () => void; size?: "sm" | "default" };

export function RecreateMenuButton({ remaining, limit, unlimited, disabled, onConfirm, size = "default" }: Props) {
  const blocked = !unlimited && remaining <= 0;
  return (
    <div className="flex flex-col items-start gap-1">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size={size} disabled={blocked || disabled}>
            <RefreshCw className="mr-2 h-4 w-4" /> Recriar Cardápio
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              O cardápio atual será apagado e substituído por um novo, criado com as mesmas informações que você já preencheu. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm} style={{ backgroundColor: "#2d6a4f", color: "#ffffff" }} className="hover:opacity-90">
              Sim, recriar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {!unlimited && (
        <p className="text-xs text-muted-foreground">
          {blocked ? "Você atingiu seu limite de 4 cardápios este mês." : `Criações restantes este mês: ${remaining} de ${limit}`}
        </p>
      )}
    </div>
  );
}
