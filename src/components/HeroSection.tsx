import { useState, useEffect, useRef } from "react";
import { Search, Building2, DollarSign, Bot, Trophy, Check, Sparkles, TrendingUp, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SuccessSimulator from "./SuccessSimulator";
import heroBackground from "@/assets/hero-background.jpg";
import { DIRECTORY_COUNT_LABEL, PUBLIC_POSITIONING } from "@/content/siteCopy";
import { openGrowPortal } from "@/lib/site";

const HeroSection = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [activeProvince, setActiveProvince] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  // Parallax mouse effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        setMousePosition({
          x: (e.clientX - rect.left - rect.width / 2) / 50,
          y: (e.clientY - rect.top - rect.height / 2) / 50,
        });
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/directory?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate("/directory");
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const valuePills = [
    { icon: Building2, text: DIRECTORY_COUNT_LABEL, color: "text-primary", action: () => navigate("/directory") },
    { icon: DollarSign, text: "Grant guidance", color: "text-accent", action: () => navigate("/grants") },
    { icon: Bot, text: "Growth services", color: "text-primary", action: () => openGrowPortal("/") },
    { icon: Trophy, text: "World Cup Ready", color: "text-accent", action: () => navigate("/directory?filter=world-cup") },
  ];

  const popularSearches = [
    "Restaurants Toronto",
    "Small Business Grants",
    "Electricians Vancouver",
  ];

  const provinceStats: Record<string, { businesses: string; grants: string }> = {
    ON: { businesses: "18,500+", grants: "$890M" },
    BC: { businesses: "9,200+", grants: "$450M" },
    AB: { businesses: "7,800+", grants: "$380M" },
    QC: { businesses: "12,100+", grants: "$520M" },
  };

  return (
    <section 
      ref={heroRef}
      className="relative min-h-[750px] md:min-h-[700px] lg:min-h-[800px] overflow-hidden"
    >
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      {/* Keep the image visible while protecting the text area */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/30 via-slate-950/10 to-transparent" />
      <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-background/95 via-background/82 to-background/18 lg:w-[62%]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/65 to-transparent" />
      
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-primary/10 animate-float"
            style={{
              width: Math.random() * 60 + 20,
              height: Math.random() * 60 + 20,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${Math.random() * 10 + 10}s`,
            }}
          />
        ))}
      </div>

      {/* 3D floating shapes with parallax */}
      <div 
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }}
      >
        <div className="absolute top-20 left-[10%] w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-[10%] w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-[0.03]">
          <svg viewBox="0 0 100 100" className="w-full h-full fill-primary animate-spin-slow">
            <path d="M50 5 L60 40 L95 50 L60 60 L50 95 L40 60 L5 50 L40 40 Z" />
          </svg>
        </div>
      </div>

      <div className="container mx-auto max-w-[1280px] px-6 py-16 md:py-20 relative z-10">
        <div className="mx-auto max-w-[900px] rounded-[2rem] px-4 py-6 text-center backdrop-blur-[1px] md:px-8 md:py-8">
          {/* Live counter badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8 animate-fade-up">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            <span className="text-sm font-medium text-foreground">Canadian business discovery, deals, and support</span>
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-foreground leading-[1.1] mb-6 animate-fade-up">
            Discover & List{" "}
            <span className="text-gradient relative inline-block">
              Businesses
              <Sparkles className="absolute -right-8 -top-4 w-6 h-6 text-accent animate-pulse" />
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-[700px] mx-auto mb-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            {PUBLIC_POSITIONING}
          </p>

          {/* Interactive Success Simulator Trigger */}
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium mb-10 animate-fade-up group"
            style={{ animationDelay: "0.15s" }}
          >
            <Sparkles className="w-5 h-5 group-hover:animate-spin" />
            See your potential success
            <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">Interactive</span>
          </button>

          {/* Search Bar */}
          <div className="max-w-[800px] mx-auto mb-6 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative bg-background border-2 border-border rounded-2xl shadow-heavy p-2 flex items-center gap-2 hover:border-primary/30 transition-all duration-300 focus-within:border-primary focus-within:shadow-glow transform hover:scale-[1.01]">
                <Search className="w-6 h-6 text-muted-foreground ml-4 shrink-0" />
                <input
                  type="text"
                  placeholder="Search businesses, deals, grants guidance..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="flex-1 bg-transparent text-lg text-foreground placeholder:text-muted-foreground outline-none py-3"
                />
                <Button variant="hero" size="lg" className="shrink-0 group" onClick={handleSearch}>
                  <span>Search</span>
                  <Sparkles className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </div>
            </div>
          </div>

          {/* Popular Searches */}
          <p className="text-sm text-muted-foreground mb-10 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            Popular:{" "}
            {popularSearches.map((search, index) => (
              <span key={search}>
                <button
                  onClick={() => navigate(`/directory?search=${encodeURIComponent(search)}`)}
                  className="text-primary hover:underline hover:text-primary/80 transition-colors"
                >
                  {search}
                </button>
                {index < popularSearches.length - 1 && " • "}
              </span>
            ))}
          </p>

          {/* Value Proposition Pills */}
          <div className="flex flex-wrap justify-center gap-4 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            {valuePills.map((pill, index) => (
              <button
                key={pill.text}
                onClick={pill.action}
                className="group flex items-center gap-2 bg-background border border-border rounded-full px-5 py-3 shadow-soft hover:shadow-medium hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
              >
                <div className="relative">
                  <Check className="w-5 h-5 text-primary transition-transform group-hover:scale-110" />
                </div>
                <span className="text-sm md:text-base font-medium text-foreground">
                  {pill.text}
                </span>
              </button>
            ))}
          </div>

          {/* Mini Province Map Preview */}
          <div className="mt-12 animate-fade-up" style={{ animationDelay: "0.5s" }}>
            <p className="text-xs text-muted-foreground mb-4 flex items-center justify-center gap-2">
              <MapPin className="w-4 h-4" />
              Hover to see regional stats
            </p>
            <div className="flex justify-center gap-3">
              {Object.entries(provinceStats).map(([province, stats]) => (
                <button
                  key={province}
                  onMouseEnter={() => setActiveProvince(province)}
                  onMouseLeave={() => setActiveProvince(null)}
                  onClick={() => navigate(`/directory?province=${province}`)}
                  className={`relative px-4 py-2 rounded-lg border transition-all duration-300 ${
                    activeProvince === province
                      ? "bg-primary text-primary-foreground border-primary scale-105"
                      : "bg-background border-border hover:border-primary/50"
                  }`}
                >
                  <span className="font-bold">{province}</span>
                  {activeProvince === province && (
                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-navy text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap z-20 animate-fade-up">
                      <div>{stats.businesses} businesses</div>
                      <div>{stats.grants} in grants</div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background via-background/50 to-transparent" />

      {/* Success Simulator Modal */}
      <SuccessSimulator isOpen={isSimulatorOpen} onClose={() => setIsSimulatorOpen(false)} />
    </section>
  );
};

export default HeroSection;
