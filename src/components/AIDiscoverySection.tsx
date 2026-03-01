import { Check, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AIDiscoverySection = () => {
  const navigate = useNavigate();

  const features = [
    "Natural language search - ask like you're talking to a friend",
    "Verified results only - no fake listings or reviews",
    "Smart filters - budget, location, availability, more",
    "Instant answers - powered by AI, faster than traditional search",
    "Comparison tools - see options side-by-side",
  ];

  const exampleQueries = [
    "Best website developer near Toronto under $2,000",
    "African grocery stores in Calgary open Sunday",
    "Emergency plumber with same-day service",
  ];

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-surface-light to-background">
      <div className="container mx-auto max-w-[1280px] px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left - Demo Interface */}
          <div className="relative animate-slide-in-left">
            <div className="bg-background rounded-2xl shadow-heavy border border-border p-6 relative overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-accent/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 bg-muted rounded-lg px-4 py-2 text-sm text-muted-foreground ml-4">
                  rtmbusinessdirectory.com/search
                </div>
              </div>

              {/* Search interface */}
              <div className="space-y-4">
                {exampleQueries.map((query, index) => (
                  <button
                    key={query}
                    onClick={() => navigate(`/directory?search=${encodeURIComponent(query)}`)}
                    className="flex items-start gap-3 p-4 bg-surface-light rounded-xl animate-fade-up w-full text-left hover:bg-primary/5 transition-colors"
                    style={{ animationDelay: `${index * 0.2}s` }}
                  >
                    <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <p className="text-foreground font-medium">{query}</p>
                  </button>
                ))}
              </div>

              {/* AI processing indicator */}
              <div className="mt-6 flex items-center gap-3 text-muted-foreground">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0s" }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.15s" }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0.3s" }} />
                </div>
                <span className="text-sm">AI finding your perfect match...</span>
              </div>
            </div>

            {/* Floating accent */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
          </div>

          {/* Right - Content */}
          <div className="animate-slide-in-right">
            <h2 className="text-3xl md:text-4xl lg:text-[42px] font-bold text-foreground mb-6 leading-tight">
              Ask Anything. Get Exactly What You Need.
            </h2>
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              Our AI understands natural language and finds the perfect match instantly.
            </p>

            <ul className="space-y-4 mb-10">
              {features.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-foreground font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            <Button variant="hero" size="xl" onClick={() => navigate("/directory")}>
              Try AI Search
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIDiscoverySection;
