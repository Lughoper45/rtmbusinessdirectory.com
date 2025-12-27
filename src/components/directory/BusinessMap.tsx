import { Business } from "@/types/directory";
import { MapPin } from "lucide-react";

interface BusinessMapProps {
  businesses: Business[];
  onSelectBusiness: (business: Business) => void;
  savedBusinesses: string[];
  onSave: (business: Business) => void;
}

const BusinessMap = ({ businesses, onSelectBusiness }: BusinessMapProps) => {
  return (
    <div className="relative h-[600px] bg-muted rounded-xl overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <MapPin size={48} className="mx-auto text-primary mb-4" />
          <h3 className="text-xl font-semibold mb-2">Interactive Map View</h3>
          <p className="text-muted-foreground max-w-md">
            {businesses.length} businesses ready to explore. Connect Mapbox to enable the full map experience.
          </p>
        </div>
      </div>
      {/* Map pins would render here with Mapbox integration */}
    </div>
  );
};

export default BusinessMap;
