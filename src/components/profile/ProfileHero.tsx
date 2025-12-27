import { Business } from "@/types/directory";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, Globe, MapPin, Clock, Star, Share2, Heart, 
  Navigation, Play, ChevronRight
} from "lucide-react";

interface ProfileHeroProps {
  business: Business;
  onShare: () => void;
  onSave: () => void;
  isSaved?: boolean;
}

const ProfileHero = ({ business, onShare, onSave, isSaved = false }: ProfileHeroProps) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star 
        key={i} 
        className={`w-5 h-5 ${i < Math.floor(rating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`} 
      />
    ));
  };

  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="relative h-[400px] md:h-[500px] overflow-hidden">
        <img 
          src={business.image} 
          alt={business.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        
        {/* Quick Stats Overlay */}
        <div className="absolute top-4 right-4 flex flex-wrap gap-2">
          {business.distance && (
            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
              <MapPin className="w-3 h-3 mr-1" />
              {business.distance} km
            </Badge>
          )}
          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
            {business.priceRange}
          </Badge>
          <Badge 
            variant="secondary" 
            className={`backdrop-blur-sm ${business.isOpen ? 'bg-emerald-500/90 text-white' : 'bg-destructive/90 text-white'}`}
          >
            {business.isOpen ? 'Open Now' : 'Closed'}
          </Badge>
        </div>

        {/* Video Play Button (if video available) */}
        <button className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-background hover:scale-110 transition-all duration-300 shadow-xl group">
          <Play className="w-8 h-8 text-primary fill-primary ml-1 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      {/* Business Info Card */}
      <div className="max-w-7xl mx-auto px-4 -mt-32 relative z-10">
        <div className="bg-background rounded-2xl shadow-xl border border-border p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Logo */}
            {business.logo && (
              <div className="w-24 h-24 rounded-xl bg-muted flex items-center justify-center border-4 border-background shadow-lg overflow-hidden flex-shrink-0">
                <img src={business.logo} alt={`${business.name} logo`} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                    {business.name}
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    {business.subcategory || business.category} • {business.city}, {business.province}
                  </p>
                </div>

                {/* Rating */}
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1">
                    {renderStars(business.rating)}
                  </div>
                  <p className="text-lg mt-1">
                    <span className="font-bold text-foreground">{business.rating}</span>
                    <span className="text-muted-foreground"> ({business.reviewCount.toLocaleString()} reviews)</span>
                  </p>
                </div>
              </div>

              {/* Quick Info Row */}
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span>{business.address}, {business.city}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className={business.isOpen ? 'text-emerald-600 font-medium' : 'text-destructive font-medium'}>
                    {business.isOpen ? `Open now · Closes ${business.closingTime}` : 'Closed'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 mt-6">
                <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                  <Phone className="w-4 h-4" />
                  Call Now
                </Button>
                <Button size="lg" variant="outline" className="gap-2">
                  <Globe className="w-4 h-4" />
                  Website
                </Button>
                <Button size="lg" variant="outline" className="gap-2">
                  <Navigation className="w-4 h-4" />
                  Directions
                </Button>
                <Button 
                  size="lg" 
                  variant={isSaved ? "default" : "ghost"} 
                  onClick={onSave} 
                  className={`gap-2 ${isSaved ? 'bg-primary text-primary-foreground' : ''}`}
                >
                  <Heart className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} />
                  {isSaved ? "Saved" : "Save"}
                </Button>
                <Button size="lg" variant="ghost" onClick={onShare} className="gap-2">
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHero;
