import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** Loop de passos para as animações de demonstração. */
export const useDemoStep = (total: number, finalStep: number, ms = 1000) => {
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(reduceMotion ? finalStep : 0);
  useEffect(() => {
    if (reduceMotion) {
      setStep(finalStep);
      return;
    }
    const id = setInterval(() => setStep((s) => (s + 1) % total), ms);
    return () => clearInterval(id);
  }, [reduceMotion, total, finalStep, ms]);
  return step;
};
