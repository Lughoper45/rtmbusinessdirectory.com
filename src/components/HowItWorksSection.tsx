import { Search, Sparkles, CheckCircle, Rocket } from "lucide-react";

const HowItWorksSection = () => {
  const steps = [
    {
      number: 1,
      icon: Search,
      title: "Search or Ask",
      description: "Use natural language to find businesses or ask about grants and support",
    },
    {
      number: 2,
      icon: Sparkles,
      title: "AI Matches You",
      description: "Our AI analyzes your needs and finds the perfect matches instantly",
    },
    {
      number: 3,
      icon: CheckCircle,
      title: "Review & Compare",
      description: "See verified results, read reviews, and compare options side-by-side",
    },
    {
      number: 4,
      icon: Rocket,
      title: "Take Action",
      description: "Connect with businesses, apply for grants, or access support tools",
    },
  ];

  return (
    <section className="py-24 md:py-28 bg-background">
      <div className="container mx-auto max-w-[1280px] px-6">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-foreground mb-16">
          How It Works
        </h2>

        <div className="relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden lg:block absolute top-14 left-[12.5%] right-[12.5%] h-0.5 border-t-2 border-dashed border-border" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="text-center relative animate-fade-up"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                {/* Number badge */}
                <div className="w-14 h-14 mx-auto mb-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold relative z-10">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 text-muted-foreground">
                  <step.icon className="w-full h-full" strokeWidth={1.5} />
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
