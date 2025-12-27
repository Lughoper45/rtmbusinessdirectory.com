import { Business } from "@/types/directory";
import { ChevronRight } from "lucide-react";
import BusinessCard from "./BusinessCard";

interface StoryModeProps {
  businesses: Business[];
  onSelectBusiness: (business: Business) => void;
  savedBusinesses: string[];
  onSave: (business: Business) => void;
}

const sections = [
  { title: "🔥 Trending This Week", filter: (b: Business) => b.isTrending },
  { title: "🏆 Award Winners", filter: (b: Business) => b.isAwardWinner },
  { title: "🆕 New & Noteworthy", filter: (b: Business) => b.isNew },
  { title: "⚽ World Cup Ready", filter: (b: Business) => b.isWorldCupReady },
  { title: "💎 Hidden Gems", filter: (b: Business) => b.rating >= 4.7 && b.reviewCount < 500 },
  { title: "🍽️ Top Restaurants", filter: (b: Business) => b.category === "Restaurants" },
];

const StoryMode = ({ businesses, onSelectBusiness, savedBusinesses, onSave }: StoryModeProps) => {
  return (
    <div className="space-y-10">
      {sections.map((section) => {
        const filtered = businesses.filter(section.filter);
        if (filtered.length === 0) return null;

        return (
          <div key={section.title}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">{section.title}</h2>
              <button className="flex items-center gap-1 text-sm text-primary hover:underline">
                See all <ChevronRight size={16} />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
              {filtered.slice(0, 8).map((business) => (
                <div key={business.id} className="flex-shrink-0 w-72 snap-start">
                  <BusinessCard
                    business={business}
                    onSelect={() => onSelectBusiness(business)}
                    isSaved={savedBusinesses.includes(business.id)}
                    onSave={() => onSave(business)}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StoryMode;
