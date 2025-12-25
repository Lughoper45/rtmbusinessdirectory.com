import { useState } from "react";
import { ChevronDown, X, SlidersHorizontal, MapPin, Star, DollarSign, Clock, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { FilterState } from "@/types/directory";
import { categories, ownershipTypes, featuresList } from "@/data/mockBusinesses";
import { cn } from "@/lib/utils";

interface SmartFiltersProps {
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  resultCount: number;
}

const SmartFilters = ({ filters, setFilters, resultCount }: SmartFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const activeFiltersCount =
    filters.categories.length +
    filters.priceRange.length +
    filters.features.length +
    filters.ownership.length +
    (filters.rating > 0 ? 1 : 0) +
    (filters.openNow ? 1 : 0) +
    (filters.location ? 1 : 0);

  const clearAllFilters = () => {
    setFilters({
      location: "",
      categories: [],
      rating: 0,
      priceRange: [],
      features: [],
      ownership: [],
      openNow: false,
    });
  };

  const toggleCategory = (category: string) => {
    setFilters({
      ...filters,
      categories: filters.categories.includes(category)
        ? filters.categories.filter((c) => c !== category)
        : [...filters.categories, category],
    });
  };

  const togglePriceRange = (price: string) => {
    setFilters({
      ...filters,
      priceRange: filters.priceRange.includes(price)
        ? filters.priceRange.filter((p) => p !== price)
        : [...filters.priceRange, price],
    });
  };

  const toggleFeature = (feature: string) => {
    setFilters({
      ...filters,
      features: filters.features.includes(feature)
        ? filters.features.filter((f) => f !== feature)
        : [...filters.features, feature],
    });
  };

  const toggleOwnership = (ownership: string) => {
    setFilters({
      ...filters,
      ownership: filters.ownership.includes(ownership)
        ? filters.ownership.filter((o) => o !== ownership)
        : [...filters.ownership, ownership],
    });
  };

  return (
    <div className="bg-muted/50 border-b border-border">
      <div className="container mx-auto px-4 py-3">
        {/* Active Filters Display */}
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            <SlidersHorizontal size={16} />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="default" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown
              size={16}
              className={cn("transition-transform", isExpanded && "rotate-180")}
            />
          </Button>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Location */}
            {filters.location && (
              <Badge variant="secondary" className="gap-1 cursor-pointer">
                <MapPin size={12} />
                {filters.location}
                <X size={12} onClick={() => setFilters({ ...filters, location: "" })} />
              </Badge>
            )}

            {/* Categories */}
            {filters.categories.map((cat) => (
              <Badge key={cat} variant="secondary" className="gap-1 cursor-pointer">
                {cat}
                <X size={12} onClick={() => toggleCategory(cat)} />
              </Badge>
            ))}

            {/* Rating */}
            {filters.rating > 0 && (
              <Badge variant="secondary" className="gap-1 cursor-pointer">
                <Star size={12} className="text-yellow-500" />
                {filters.rating}+
                <X size={12} onClick={() => setFilters({ ...filters, rating: 0 })} />
              </Badge>
            )}

            {/* Price */}
            {filters.priceRange.map((price) => (
              <Badge key={price} variant="secondary" className="gap-1 cursor-pointer">
                {price}
                <X size={12} onClick={() => togglePriceRange(price)} />
              </Badge>
            ))}

            {/* Open Now */}
            {filters.openNow && (
              <Badge variant="secondary" className="gap-1 cursor-pointer">
                <Clock size={12} className="text-green-500" />
                Open now
                <X size={12} onClick={() => setFilters({ ...filters, openNow: false })} />
              </Badge>
            )}

            {/* Features */}
            {filters.features.slice(0, 2).map((feature) => (
              <Badge key={feature} variant="secondary" className="gap-1 cursor-pointer">
                {feature}
                <X size={12} onClick={() => toggleFeature(feature)} />
              </Badge>
            ))}
            {filters.features.length > 2 && (
              <Badge variant="secondary">+{filters.features.length - 2} more</Badge>
            )}

            {/* Clear All */}
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground">
                Clear all
              </Button>
            )}
          </div>

          {/* Results Count */}
          <span className="ml-auto text-sm text-muted-foreground whitespace-nowrap">
            {resultCount.toLocaleString()} businesses found
          </span>
        </div>

        {/* Expanded Filters Panel */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border animate-fade-up">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Categories */}
              <div>
                <button
                  onClick={() => setActiveSection(activeSection === "categories" ? null : "categories")}
                  className="flex items-center justify-between w-full text-sm font-medium mb-3"
                >
                  <span className="flex items-center gap-2">
                    <Sparkles size={14} />
                    Categories
                  </span>
                  <ChevronDown
                    size={14}
                    className={cn("transition-transform", activeSection === "categories" && "rotate-180")}
                  />
                </button>
                {(activeSection === "categories" || activeSection === null) && (
                  <div className="flex flex-wrap gap-2">
                    {categories.slice(0, 6).map((cat) => (
                      <button
                        key={cat.name}
                        onClick={() => toggleCategory(cat.name)}
                        className={cn(
                          "px-3 py-1.5 text-sm rounded-full border transition-colors",
                          filters.categories.includes(cat.name)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border hover:border-primary"
                        )}
                      >
                        {cat.icon} {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Rating */}
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-3">
                  <Star size={14} />
                  Rating: {filters.rating > 0 ? `${filters.rating}+ stars` : "Any"}
                </div>
                <Slider
                  value={[filters.rating]}
                  onValueChange={([val]) => setFilters({ ...filters, rating: val })}
                  max={5}
                  step={0.5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>Any</span>
                  <span>5★</span>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-3">
                  <DollarSign size={14} />
                  Price Range
                </div>
                <div className="flex gap-2">
                  {["$", "$$", "$$$", "$$$$"].map((price) => (
                    <button
                      key={price}
                      onClick={() => togglePriceRange(price)}
                      className={cn(
                        "flex-1 py-2 text-sm rounded-lg border transition-colors",
                        filters.priceRange.includes(price)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card border-border hover:border-primary"
                      )}
                    >
                      {price}
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div>
                <div className="flex items-center gap-2 text-sm font-medium mb-3">
                  <Clock size={14} />
                  Availability
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Open now</span>
                  <Switch
                    checked={filters.openNow}
                    onCheckedChange={(checked) => setFilters({ ...filters, openNow: checked })}
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm font-medium mb-3">
                <Sparkles size={14} />
                Features
              </div>
              <div className="flex flex-wrap gap-2">
                {featuresList.map((feature) => (
                  <button
                    key={feature}
                    onClick={() => toggleFeature(feature)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-full border transition-colors",
                      filters.features.includes(feature)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border hover:border-primary"
                    )}
                  >
                    {feature}
                  </button>
                ))}
              </div>
            </div>

            {/* Ownership */}
            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm font-medium mb-3">
                <Users size={14} />
                Support
              </div>
              <div className="flex flex-wrap gap-2">
                {ownershipTypes.map((type) => (
                  <button
                    key={type.name}
                    onClick={() => toggleOwnership(type.name)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-full border transition-colors",
                      filters.ownership.includes(type.name)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border hover:border-primary"
                    )}
                  >
                    {type.icon} {type.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartFilters;
