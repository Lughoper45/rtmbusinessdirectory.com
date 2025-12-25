import { Business } from "@/types/directory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, TrendingUp, ChevronRight, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { businessProfilePath } from "@/lib/slug";

interface ProfileCompetitorsProps {
  business: Business;
  competitors: Business[];
}

const ProfileCompetitors = ({ business, competitors }: ProfileCompetitorsProps) => {

  // Calculate market position
  const avgCompetitorRating = competitors.length > 0 
    ? competitors.reduce((sum, c) => sum + c.rating, 0) / competitors.length 
    : 0;
  
  const avgCompetitorReviews = competitors.length > 0
    ? Math.round(competitors.reduce((sum, c) => sum + c.reviewCount, 0) / competitors.length)
    : 0;

  const isLeader = business.rating > avgCompetitorRating && business.reviewCount > avgCompetitorReviews;
  const isChallenger = business.rating >= avgCompetitorRating;

  const getMarketPosition = () => {
    if (isLeader) return { label: "Market Leader", color: "bg-emerald-500" };
    if (isChallenger) return { label: "Strong Challenger", color: "bg-blue-500" };
    return { label: "Growing Business", color: "bg-amber-500" };
  };

  const position = getMarketPosition();

  if (competitors.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xl">
            <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary" />
            </span>
            Competitive Analysis
          </div>
          <Badge className={position.color}>
            {position.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Market Position Summary */}
        <div className="p-4 bg-muted/30 rounded-xl">
          <p className="text-foreground">
            {isLeader 
              ? `${business.name} outperforms ${competitors.length} nearby competitors in rating and customer satisfaction.`
              : isChallenger
                ? `${business.name} is competitive with similar businesses in the area, with room for growth.`
                : `${business.name} is a growing business building its reputation in the market.`
            }
          </p>
        </div>

        {/* Your Advantages */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Your Advantages
          </h3>
          <ul className="space-y-2 text-foreground">
            {business.rating > avgCompetitorRating && (
              <li className="flex items-start gap-3">
                <span className="text-emerald-500">•</span>
                Higher rating ({business.rating} vs avg {avgCompetitorRating.toFixed(1)})
              </li>
            )}
            {business.reviewCount > avgCompetitorReviews && (
              <li className="flex items-start gap-3">
                <span className="text-emerald-500">•</span>
                More reviews ({business.reviewCount.toLocaleString()} vs avg {avgCompetitorReviews.toLocaleString()})
              </li>
            )}
            {business.isVerified && (
              <li className="flex items-start gap-3">
                <span className="text-emerald-500">•</span>
                Verified business status builds trust
              </li>
            )}
            {business.isWorldCupReady && (
              <li className="flex items-start gap-3">
                <span className="text-emerald-500">•</span>
                World Cup 2026 ready - competitive advantage
              </li>
            )}
          </ul>
        </div>

        {/* Competitor List */}
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">
            Similar Businesses Nearby ({competitors.length})
          </h3>
          <div className="space-y-3">
            {competitors.slice(0, 3).map((competitor) => (
              <Link
                key={competitor.id}
                to={businessProfilePath(competitor)}
                className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
              >
                <img 
                  src={competitor.image} 
                  alt={competitor.name}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {competitor.name}
                  </h4>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      {competitor.rating}
                    </div>
                    <span>•</span>
                    <span>{competitor.priceRange}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {competitor.distance} km
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            ))}
          </div>
        </div>

        {competitors.length > 3 && (
          <Button variant="outline" className="w-full">
            View All {competitors.length} Competitors
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileCompetitors;
