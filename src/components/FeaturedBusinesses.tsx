import { Star, MapPin, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { slugifySegment } from "@/lib/slug";

const FeaturedBusinesses = () => {
  const navigate = useNavigate();

  const { data: businesses = [] } = useQuery({
    queryKey: ["featured-businesses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("business_id, name, category, rating, review_count, city, province, image, is_verified")
        .eq("is_verified", true)
        .order("rating", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data;
    },
  });

  const colors = ["bg-primary", "bg-accent", "bg-navy", "bg-green-600", "bg-blue-600", "bg-emerald-600", "bg-amber-600", "bg-indigo-600"];

  const getProfileUrl = (b: typeof businesses[0]) => {
    return `/directory/${slugifySegment(b.category)}/${slugifySegment(b.city)}/${slugifySegment(b.name)}-${b.business_id}`;
  };

  return (
    <section className="py-24 md:py-28 bg-background">
      <div className="container mx-auto max-w-[1280px] px-6">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-foreground mb-12">
          Featured Businesses
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {businesses.map((business, index) => (
            <div
              key={business.business_id}
              onClick={() => navigate(getProfileUrl(business))}
              className="group bg-background border border-border rounded-xl overflow-hidden hover:border-primary hover:shadow-heavy transition-all duration-300 cursor-pointer animate-fade-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Cover */}
              <div className={`h-36 ${colors[index % colors.length]} relative`}>
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />
              </div>

              {/* Content */}
              <div className="p-4 -mt-8 relative">
                <div className={`w-16 h-16 ${colors[index % colors.length]} rounded-full border-4 border-background flex items-center justify-center text-primary-foreground text-xl font-bold shadow-medium mb-3`}>
                  {business.name.charAt(0)}
                </div>

                <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors truncate">
                  {business.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {business.category}
                </p>

                <div className="flex items-center gap-1 mb-2">
                  <Star className="w-4 h-4 fill-accent text-accent" />
                  <span className="text-sm font-medium text-foreground">
                    {Number(business.rating).toFixed(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({business.review_count})
                  </span>
                </div>

                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                  <MapPin className="w-4 h-4" />
                  {business.city}, {business.province}
                </div>

                <Button variant="card" size="sm" className="w-full">
                  View Profile
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" size="lg" onClick={() => navigate("/directory")}>
            View All Businesses
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedBusinesses;
