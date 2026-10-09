import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const KEY = "comafacil_aviso_responsabilidade_aceito_v1";

const HealthDisclaimerModal = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(KEY, new Date().toISOString());
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-md [&>button]:hidden"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">Aviso de Responsabilidade em Saúde</DialogTitle>
          <DialogDescription className="text-center">
            Leia antes de continuar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p>
            Cardápios, receitas, análises e respostas do ComaFacil são gerados por inteligência
            artificial e têm finalidade apenas informativa e educativa.
          </p>
          <p>
            O ComaFacil <strong className="text-foreground">não substitui</strong> nutricionista,
            médico ou outro profissional de saúde. Se você tem diabetes, hipertensão, alergias,
            está gestante ou usa medicamentos contínuos, consulte um profissional antes de seguir
            qualquer orientação.
          </p>
          <p>
            Ao continuar, você concorda com os{" "}
            <Link to="/termos" className="text-primary underline">Termos de Uso</Link>, a{" "}
            <Link to="/privacidade" className="text-primary underline">Política de Privacidade</Link>{" "}
            e o{" "}
            <Link to="/aviso-medico" className="text-primary underline">Aviso de Saúde</Link>.
          </p>
        </div>
        <DialogFooter>
          <Button className="w-full" size="lg" onClick={accept}>
            Entendi e concordo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HealthDisclaimerModal;
