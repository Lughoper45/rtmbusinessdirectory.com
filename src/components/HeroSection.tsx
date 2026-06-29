import { useState } from "react";
import {
  Award,
  Handshake,
  Search,
  Sparkles,
  Tag,
  TrendingUp,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SuccessSimulator from "./SuccessSimulator";
import heroBackground from "@/assets/48yvo.jpg";
import { PUBLIC_POSITIONING } from "@/content/siteCopy";

const stats = [
  { icon: Users, value: "25,000+", label: "Businesses Listed" },
  { icon: Tag, value: "12,000+", label: "Member Deals" },
  { icon: Award, value: "500+", label: "Grants & Programs" },
  { icon: Handshake, value: "50,000+", label: "Successful Connections" },
];

const popularCategories = ["Restaurants", "Contractors", "Marketing", "Real Estate", "Accounting"];

const HeroSection = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const handleSearch = () => {
    const q = searchQuery.trim();
    navigate(q ? `/directory?search=${encodeURIComponent(q)}` : "/directory");
  };

  return (
    <section className="relative flex min-h-[800px] flex-col overflow-hidden lg:min-h-[860px]">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      {/* Uniform dark overlay — keeps image visible */}
      <div className="absolute inset-0 bg-slate-950/50" />
      {/* Bottom vignette */}
      <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-950/80 to-transparent" />

      {/* Hero content */}
      <div className="container relative z-10 mx-auto flex max-w-[1280px] flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <div className="mx-auto w-full max-w-[860px]">
          {/* Live badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/40 px-5 py-2.5 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span className="text-sm font-medium text-white">Canadian business discovery, deals, and support</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-5xl font-extrabold leading-[1.08] text-white md:text-6xl lg:text-7xl">
            Discover &amp; List{" "}
            <span className="text-primary">Businesses</span>
          </h1>

          {/* Subheadline */}
          <p className="mx-auto mb-7 max-w-[660px] text-lg text-white/80 md:text-xl">
            {PUBLIC_POSITIONING}
          </p>

          {/* Interactive trigger */}
          <button
            type="button"
            onClick={() => setIsSimulatorOpen(true)}
            className="mb-10 inline-flex items-center gap-2 font-medium text-yellow-300 transition-colors hover:text-yellow-200"
          >
            <Sparkles className="h-5 w-5" />
            See your potential success
            <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-semibold text-yellow-900">
              Interactive
            </span>
          </button>

          {/* Search bar */}
          <div className="mx-auto mb-7 max-w-[780px]">
            <div className="flex items-center gap-2 rounded-2xl bg-white p-2 shadow-heavy">
              <Search className="ml-3 h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search businesses, deals, grants guidance..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1 bg-transparent py-3 pl-2 pr-1 text-base text-foreground placeholder:text-muted-foreground outline-none"
              />
              <Button variant="hero" size="lg" className="shrink-0 rounded-xl" onClick={handleSearch}>
                Search
              </Button>
            </div>
          </div>

          {/* Popular category chips */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="mr-1 text-sm text-white/60">Popular:</span>
            {popularCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => navigate(`/directory?search=${encodeURIComponent(cat)}`)}
                className="rounded-full border border-white/25 bg-black/35 px-4 py-1.5 text-sm text-white/85 backdrop-blur-sm transition-colors hover:border-white/50 hover:bg-white/15"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="relative z-10 px-6 pb-10">
        <div className="mx-auto max-w-[1100px] overflow-hidden rounded-2xl bg-slate-950/80 shadow-heavy backdrop-blur-md">
          <div className="grid grid-cols-2 divide-x divide-white/10 md:grid-cols-4">
            {stats.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-4 px-7 py-6">
                <div className="shrink-0 rounded-full bg-primary/20 p-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-extrabold text-white">{value}</div>
                  <div className="text-xs text-white/55">{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SuccessSimulator isOpen={isSimulatorOpen} onClose={() => setIsSimulatorOpen(false)} />
    </section>
  );
};

export default HeroSection;
