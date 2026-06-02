import { useState, useEffect, useRef } from "react";
import { Search, Building2, DollarSign, Bot, Trophy, Check, Sparkles, TrendingUp, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SuccessSimulator from "./SuccessSimulator";
import heroBackground from "@/assets/48yvo.jpg";
import { DIRECTORY_COUNT_LABEL, PUBLIC_POSITIONING } from "@/content/siteCopy";
import { openGrowPortal } from "@/lib/site";

const HeroSection = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [activeProvince, setActiveProvince] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLElement>(null);

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
    { icon: Building2, text: DIRECTORY_COUNT_LABEL, action: () => navigate("/directory") },
    { icon: DollarSign, text: "Free grant profile", action: () => navigate("/grants") },
    { icon: Bot, text: "Growth services", action: () => openGrowPortal("/") },
    { icon: Trophy, text: "World Cup Ready", action: () => navigate("/directory?filter=world-cup") },
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
      className="relative min-h-[92vh] flex items-center overflow-hidden"
      aria-label="Discover Canadian businesses"
    >
      <img
        src={heroBackground}
        alt="Toronto skyline at dusk with CN Tower"
        className="absolute inset-0 h-full w-full object-cover object-[center_35%]"
        fetchPriority="high"
      />

      <div className="absolute inset-0 bg-slate-950/45" />
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950/55 via-slate-900/35 to-slate-950/25" />
      <div className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-slate-950/88 via-slate-950/72 to-slate-950/35 lg:w-[70%]" />
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-white/20 animate-pulse"
            style={{
              left: `${(i * 17) % 100}%`,
              top: `${(i * 23) % 100}%`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <div
        className="pointer-events-none absolute right-[8%] top-[20%] h-32 w-32 rounded-full bg-primary/20 blur-3xl transition-transform duration-300"
        style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }}
      />
      <div
        className="pointer-events-none absolute bottom-[25%] left-[12%] h-24 w-24 rounded-full bg-accent/15 blur-2xl transition-transform duration-300"
        style={{ transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)` }}
      />

      <div className="container relative z-10 mx-auto max-w-[1280px] px-6 py-20 md:py-28">
        <div className="mx-auto max-w-[900px] rounded-[2rem] border border-white/10 bg-slate-950/40 px-4 py-6 text-center shadow-2xl backdrop-blur-md md:px-8 md:py-8">
          <div className="mb-8 inline-flex animate-fade-up items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-2 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-sm font-medium text-white">Canadian business discovery, deals, and support</span>
            <TrendingUp className="h-4 w-4 text-emerald-300" />
          </div>

          <h1 className="mb-6 animate-fade-up text-4xl font-extrabold leading-[1.1] text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] md:text-5xl lg:text-7xl">
            Discover & List{" "}
            <span className="relative inline-block text-primary drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
              Businesses
              <Sparkles className="absolute -right-8 -top-4 h-6 w-6 animate-pulse text-amber-300" />
            </span>
          </h1>

          <p
            className="mx-auto mb-8 max-w-[700px] animate-fade-up text-lg font-medium text-white/95 drop-shadow-sm md:text-xl"
            style={{ animationDelay: "0.1s" }}
          >
            {PUBLIC_POSITIONING}
          </p>

          <button
            type="button"
            onClick={() => setIsSimulatorOpen(true)}
            className="group mb-10 inline-flex animate-fade-up items-center gap-2 font-semibold text-amber-200 transition-colors hover:text-white"
            style={{ animationDelay: "0.15s" }}
          >
            <Sparkles className="h-5 w-5 shrink-0 group-hover:animate-spin" />
            <span>See your potential success</span>
            <span className="inline-flex items-center rounded-full bg-amber-400 px-2.5 py-0.5 text-xs font-bold leading-none text-slate-900">
              Interactive
            </span>
          </button>

          <div className="relative mx-auto mb-6 max-w-[700px] animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 opacity-60 blur-lg" />
            <div className="relative flex items-center gap-2 rounded-2xl border-2 border-border bg-background p-2 shadow-heavy transition-all duration-300 focus-within:border-primary focus-within:shadow-glow hover:border-primary/30 hover:scale-[1.01]">
              <Search className="ml-3 h-6 w-6 shrink-0 self-center text-muted-foreground" aria-hidden />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search businesses, deals, grants guidance..."
                className="min-w-0 flex-1 bg-transparent py-3 text-lg text-foreground outline-none placeholder:text-muted-foreground"
                aria-label="Search businesses, deals, and grants"
              />
              <Button variant="hero" size="lg" className="shrink-0 rounded-xl px-6" onClick={handleSearch}>
                Search
              </Button>
            </div>
          </div>

          <p className="mb-4 animate-fade-up text-sm text-white/85" style={{ animationDelay: "0.3s" }}>
            <span className="text-white/70">Popular:</span>{" "}
            {popularSearches.map((search, index) => (
              <span key={search}>
                <button
                  type="button"
                  onClick={() => navigate(`/directory?search=${encodeURIComponent(search)}`)}
                  className="font-medium text-white underline-offset-2 transition-colors hover:text-amber-200 hover:underline"
                >
                  {search}
                </button>
                {index < popularSearches.length - 1 && <span className="text-white/50"> · </span>}
              </span>
            ))}
          </p>

          <div className="mb-8 animate-fade-up" style={{ animationDelay: "0.35s" }}>
            <button
              type="button"
              onClick={() => navigate("/grants")}
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              <DollarSign className="h-4 w-4 text-emerald-300" />
              Start your free grant profile — no credit card required
            </button>
          </div>

          <div
            className="mx-auto grid max-w-4xl animate-fade-up grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
            style={{ animationDelay: "0.4s" }}
          >
            {valuePills.map((pill) => (
                <button
                  key={pill.text}
                  type="button"
                  onClick={pill.action}
                  className="group flex cursor-pointer items-center justify-center gap-2 rounded-full border border-border bg-background px-3 py-2.5 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-medium sm:px-4 sm:py-3"
                >
                  <Check className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:scale-110 sm:h-5 sm:w-5" />
                  <span className="text-left text-xs font-medium leading-snug text-foreground sm:text-sm">{pill.text}</span>
                </button>
            ))}
          </div>

          <div className="mt-10 animate-fade-up" style={{ animationDelay: "0.5s" }}>
            <p className="mb-4 flex items-center justify-center gap-2 text-xs text-white/75">
              <MapPin className="h-3.5 w-3.5" />
              Hover to see regional stats
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {Object.entries(provinceStats).map(([province, stats]) => (
                <button
                  key={province}
                  type="button"
                  onMouseEnter={() => setActiveProvince(province)}
                  onMouseLeave={() => setActiveProvince(null)}
                  onClick={() => navigate(`/directory?province=${province}`)}
                  className={`relative rounded-lg border px-4 py-2 transition-all duration-300 ${
                    activeProvince === province
                      ? "scale-105 border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary/50"
                  }`}
                >
                  <span className="font-bold">{province}</span>
                  {activeProvince === province && (
                    <div className="absolute left-1/2 top-full z-20 mt-2 w-40 -translate-x-1/2 rounded-lg border border-border bg-background p-2 text-left text-xs shadow-heavy">
                      <p className="font-medium text-foreground">{stats.businesses} businesses</p>
                      <p className="text-muted-foreground">{stats.grants} in grants</p>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 text-background">
        <svg viewBox="0 0 1440 120" fill="currentColor" className="w-full" preserveAspectRatio="none">
          <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" />
        </svg>
      </div>

      <SuccessSimulator isOpen={isSimulatorOpen} onClose={() => setIsSimulatorOpen(false)} />
    </section>
  );
};

export default HeroSection;
