import { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2, LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  done: boolean;
  loadingLabel: string;
  doneLabel: string;
  progress: number;
  children: ReactNode;
}

const DemoShell = ({ icon: Icon, title, done, loadingLabel, doneLabel, progress, children }: Props) => (
  <div
    className="relative w-full max-w-[300px] rounded-xl bg-card/95 backdrop-blur shadow-lg border border-border p-3"
    aria-hidden="true"
  >
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
        <Icon className="w-3.5 h-3.5 text-primary" />
        {title}
      </div>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={done ? "done" : "loading"}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.2 }}
          className={`flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 ${
            done ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
          }`}
        >
          {done ? <Check className="w-3 h-3" /> : <Loader2 className="w-3 h-3 animate-spin" />}
          {done ? doneLabel : loadingLabel}
        </motion.span>
      </AnimatePresence>
    </div>
    <div className="h-1 w-full rounded-full bg-muted overflow-hidden mb-2.5">
      <motion.div
        className="h-full rounded-full bg-primary"
        animate={{ width: `${Math.min(progress, 1) * 100}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
    {children}
  </div>
);

export default DemoShell;
