import { Business } from "@/types/directory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trophy, Globe, Check } from "lucide-react";

interface ProfileAboutProps {
  business: Business;
}

const ProfileAbout = ({ business }: ProfileAboutProps) => {
  // AI-generated unique selling points based on business features
  const uniqueSellingPoints = [
    business.isAwardWinner && "Award-winning service and quality",
    business.isVerified && "Verified and trusted by the community",
    business.features.includes("Outdoor Seating") && "Beautiful outdoor seating available",
    business.features.includes("Reservations") && "Easy online reservations",
    business.features.includes("Delivery") && "Fast delivery to your door",
    business.features.includes("Parking") && "Convenient free parking",
    business.ownership?.includes("Family-owned") && "Family-owned for generations",
    business.ownership?.includes("Immigrant-owned") && "Celebrating cultural diversity",
    business.cuisine && `Authentic ${business.cuisine} cuisine`,
  ].filter(Boolean) as string[];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-muted/50 to-transparent">
        <CardTitle className="flex items-center gap-2 text-xl">
          <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </span>
          About {business.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* AI-Generated Description */}
        <div className="prose prose-slate max-w-none">
          <p className="text-foreground leading-relaxed text-lg">
            {business.description}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Located in the heart of {business.city}, {business.name} has become a beloved destination 
            for locals and visitors alike. {business.reviewCount > 500 
              ? `With over ${business.reviewCount.toLocaleString()} reviews and a stellar ${business.rating} rating, `
              : ''
            }
            we're committed to delivering exceptional experiences every time you visit.
          </p>
        </div>

        {/* Unique Selling Points */}
        {uniqueSellingPoints.length > 0 && (
          <div className="bg-muted/30 rounded-xl p-6">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              What Makes Us Special
            </h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {uniqueSellingPoints.slice(0, 6).map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* World Cup Ready Section */}
        {business.isWorldCupReady && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl p-6 border border-amber-200 dark:border-amber-800">
            <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-500" />
              Ready for FIFA World Cup 2026
            </h3>
            <p className="text-muted-foreground mb-4">
              We're fully prepared to welcome international visitors for the FIFA World Cup 2026. 
              Our team has undergone special training to ensure an exceptional experience for fans from around the world.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: "🌍", text: "Multi-language support" },
                { icon: "💳", text: "International payments" },
                { icon: "🕐", text: "Extended hours" },
                { icon: "⚽", text: "Special World Cup menu" },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2 bg-background/80 rounded-lg px-3 py-2">
                  <span>{item.icon}</span>
                  <span className="text-sm text-foreground">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div>
          <h3 className="font-semibold text-foreground mb-3">Features & Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {business.features.map((feature, index) => (
              <Badge key={index} variant="secondary" className="px-3 py-1.5">
                {feature}
              </Badge>
            ))}
          </div>
        </div>

        {/* Ownership Badges */}
        {business.ownership && business.ownership.length > 0 && (
          <div>
            <h3 className="font-semibold text-foreground mb-3">Business Ownership</h3>
            <div className="flex flex-wrap gap-2">
              {business.ownership.map((type, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="px-3 py-1.5 bg-primary/5 border-primary/20"
                >
                  {type === "Canadian-owned" && "🇨🇦 "}
                  {type === "Women-owned" && "👩 "}
                  {type === "Immigrant-owned" && "🌍 "}
                  {type === "Indigenous-owned" && "🪶 "}
                  {type === "LGBTQ+-owned" && "🏳️‍🌈 "}
                  {type === "Veteran-owned" && "🎖️ "}
                  {type === "Family-owned" && "👨‍👩‍👧 "}
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileAbout;
