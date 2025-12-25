import { useState, useEffect, useRef } from "react";
import { Search, Mic, Camera, X, MapPin, Clock, TrendingUp, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DirectorySearchBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const placeholders = [
  "What are you looking for today?",
  "Try: Best Italian restaurants Toronto",
  "Try: Emergency plumber near me",
  "Try: African grocery stores Calgary",
  "Find World Cup-ready businesses...",
];

const trendingSuggestions = [
  "Best brunch spots Toronto",
  "Late night restaurants",
  "Coffee shops with WiFi",
  "Dog-friendly patios",
  "World Cup viewing parties",
];

const DirectorySearchBar = ({ searchQuery, setSearchQuery }: DirectorySearchBarProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [recentSearches] = useState(["Italian restaurants", "Tech services Vancouver", "Spa near me"]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsExpanded(window.scrollY < 100);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleVoiceSearch = () => {
    setIsListening(true);
    // Voice search would be implemented here with Web Speech API
    setTimeout(() => setIsListening(false), 3000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setIsFocused(false);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "sticky top-16 z-40 transition-all duration-300",
        isExpanded ? "py-6" : "py-3",
        "bg-background/80 backdrop-blur-xl border-b border-border"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="relative max-w-3xl mx-auto">
          {/* Search Input */}
          <div
            className={cn(
              "relative flex items-center transition-all duration-300",
              isFocused ? "shadow-glow-lg" : "shadow-medium",
              "bg-card rounded-full border-2",
              isFocused ? "border-primary" : "border-border"
            )}
          >
            <Search
              className={cn(
                "absolute left-5 transition-colors",
                isFocused ? "text-primary" : "text-muted-foreground",
                isListening && "animate-pulse text-primary"
              )}
              size={22}
            />
            <Input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              placeholder={placeholders[placeholderIndex]}
              className={cn(
                "w-full border-0 bg-transparent pl-14 pr-28 focus-visible:ring-0",
                isExpanded ? "h-14 text-lg" : "h-12 text-base"
              )}
            />
            
            {/* Clear button */}
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-24 h-8 w-8 hover:bg-muted"
                onClick={() => setSearchQuery("")}
              >
                <X size={16} />
              </Button>
            )}

            {/* Voice Search */}
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "absolute right-14 h-10 w-10 rounded-full",
                isListening && "bg-primary/10 animate-pulse"
              )}
              onClick={handleVoiceSearch}
            >
              <Mic
                size={20}
                className={cn(
                  isListening ? "text-primary" : "text-muted-foreground hover:text-primary"
                )}
              />
            </Button>

            {/* Visual Search */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-3 h-10 w-10 rounded-full"
            >
              <Camera size={20} className="text-muted-foreground hover:text-primary" />
            </Button>
          </div>

          {/* Quick Tags */}
          {isExpanded && !isFocused && (
            <div className="flex items-center justify-center gap-2 mt-4 flex-wrap animate-fade-in">
              <span className="text-sm text-muted-foreground">Try:</span>
              {["Near me", "Open now", "Highest rated", "World Cup Ready"].map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleSuggestionClick(tag)}
                  className="px-3 py-1 text-sm bg-muted hover:bg-primary hover:text-primary-foreground rounded-full transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Autocomplete Dropdown */}
          {isFocused && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-heavy border border-border overflow-hidden animate-fade-up z-50">
              {/* Recent Searches */}
              {recentSearches.length > 0 && !searchQuery && (
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Clock size={14} />
                    <span>Recent Searches</span>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((search) => (
                      <button
                        key={search}
                        onClick={() => handleSuggestionClick(search)}
                        className="w-full text-left px-3 py-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-3"
                      >
                        <Clock size={14} className="text-muted-foreground" />
                        <span>{search}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Suggestions */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <TrendingUp size={14} className="text-primary" />
                  <span>Trending Now</span>
                </div>
                <div className="space-y-1">
                  {trendingSuggestions
                    .filter((s) => !searchQuery || s.toLowerCase().includes(searchQuery.toLowerCase()))
                    .slice(0, 4)
                    .map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-3 py-2 hover:bg-muted rounded-lg transition-colors flex items-center gap-3"
                      >
                        <Search size={14} className="text-muted-foreground" />
                        <span>{suggestion}</span>
                        <span className="ml-auto text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          Trending
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              {/* Categories */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Building2 size={14} />
                  <span>Categories</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Restaurants", "Professional Services", "Retail", "Health & Wellness"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleSuggestionClick(cat)}
                      className="px-3 py-1.5 text-sm bg-muted hover:bg-primary hover:text-primary-foreground rounded-full transition-colors"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Locations */}
              <div className="p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <MapPin size={14} />
                  <span>Locations</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {["Downtown Toronto", "Vancouver West", "Montreal Centre", "Calgary SE"].map((loc) => (
                    <button
                      key={loc}
                      onClick={() => handleSuggestionClick(loc)}
                      className="px-3 py-1.5 text-sm bg-muted hover:bg-secondary rounded-full transition-colors flex items-center gap-1"
                    >
                      <MapPin size={12} />
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DirectorySearchBar;
