import { X, Star, MapPin, Clock, Phone, Navigation, Heart, Share2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Business } from "@/types/directory";
import { getBusinessImageFallback, getBusinessImageUrl } from "@/lib/businessImages";

interface QuickViewModalProps {
  business: Business;
  onClose: () => void;
  isSaved: boolean;
  onSave: () => void;
}

const QuickViewModal = ({ business, onClose, isSaved, onSave }: QuickViewModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-hidden animate-fade-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a 
              href={business.website?.trim() ? (business.website.startsWith('http') ? business.website : `https://${business.website}`) : '#'} 
              target={business.website ? "_blank" : undefined}
              rel={business.website ? "noopener noreferrer" : undefined}
              onClick={(e) => !business.website && e.preventDefault()}
            >
              Visit Website <ExternalLink size={14} className="ml-1" />
            </a>
          </Button>
        </div>

        {/* Gallery */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={getBusinessImageUrl(business)}
            alt={business.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = getBusinessImageFallback(business);
            }}
          />
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
            1 / {business.photos?.length || 1}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[50vh]">
          <div>
            <h2 className="text-xl font-bold">{business.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Star size={16} className="text-yellow-500 fill-yellow-500" />
              <span className="font-semibold">{business.rating}</span>
              <span className="text-sm text-muted-foreground">({business.reviewCount} reviews)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin size={14} />
            <span>{business.address}, {business.city}</span>
            {business.distance && <span>• {business.distance}km</span>}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock size={14} className={business.isOpen ? "text-green-500" : "text-red-500"} />
            <span className={business.isOpen ? "text-green-600" : "text-red-500"}>
              {business.isOpen ? `Open now • Closes ${business.closingTime}` : "Closed"}
            </span>
          </div>

          {business.recentReview && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-sm italic">"{business.recentReview.text}"</p>
              <p className="text-xs text-muted-foreground mt-1">— {business.recentReview.author}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {business.isVerified && <Badge>✓ Verified</Badge>}
            {business.isWorldCupReady && <Badge variant="secondary">⚽ World Cup Ready</Badge>}
            {business.features.slice(0, 4).map((f) => (
              <Badge key={f} variant="outline">{f}</Badge>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border grid grid-cols-4 gap-2">
          <Button className="col-span-1" variant="outline"><Phone size={18} /></Button>
          <Button className="col-span-1" variant="outline"><Navigation size={18} /></Button>
          <Button className="col-span-1" variant="outline" onClick={onSave}>
            <Heart size={18} fill={isSaved ? "currentColor" : "none"} className={isSaved ? "text-primary" : ""} />
          </Button>
          <Button className="col-span-1" variant="outline"><Share2 size={18} /></Button>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
