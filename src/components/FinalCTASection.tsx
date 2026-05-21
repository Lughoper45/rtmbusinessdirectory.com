import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const FinalCTASection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 md:py-32 gradient-cta relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-40 h-40 bg-primary-foreground/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-primary-foreground/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2240%22%20height%3D%2240%22%20viewBox%3D%220%200%2040%2040%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M20%200L40%2020L20%2040L0%2020z%22/%3E%3C/g%3E%3C/svg%3E')]" />
      </div>

      <div className="container mx-auto max-w-[900px] px-6 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6 leading-tight">
          Ready to Get Found on RTM?
        </h2>
        <p className="text-lg md:text-xl text-primary-foreground/90 mb-10">
          Add your business, browse the directory, or explore RTM member deals from one trusted Canadian platform.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
          <Button variant="heroWhite" size="xl" onClick={() => navigate("/auth")}>
            Add Your Listing
            <ArrowRight className="w-5 h-5" />
          </Button>
          <Button variant="heroOutline" size="xl" onClick={() => navigate("/directory")}>
            Browse Directory
          </Button>
        </div>

        <p className="text-primary-foreground/70 text-sm">
          Directory discovery first. Membership and deals add more ways to connect.
        </p>
      </div>
    </section>
  );
};

export default FinalCTASection;
