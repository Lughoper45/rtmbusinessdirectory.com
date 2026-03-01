import { Globe, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const ImmigrantHubSection = () => {
  const navigate = useNavigate();

  const communities = [
    { flag: "🇮🇳", name: "Indian" },
    { flag: "🇨🇳", name: "Chinese" },
    { flag: "🇵🇭", name: "Filipino" },
    { flag: "🇳🇬", name: "Nigerian" },
    { flag: "🇵🇰", name: "Pakistani" },
    { flag: "🇲🇽", name: "Mexican" },
    { flag: "🇸🇾", name: "Syrian" },
    { flag: "🇮🇷", name: "Iranian" },
  ];

  return (
    <section className="py-20 md:py-24 bg-gradient-to-b from-surface-warm to-background">
      <div className="container mx-auto max-w-[1000px] px-6 text-center">
        <div className="w-20 h-20 mx-auto mb-6 bg-accent/10 rounded-full flex items-center justify-center">
          <Globe className="w-10 h-10 text-accent" />
        </div>

        <h2 className="text-3xl md:text-4xl lg:text-[42px] font-bold text-foreground mb-4">
          New to Canada? We're Here to Help
        </h2>
        <p className="text-lg text-muted-foreground mb-10 max-w-[600px] mx-auto leading-relaxed">
          Discover immigrant-owned businesses, settlement services, and resources to help you thrive in Canada.
        </p>

        {/* Community flags */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {communities.map((community) => (
            <button
              key={community.name}
              onClick={() => navigate(`/directory?search=${encodeURIComponent(community.name + " owned")}`)}
              className="text-4xl hover:scale-110 transition-transform cursor-pointer"
              title={community.name}
            >
              {community.flag}
            </button>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button variant="hero" size="lg" onClick={() => navigate("/directory?ownership=Immigrant-Owned")}>
            Explore Immigrant Resources
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="outline" size="lg" onClick={() => navigate("/directory?category=Professional+Services")}>
            Find Settlement Services
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ImmigrantHubSection;
