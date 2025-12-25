import { Target, Map, Shuffle, Trophy, Film, Heart, Flame, LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DiscoveryMode } from "@/types/directory";
import { cn } from "@/lib/utils";

interface DiscoveryModeSelectorProps {
  mode: DiscoveryMode;
  setMode: (mode: DiscoveryMode) => void;
  viewType: "grid" | "list";
  setViewType: (type: "grid" | "list") => void;
}

const modes: { id: DiscoveryMode; icon: React.ReactNode; label: string; description: string }[] = [
  { id: "mission", icon: <Target size={18} />, label: "Mission", description: "I know what I want" },
  { id: "map", icon: <Map size={18} />, label: "Map", description: "Show me what's around" },
  { id: "discovery", icon: <Shuffle size={18} />, label: "Surprise", description: "Discover something great" },
  { id: "best", icon: <Trophy size={18} />, label: "Best", description: "Show me the best" },
  { id: "story", icon: <Film size={18} />, label: "Stories", description: "Browse like Netflix" },
  { id: "saved", icon: <Heart size={18} />, label: "Saved", description: "My favorites" },
  { id: "trending", icon: <Flame size={18} />, label: "Trending", description: "What's hot right now" },
];

const DiscoveryModeSelector = ({ mode, setMode, viewType, setViewType }: DiscoveryModeSelectorProps) => {
  return (
    <div className="bg-card border-b border-border">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Mode Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-sm text-muted-foreground whitespace-nowrap mr-2 hidden sm:block">
              How do you want to explore?
            </span>
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all duration-200 whitespace-nowrap",
                  mode === m.id
                    ? "bg-primary text-primary-foreground border-primary shadow-glow"
                    : "bg-card text-foreground border-border hover:border-primary hover:shadow-soft"
                )}
              >
                {m.icon}
                <span className="font-medium">{m.label}</span>
              </button>
            ))}
          </div>

          {/* View Toggle (only for grid/list modes) */}
          {["mission", "best", "saved", "trending"].includes(mode) && (
            <div className="flex items-center gap-1 ml-4 bg-muted rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-md",
                  viewType === "grid" && "bg-background shadow-sm"
                )}
                onClick={() => setViewType("grid")}
              >
                <LayoutGrid size={16} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-md",
                  viewType === "list" && "bg-background shadow-sm"
                )}
                onClick={() => setViewType("list")}
              >
                <List size={16} />
              </Button>
            </div>
          )}
        </div>

        {/* Active Mode Description */}
        <p className="text-sm text-muted-foreground mt-2 sm:hidden">
          {modes.find((m) => m.id === mode)?.description}
        </p>
      </div>
    </div>
  );
};

export default DiscoveryModeSelector;
