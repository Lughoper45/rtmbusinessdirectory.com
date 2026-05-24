import { Loader2 } from "lucide-react";
import type { LaunchBotAction } from "@/types/launchBot";

type LaunchBotActionBarProps = {
  actions: LaunchBotAction[];
  busy?: boolean;
  onAction: (action: LaunchBotAction) => void;
};

const styleClass = (style: LaunchBotAction["style"]) => {
  switch (style) {
    case "primary":
      return "bg-gradient-to-r from-primary to-accent text-white border-transparent hover:opacity-90";
    case "secondary":
      return "bg-secondary text-foreground border-border hover:border-primary/40";
    default:
      return "bg-transparent text-foreground border-border hover:border-primary/50";
  }
};

const LaunchBotActionBar = ({ actions, busy, onAction }: LaunchBotActionBarProps) => {
  if (!actions.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border/50">
      {actions.map((action, i) => (
        <button
          key={`${action.id}-${action.label}-${i}`}
          type="button"
          disabled={busy}
          onClick={() => onAction(action)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-50 ${styleClass(action.style)}`}
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          {action.label}
        </button>
      ))}
    </div>
  );
};

export default LaunchBotActionBar;
