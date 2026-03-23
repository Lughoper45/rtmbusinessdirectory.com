import { memo } from "react";
import { Business } from "@/types/directory";
import BusinessCard from "./BusinessCard";

interface BusinessGridProps {
  businesses: Business[];
  onSelectBusiness: (business: Business) => void;
  savedBusinesses: string[];
  onSave: (business: Business) => void;
}

const BusinessGrid = memo(function BusinessGrid({ businesses, onSelectBusiness, savedBusinesses, onSave }: BusinessGridProps) {
  if (businesses.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-xl text-muted-foreground">No businesses match your search</p>
        <p className="text-sm text-muted-foreground mt-2">Try removing some filters</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {businesses.map((business) => (
        <BusinessCard
          key={business.id}
          business={business}
          onSelect={() => onSelectBusiness(business)}
          isSaved={savedBusinesses.includes(business.id)}
          onSave={() => onSave(business)}
        />
      ))}
    </div>
  );
});

export default BusinessGrid;
