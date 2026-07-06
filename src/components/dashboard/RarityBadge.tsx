import { Rarity, RARITY_INFO } from "@/lib/rarity";
import { cn } from "@/lib/utils";

interface AchievementCardProps {
  icon: string;
  title: string;
  description: string;
  rarity: Rarity;
  unlocked: boolean;
  secret?: boolean;
}

export function AchievementCard({ icon, title, description, rarity, unlocked, secret }: AchievementCardProps) {
  const info = RARITY_INFO[rarity];
  const hidden = secret && !unlocked;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center text-center p-3 rounded-xl border-2 transition-all",
        unlocked ? cn(info.borderClass, info.bgClass, info.glowClass) : "border-border bg-muted/40 opacity-60 grayscale"
      )}
    >
      <span className="text-3xl mb-1.5">{hidden ? "❓" : icon}</span>
      <p className={cn("text-xs font-semibold leading-tight", unlocked ? info.textClass : "text-foreground/80")}>
        {hidden ? "???" : title}
      </p>
      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
        {hidden ? "Conquista secreta" : description}
      </p>
      {unlocked && (
        <span
          className="mt-2 text-[9px] font-bold px-2 py-0.5 rounded-full"
          style={{ color: info.color, borderColor: info.color, border: "1px solid" }}
        >
          {info.label.toUpperCase()}
        </span>
      )}
    </div>
  );
}
