import { useState } from "react";
import { Check, Lock, Sparkles, FileText, Building2, CreditCard, Rocket, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const ProgressVisualization = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const steps = [
    {
      id: 1,
      title: "Choose Your Path",
      description: "Tell us about your business idea",
      icon: Sparkles,
      completed: true,
      badge: "Quick Start",
      details: "2-minute questionnaire to understand your needs",
    },
    {
      id: 2,
      title: "Business Registration",
      description: "Get your official business number",
      icon: FileText,
      completed: true,
      badge: "Most Popular",
      details: "Federal and provincial registration handled for you",
    },
    {
      id: 3,
      title: "Legal Structure",
      description: "Sole prop, partnership, or corporation",
      icon: Building2,
      completed: false,
      badge: null,
      details: "Expert guidance on the best structure for your goals",
    },
    {
      id: 4,
      title: "Tax Setup",
      description: "GST/HST and payroll accounts",
      icon: CreditCard,
      completed: false,
      badge: null,
      details: "Ensure compliance from day one",
    },
    {
      id: 5,
      title: "Launch Ready",
      description: "Your business is official!",
      icon: Rocket,
      completed: false,
      badge: "Goal",
      details: "Receive your complete business package",
    },
  ];

  const progressPercentage = (steps.filter(s => s.completed).length / steps.length) * 100;

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-background to-surface-light overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Trophy className="w-4 h-4" />
            Your Business Launch Journey
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Track Your Progress to{" "}
            <span className="text-gradient">Success</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every step brings you closer to launching your Canadian business. We handle the complexity, you focus on your dream.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="relative mb-12">
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-shimmer" />
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm text-muted-foreground">Start</span>
            <span className="text-sm font-medium text-primary">{Math.round(progressPercentage)}% Complete</span>
            <span className="text-sm text-muted-foreground">Launch!</span>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 md:gap-0 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-1 bg-border z-0">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isActive = index === activeStep;
            const isHovered = hoveredStep === index;
            
            return (
              <div
                key={step.id}
                className="relative z-10"
                onMouseEnter={() => setHoveredStep(index)}
                onMouseLeave={() => setHoveredStep(null)}
                onClick={() => setActiveStep(index)}
              >
                {/* Step Card */}
                <div 
                  className={`relative flex flex-col items-center text-center cursor-pointer transition-all duration-300 ${
                    isActive || isHovered ? "transform -translate-y-2" : ""
                  }`}
                >
                  {/* Badge */}
                  {step.badge && (
                    <div className={`absolute -top-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      step.badge === "Goal" 
                        ? "bg-accent text-accent-foreground" 
                        : step.badge === "Most Popular"
                        ? "bg-primary text-primary-foreground"
                        : "bg-green-500 text-white"
                    }`}>
                      {step.badge}
                    </div>
                  )}

                  {/* Icon Circle */}
                  <div 
                    className={`relative w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
                      step.completed
                        ? "bg-gradient-to-br from-primary to-accent shadow-glow"
                        : isActive || isHovered
                        ? "bg-gradient-to-br from-primary/20 to-accent/20 border-2 border-primary"
                        : "bg-muted border-2 border-border"
                    }`}
                  >
                    {step.completed ? (
                      <Check className="w-8 h-8 md:w-10 md:h-10 text-primary-foreground" />
                    ) : (
                      <StepIcon className={`w-8 h-8 md:w-10 md:h-10 ${
                        isActive || isHovered ? "text-primary" : "text-muted-foreground"
                      }`} />
                    )}
                    
                    {/* Lock overlay for future steps */}
                    {!step.completed && index > activeStep + 1 && (
                      <div className="absolute inset-0 bg-background/60 rounded-2xl flex items-center justify-center">
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Step Info */}
                  <h3 className={`font-bold mb-1 transition-colors ${
                    step.completed || isActive || isHovered ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2 hidden md:block">
                    {step.description}
                  </p>

                  {/* Expanded details on hover */}
                  {(isActive || isHovered) && (
                    <div className="absolute top-full mt-4 bg-background border border-border rounded-xl p-4 shadow-lg w-64 text-left animate-fade-up z-20">
                      <p className="text-sm text-muted-foreground mb-3">{step.details}</p>
                      {!step.completed && (
                        <Button variant="outline" size="sm" className="w-full group">
                          <span>Start Step</span>
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      )}
                      {step.completed && (
                        <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                          <Check className="w-4 h-4" />
                          Completed
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Button variant="hero" size="lg" className="group">
            <Rocket className="w-5 h-5 mr-2" />
            Continue Your Journey
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Average completion time: <span className="font-medium text-foreground">2-3 weeks</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default ProgressVisualization;
