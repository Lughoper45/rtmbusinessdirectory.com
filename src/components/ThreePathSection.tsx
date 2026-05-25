import { Search, DollarSign, TrendingUp, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DIRECTORY_COUNT_LABEL } from "@/content/siteCopy";
import { openGrowPortal } from "@/lib/site";

const ThreePathSection = () => {
  const navigate = useNavigate();

  const paths = [
    {
      icon: Search,
      title: "Find a Business",
      description: `Search ${DIRECTORY_COUNT_LABEL} by category, city, and service need`,
      cta: "Start Searching",
      action: () => navigate("/directory"),
    },
    {
      icon: DollarSign,
      title: "Access Grants & Funding",
      description: "Review Canadian grant programs, eligibility notes, and application guidance",
      cta: "Find Funding",
      action: () => navigate("/grants"),
    },
    {
      icon: TrendingUp,
      title: "Grow My Business",
      description:
        "Digital marketing, websites, WhatsApp CRM, and AI tools — get visible online and convert more leads",
      cta: "Free growth audit",
      action: () => openGrowPortal("/"),
    },
  ];

  return (
    <section className="py-20 md:py-24 bg-background">
      <div className="container mx-auto max-w-[1280px] px-6">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-foreground mb-12 md:mb-16">
          What brings you here today?
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {paths.map((path, index) => (
            <div
              key={path.title}
              onClick={path.action}
              className="group bg-background border-2 border-border rounded-2xl p-8 md:p-10 text-center hover:border-primary hover:shadow-heavy transition-all duration-300 cursor-pointer animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-16 h-16 mx-auto mb-6 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <path.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-foreground mb-4">
                {path.title}
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {path.description}
              </p>
              <Button variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground">
                {path.cta}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ThreePathSection;
