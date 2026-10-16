import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password: string;
}

const requirements = [
  { label: "Pelo menos 8 caracteres", test: (p: string) => p.length >= 8 },
  { label: "Pelo menos 1 número", test: (p: string) => /[0-9]/.test(p) },
  { label: "Pelo menos 1 letra maiúscula", test: (p: string) => /[A-Z]/.test(p) },
];

const PasswordStrength = ({ password }: PasswordStrengthProps) => {
  const met = requirements.map((r) => r.test(password));
  const score = met.filter(Boolean).length;
  const empty = password.length === 0;

  // 0-1 requisitos = Fraca, 2 = Média, 3 = Forte
  const level = score <= 1 ? 0 : score === 2 ? 1 : 2;
  const config = [
    { label: "Fraca", bar: "bg-red-500", text: "text-red-600", width: "w-1/3" },
    { label: "Média", bar: "bg-yellow-500", text: "text-yellow-600", width: "w-2/3" },
    { label: "Forte", bar: "bg-green-600", text: "text-green-600", width: "w-full" },
  ][level];

  return (
    <div className="space-y-2 pt-1" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              empty ? "w-0 bg-muted-foreground/30" : cn(config.bar, config.width)
            )}
          />
        </div>
        <span
          className={cn(
            "text-xs font-semibold min-w-[4.5rem] text-right",
            empty ? "text-muted-foreground" : config.text
          )}
        >
          {empty ? "Requisitos" : config.label}
        </span>
      </div>
      <p className="text-xs font-medium text-muted-foreground">A senha precisa ter:</p>
      <ul className="space-y-1">
        {requirements.map((r, i) => (
          <li
            key={r.label}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              met[i] ? "text-green-600" : "text-muted-foreground"
            )}
          >
            {met[i] ? <Check size={13} /> : <X size={13} className="opacity-50" />}
            {r.label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PasswordStrength;
