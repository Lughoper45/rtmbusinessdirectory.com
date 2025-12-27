import { useState } from "react";
import { Heart, X, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Business } from "@/types/directory";
import { cn } from "@/lib/utils";

interface DiscoverySwipeProps {
  businesses: Business[];
  onSave: (business: Business) => void;
  savedBusinesses: string[];
}

const DiscoverySwipe = ({ businesses, onSave, savedBusinesses }: DiscoverySwipeProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<"left" | "right" | null>(null);

  const currentBusiness = businesses[currentIndex];

  const handleSwipe = (dir: "left" | "right") => {
    setDirection(dir);
    if (dir === "right" && currentBusiness) {
      onSave(currentBusiness);
    }
    setTimeout(() => {
      setDirection(null);
      setCurrentIndex((prev) => Math.min(prev + 1, businesses.length - 1));
    }, 300);
  };

  if (!currentBusiness) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <p className="text-xl text-muted-foreground">No more businesses to discover!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <p className="text-sm text-muted-foreground mb-4">
        {currentIndex + 1} of {businesses.length} • Swipe right to save
      </p>

      {/* Card Stack */}
      <div className="relative w-full max-w-md h-[500px]">
        <Card
          className={cn(
            "absolute inset-0 overflow-hidden transition-transform duration-300",
            direction === "left" && "-translate-x-full rotate-[-20deg] opacity-0",
            direction === "right" && "translate-x-full rotate-[20deg] opacity-0"
          )}
        >
          <div className="relative h-2/3">
            <img
              src={currentBusiness.image}
              alt={currentBusiness.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h2 className="text-2xl font-bold">{currentBusiness.name}</h2>
              <p className="text-white/80">{currentBusiness.category} • {currentBusiness.city}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-yellow-500">⭐ {currentBusiness.rating}</Badge>
                <Badge variant="secondary">{currentBusiness.priceRange}</Badge>
                {currentBusiness.isOpen && <Badge className="bg-green-500">Open</Badge>}
              </div>
            </div>
          </div>
          <div className="p-4">
            <p className="text-muted-foreground line-clamp-3">{currentBusiness.description}</p>
            <div className="flex flex-wrap gap-1 mt-3">
              {currentBusiness.features.slice(0, 4).map((f) => (
                <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-4 mt-6">
        <Button
          variant="outline"
          size="lg"
          className="h-16 w-16 rounded-full border-2 border-destructive text-destructive hover:bg-destructive hover:text-white"
          onClick={() => handleSwipe("left")}
        >
          <X size={28} />
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-12 w-12 rounded-full"
        >
          <Info size={20} />
        </Button>
        <Button
          size="lg"
          className="h-16 w-16 rounded-full bg-primary shadow-glow"
          onClick={() => handleSwipe("right")}
        >
          <Heart size={28} />
        </Button>
      </div>

      {/* Keyboard hints */}
      <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1"><ChevronLeft size={14} /> Pass</span>
        <span className="flex items-center gap-1">Save <ChevronRight size={14} /></span>
      </div>
    </div>
  );
};

export default DiscoverySwipe;
