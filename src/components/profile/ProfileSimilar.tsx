import { Business } from "@/types/directory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { businessProfilePath } from "@/lib/slug";

interface ProfileSimilarProps {
  businesses: Business[];
}

const ProfileSimilar = ({ businesses }: ProfileSimilarProps) => {

  if (businesses.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
        <CardTitle className="flex items-center gap-2 text-xl">
          <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </span>
          You Might Also Like
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {businesses.map((business) => (
            <Link
              key={business.id}
              to={businessProfilePath(business)}
              className="group flex flex-col rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              {/* Image */}
              <div className="relative aspect-video overflow-hidden">
                <img 
                  src={business.image} 
                  alt={business.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                  <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                    {business.priceRange}
                  </Badge>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors mb-1 line-clamp-1">
                  {business.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {business.subcategory || business.category}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="font-medium text-foreground">{business.rating}</span>
                    <span className="text-muted-foreground text-sm">
                      ({business.reviewCount})
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <MapPin className="w-3 h-3" />
                    {business.distance} km
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSimilar;
