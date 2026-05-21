import { DollarSign, BarChart3, ClipboardCheck, Bot, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const BusinessSupportHub = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: DollarSign,
      title: "Grant Guidance",
      description: "Review Canadian funding programs, eligibility notes, and practical application steps.",
      action: () => navigate("/grants"),
    },
    {
      icon: BarChart3,
      title: "Business Health Dashboard",
      description: "Track funding opportunities, compliance status, and growth metrics in real-time.",
      action: () => navigate("/auth"),
    },
    {
      icon: ClipboardCheck,
      title: "Compliance & Licensing Hub",
      description: "Never miss a deadline. Automated reminders for licenses, permits, and renewals.",
      action: () => navigate("/auth"),
    },
    {
      icon: Bot,
      title: "24/7 AI Business Coach",
      description: "Get instant answers to business questions, strategy advice, and personalized recommendations.",
      action: () => navigate("/directory"),
    },
  ];

  return (
    <section className="py-24 md:py-32 bg-navy relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(255,107,53,0.3)_0%,transparent_50%)]" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_80%,rgba(227,24,55,0.2)_0%,transparent_50%)]" />
      </div>

      <div className="container mx-auto max-w-[1280px] px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
            Everything Your Business Needs to Succeed
          </h2>
          <p className="text-lg md:text-xl text-primary-foreground/70 max-w-[700px] mx-auto">
            From funding guidance to compliance and growth strategy in one RTM experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              onClick={feature.action}
              className="glass-card rounded-xl p-6 hover:bg-white/10 transition-all duration-300 group cursor-pointer animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <feature.icon className="w-12 h-12 text-accent mb-5" />
              <h3 className="text-xl font-bold text-primary-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-primary-foreground/70 text-sm leading-relaxed mb-4">
                {feature.description}
              </p>
              <span className="inline-flex items-center gap-1 text-accent font-medium text-sm group-hover:gap-2 transition-all">
                Learn more
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="hero" size="xl" className="shadow-glow-lg" onClick={() => navigate("/auth")}>
            Access Your Support Hub
            <ArrowRight className="w-5 h-5" />
          </Button>
          <p className="text-primary-foreground/50 text-sm mt-4">
            Free for all listed businesses
          </p>
        </div>
      </div>
    </section>
  );
};

export default BusinessSupportHub;
