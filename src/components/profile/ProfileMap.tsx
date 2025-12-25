import { Business } from "@/types/directory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Car, Clock, Phone, ExternalLink } from "lucide-react";

interface ProfileMapProps {
  business: Business;
}

const ProfileMap = ({ business }: ProfileMapProps) => {
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${business.name} ${business.address} ${business.city} ${business.province}`
  )}`;

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${business.address} ${business.city} ${business.province}`
  )}`;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
        <CardTitle className="flex items-center gap-2 text-xl">
          <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <MapPin className="w-4 h-4 text-primary" />
          </span>
          Location
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {/* Map Placeholder */}
        <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
          {/* Static map image as placeholder */}
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="text-center">
              <MapPin className="w-12 h-12 text-primary mx-auto mb-2" />
              <p className="text-muted-foreground text-sm">Interactive map</p>
            </div>
          </div>
          
          {/* Overlay with view map button */}
          <a 
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute inset-0 flex items-center justify-center bg-foreground/0 hover:bg-foreground/10 transition-colors group"
          >
            <Button className="opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Google Maps
            </Button>
          </a>
        </div>

        {/* Address Info */}
        <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
          <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">{business.address}</p>
            <p className="text-muted-foreground">{business.city}, {business.province}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="w-full gap-2">
              <Navigation className="w-4 h-4" />
              Get Directions
            </Button>
          </a>
          <Button variant="outline" className="w-full gap-2">
            <Car className="w-4 h-4" />
            Parking Info
          </Button>
        </div>

        {/* Distance & Travel Time */}
        {business.distance && (
          <div className="flex items-center justify-between text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{business.distance} km away</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>~{Math.round(business.distance * 3)} min drive</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileMap;
