import { Trophy, Globe, Users, MapPin, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const WorldCupSection = () => {
  const navigate = useNavigate();

  const stats = [
    { icon: Globe, value: "48", label: "Teams" },
    { icon: Users, value: "5M+", label: "Visitors" },
    { icon: MapPin, value: "13", label: "Host Cities" },
  ];

  return (
    <section className="py-20 md:py-24 gradient-cta relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%224%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]" />

      <div className="container mx-auto max-w-[800px] px-6 text-center relative z-10">
        <div className="w-20 h-20 mx-auto mb-6 bg-primary-foreground/10 rounded-full flex items-center justify-center animate-bounce-soft">
          <Trophy className="w-10 h-10 text-primary-foreground" />
        </div>

        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4">
          Get Ready for FIFA World Cup 2026
        </h2>
        <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 leading-relaxed">
          Canada will welcome millions of international visitors. Position your business for the opportunity of a decade.
        </p>

        <Button variant="heroWhite" size="xl" className="mb-10" onClick={() => navigate("/directory?filter=world-cup")}>
          Explore World Cup Opportunities
          <ArrowRight className="w-5 h-5" />
        </Button>

        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-2 text-primary-foreground">
              <stat.icon className="w-5 h-5" />
              <span className="font-bold">{stat.value}</span>
              <span className="text-primary-foreground/80">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WorldCupSection;
