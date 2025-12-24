import { Star, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const FeaturedBusinesses = () => {
  const businesses = [
    {
      name: "Maple Digital Agency",
      category: "Web Development",
      rating: 4.9,
      reviews: 127,
      location: "Toronto, ON",
      image: "M",
      color: "bg-primary",
    },
    {
      name: "Northern Accounting",
      category: "Financial Services",
      rating: 4.8,
      reviews: 89,
      location: "Vancouver, BC",
      image: "N",
      color: "bg-accent",
    },
    {
      name: "Prairie Construction",
      category: "Construction",
      rating: 4.7,
      reviews: 156,
      location: "Calgary, AB",
      image: "P",
      color: "bg-navy",
    },
    {
      name: "Ocean View Restaurant",
      category: "Restaurant",
      rating: 4.9,
      reviews: 234,
      location: "Halifax, NS",
      image: "O",
      color: "bg-green-600",
    },
    {
      name: "TechStart Solutions",
      category: "IT Services",
      rating: 4.8,
      reviews: 98,
      location: "Montreal, QC",
      image: "T",
      color: "bg-blue-600",
    },
    {
      name: "Green Garden Landscaping",
      category: "Landscaping",
      rating: 4.6,
      reviews: 67,
      location: "Ottawa, ON",
      image: "G",
      color: "bg-emerald-600",
    },
    {
      name: "Sunrise Bakery",
      category: "Bakery & Cafe",
      rating: 4.9,
      reviews: 312,
      location: "Edmonton, AB",
      image: "S",
      color: "bg-amber-600",
    },
    {
      name: "Coastal Electric",
      category: "Electrical Services",
      rating: 4.7,
      reviews: 145,
      location: "Victoria, BC",
      image: "C",
      color: "bg-indigo-600",
    },
  ];

  return (
    <section className="py-24 md:py-28 bg-background">
      <div className="container mx-auto max-w-[1280px] px-6">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-foreground mb-12">
          Featured Businesses
        </h2>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {businesses.map((business, index) => (
            <div
              key={business.name}
              className="group bg-background border border-border rounded-xl overflow-hidden hover:border-primary hover:shadow-heavy transition-all duration-300 cursor-pointer animate-fade-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* Cover image placeholder */}
              <div className={`h-36 ${business.color} relative`}>
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />
              </div>

              {/* Content */}
              <div className="p-4 -mt-8 relative">
                {/* Logo */}
                <div className={`w-16 h-16 ${business.color} rounded-full border-4 border-background flex items-center justify-center text-primary-foreground text-xl font-bold shadow-medium mb-3`}>
                  {business.image}
                </div>

                <h3 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {business.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {business.category}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-2">
                  <Star className="w-4 h-4 fill-accent text-accent" />
                  <span className="text-sm font-medium text-foreground">
                    {business.rating}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({business.reviews})
                  </span>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                  <MapPin className="w-4 h-4" />
                  {business.location}
                </div>

                {/* CTA */}
                <Button variant="card" size="sm" className="w-full">
                  View Profile
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="outline" size="lg">
            View All 50,000+ Businesses
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedBusinesses;
