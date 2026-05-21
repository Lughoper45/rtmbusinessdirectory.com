import { useState, useEffect } from "react";
import { Rocket, X, ArrowRight, Sparkles, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const StickyFloatingCTA = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ minutes: 14, seconds: 59 });

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsVisible(scrollY > 500 && !isDismissed);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isDismissed]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { minutes: prev.minutes - 1, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-2">
      {isExpanded && (
        <div className="bg-background border border-border rounded-2xl shadow-xl p-4 w-80 animate-scale-up origin-bottom-right">
          <button
            onClick={() => setIsExpanded(false)}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Limited Time Offer</p>
              <p className="text-xs text-muted-foreground">Priority processing available</p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-center gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </div>
                <div className="text-xs text-muted-foreground">min</div>
              </div>
              <div className="text-2xl font-bold text-muted-foreground">:</div>
              <div>
                <div className="text-2xl font-bold text-primary">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </div>
                <div className="text-xs text-muted-foreground">sec</div>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground mt-2">
              Get priority processing + free consultation
            </p>
          </div>
          
          <Button variant="hero" className="w-full group" onClick={() => navigate("/auth")}>
            <span>Start Now</span>
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <p className="text-xs text-muted-foreground text-center mt-3">
            No credit card required • Setup in 2 min
          </p>
        </div>
      )}

      <div className="relative group">
        <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-20" />
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="relative flex items-center gap-3 bg-gradient-to-r from-primary to-accent text-primary-foreground px-6 py-4 rounded-full shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:scale-105"
        >
          <Rocket className="w-5 h-5" />
          <span className="font-semibold hidden sm:inline">Start Your Business</span>
          <span className="font-semibold sm:hidden">Start</span>
          <div className="hidden sm:flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
            <Sparkles className="w-3 h-3" />
            <span className="text-xs font-medium">15 min</span>
          </div>
        </button>
      </div>

      <button
        onClick={() => setIsDismissed(true)}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        Hide
      </button>
    </div>
  );
};

export default StickyFloatingCTA;
