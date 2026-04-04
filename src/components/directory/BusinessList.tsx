import { Star, MapPin, Clock, Heart, Phone, Navigation, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Business } from "@/types/directory";
import { cn } from "@/lib/utils";
import { getBusinessImageFallback, getBusinessImageUrl } from "@/lib/businessImages";

interface BusinessListProps {
  businesses: Business[];
  onSelectBusiness: (business: Business) => void;
  savedBusinesses: string[];
  onSave: (business: Business) => void;
}

const BusinessList = ({ businesses, onSelectBusiness, savedBusinesses, onSave }: BusinessListProps) => {
  if (businesses.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-xl text-muted-foreground">No businesses found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {businesses.map((business) => (
        <div
          key={business.id}
          className="flex gap-4 p-4 bg-card rounded-xl border border-border hover:shadow-medium transition-shadow cursor-pointer"
          onClick={() => onSelectBusiness(business)}
        >
          <img
            src={getBusinessImageUrl(business)}
            alt={business.name}
            className="w-40 h-32 object-cover rounded-lg flex-shrink-0"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getBusinessImageFallback(business);
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{business.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {business.category} • {business.city}, {business.province}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Star size={16} className="text-yellow-500 fill-yellow-500" />
                <span className="font-semibold">{business.rating}</span>
                <span className="text-sm text-muted-foreground">({business.reviewCount})</span>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock size={14} className={business.isOpen ? "text-green-500" : "text-red-500"} />
                {business.isOpen ? "Open now" : "Closed"}
              </span>
              <span>{business.priceRange}</span>
              {business.distance && <span>{business.distance}km away</span>}
            </div>

            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{business.description}</p>

            <div className="flex items-center gap-2 mt-3">
              {business.isVerified && <Badge variant="secondary">✓ Verified</Badge>}
              {business.isWorldCupReady && <Badge variant="secondary">⚽ World Cup</Badge>}
              {business.features.slice(0, 2).map((f) => (
                <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="default" size="sm">View</Button>
            <Button variant="outline" size="sm"><Phone size={14} /></Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(savedBusinesses.includes(business.id) && "text-primary")}
              onClick={(e) => { e.stopPropagation(); onSave(business); }}
            >
              <Heart size={14} fill={savedBusinesses.includes(business.id) ? "currentColor" : "none"} />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default BusinessList;
