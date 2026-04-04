import { memo } from "react";
import { Star, MapPin, Clock, Heart, ExternalLink, CheckCircle, Globe, Trophy, Flame } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Business } from "@/types/directory";
import { cn } from "@/lib/utils";
import { getBusinessImageFallback, getBusinessImageUrl } from "@/lib/businessImages";

interface BusinessCardProps {
  business: Business;
  onSelect: () => void;
  isSaved: boolean;
  onSave: () => void;
}

const BusinessCard = memo(function BusinessCard({ business, onSelect, isSaved, onSave }: BusinessCardProps) {
  const imageSrc = getBusinessImageUrl(business);

  return (
    <Card className="group overflow-hidden hover:shadow-heavy transition-all duration-300 hover:-translate-y-2 cursor-pointer">
      {/* Image */}
      <div className="relative h-48 overflow-hidden" onClick={onSelect}>
        <img
          src={imageSrc}
          alt={business.name}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = getBusinessImageFallback(business);
          }}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Quick Stats Overlay */}
        <div className="absolute top-3 left-3 flex gap-2">
          {business.distance && (
            <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
              📍 {business.distance}km
            </Badge>
          )}
          <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
            {business.priceRange}
          </Badge>
        </div>

        {/* Badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          {business.isVerified && (
            <Badge className="bg-green-500/90 text-white"><CheckCircle size={12} className="mr-1" />Verified</Badge>
          )}
          {business.isWorldCupReady && (
            <Badge className="bg-primary/90 text-white"><Globe size={12} className="mr-1" />World Cup</Badge>
          )}
          {business.isAwardWinner && (
            <Badge className="bg-yellow-500/90 text-white"><Trophy size={12} className="mr-1" />Award</Badge>
          )}
          {business.isTrending && (
            <Badge className="bg-orange-500/90 text-white"><Flame size={12} className="mr-1" />Trending</Badge>
          )}
        </div>

        {/* Save Button */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute bottom-3 right-3 h-10 w-10 rounded-full bg-background/80 backdrop-blur-sm",
            isSaved && "text-primary"
          )}
          onClick={(e) => { e.stopPropagation(); onSave(); }}
        >
          <Heart size={18} fill={isSaved ? "currentColor" : "none"} />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4" onClick={onSelect}>
        <div className="flex items-start gap-3">
          {business.logo && (
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-background shadow-sm -mt-8 relative z-10">
              <span className="text-xl">🏢</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{business.name}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {business.category} • {business.city}
            </p>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex items-center gap-1">
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
            <span className="font-semibold">{business.rating}</span>
          </div>
          <span className="text-sm text-muted-foreground">({business.reviewCount} reviews)</span>
        </div>

        {/* Location & Hours */}
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1 truncate">
            <MapPin size={14} />
            {business.address}
          </span>
        </div>
        <div className="flex items-center gap-1 mt-1 text-sm">
          <Clock size={14} className={business.isOpen ? "text-green-500" : "text-red-500"} />
          <span className={business.isOpen ? "text-green-600" : "text-red-500"}>
            {business.isOpen ? `Open • Closes ${business.closingTime}` : "Closed"}
          </span>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-1 mt-3">
          {business.features.slice(0, 3).map((feature) => (
            <Badge key={feature} variant="outline" className="text-xs">{feature}</Badge>
          ))}
        </div>

        {/* Recent Review */}
        {business.recentReview && (
          <p className="text-sm text-muted-foreground mt-3 italic line-clamp-2">
            "{business.recentReview.text}"
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button className="flex-1" size="sm">View Profile</Button>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ExternalLink size={16} />
          </Button>
        </div>
      </div>
    </Card>
  );
});

export default BusinessCard;
