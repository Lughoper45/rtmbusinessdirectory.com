import { Search, Building2, DollarSign, Bot, Trophy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  const valuePills = [
    { icon: Building2, text: "50,000+ Businesses" },
    { icon: DollarSign, text: "$2.3B+ in Grants" },
    { icon: Bot, text: "AI Support Tools" },
    { icon: Trophy, text: "World Cup Ready" },
  ];

  const popularSearches = [
    "Restaurants Toronto",
    "Small Business Grants",
    "Electricians Vancouver",
  ];

  return (
    <section className="relative min-h-[650px] md:min-h-[580px] lg:min-h-[650px] gradient-hero overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.03]">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-primary">
            <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" />
          </svg>
        </div>
      </div>

      <div className="container mx-auto max-w-[1280px] px-6 py-16 md:py-20 relative z-10">
        <div className="text-center max-w-[900px] mx-auto">
          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-[1.1] mb-6 animate-fade-up">
            Where Canadian Businesses{" "}
            <span className="text-gradient">Take Off</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-[700px] mx-auto mb-10 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            Discover trusted businesses • Access funding • Get expert support • Grow faster
          </p>

          {/* Search Bar */}
          <div className="max-w-[800px] mx-auto mb-6 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="relative bg-background border-2 border-border rounded-2xl shadow-heavy p-2 flex items-center gap-2 hover:border-primary/30 transition-colors focus-within:border-primary focus-within:shadow-glow">
              <Search className="w-6 h-6 text-muted-foreground ml-4 shrink-0" />
              <input
                type="text"
                placeholder="Search businesses, grants, or ask anything..."
                className="flex-1 bg-transparent text-lg text-foreground placeholder:text-muted-foreground outline-none py-3"
              />
              <Button variant="hero" size="lg" className="shrink-0">
                Search
              </Button>
            </div>
          </div>

          {/* Popular Searches */}
          <p className="text-sm text-muted-foreground mb-10 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            Popular:{" "}
            {popularSearches.map((search, index) => (
              <span key={search}>
                <a href="#" className="text-primary hover:underline">
                  {search}
                </a>
                {index < popularSearches.length - 1 && " • "}
              </span>
            ))}
          </p>

          {/* Value Proposition Pills */}
          <div className="flex flex-wrap justify-center gap-4 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            {valuePills.map((pill) => (
              <div
                key={pill.text}
                className="flex items-center gap-2 bg-background border border-border rounded-full px-5 py-3 shadow-soft hover:shadow-medium hover:border-primary/30 transition-all"
              >
                <Check className="w-5 h-5 text-primary" />
                <span className="text-sm md:text-base font-medium text-foreground">
                  {pill.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
