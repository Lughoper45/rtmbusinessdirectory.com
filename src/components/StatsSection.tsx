import { DIRECTORY_COUNT_LABEL } from "@/content/siteCopy";
import { useEffect, useState, useRef } from "react";

const StatsSection = () => {
  const stats = [
    { value: 10000, suffix: "+", label: "Canadian Business Listings" },
    { value: 13, suffix: "", label: "Provinces and Territories" },
    { value: 5, suffix: "-50%", label: "Member Discount Range" },
    { value: 4, suffix: "", label: "Core Discovery Paths" },
  ];

  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const AnimatedNumber = ({ 
    value, 
    prefix = "", 
    suffix = "", 
    decimals = 0,
    display 
  }: { 
    value: number; 
    prefix?: string; 
    suffix?: string;
    decimals?: number;
    display?: string;
  }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      if (!isVisible) return;

      const duration = 2000;
      const steps = 60;
      const increment = value / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += increment;
        if (current >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(current);
        }
      }, duration / steps);

      return () => clearInterval(timer);
    }, [isVisible, value]);

    const displayValue = display || (decimals > 0 
      ? count.toFixed(decimals)
      : count >= 1000 
        ? `${Math.floor(count / 1000)}K`
        : Math.floor(count).toLocaleString());

    return (
      <span>
        {prefix}{isVisible ? displayValue : "0"}{suffix}
      </span>
    );
  };

  return (
    <section ref={sectionRef} className="py-24 md:py-28 bg-navy">
      <div className="container mx-auto max-w-[1280px] px-6">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-primary-foreground mb-16">
          RTM Directory by the Numbers
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="text-center animate-fade-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="text-5xl md:text-6xl font-extrabold text-accent mb-2">
                <AnimatedNumber 
                  value={stat.value} 
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  decimals={stat.decimals}
                  display={stat.display}
                />
              </div>
              <p className="text-lg text-primary-foreground/70">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <p className="text-center text-primary-foreground/50 text-sm mt-12">
          {DIRECTORY_COUNT_LABEL} with directory, deals, grants guidance, and support pathways.
        </p>
      </div>
    </section>
  );
};

export default StatsSection;
