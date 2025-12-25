import { useState } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DirectorySearchBar from "@/components/directory/DirectorySearchBar";
import DiscoveryModeSelector from "@/components/directory/DiscoveryModeSelector";
import SmartFilters from "@/components/directory/SmartFilters";
import BusinessGrid from "@/components/directory/BusinessGrid";
import BusinessMap from "@/components/directory/BusinessMap";
import DiscoverySwipe from "@/components/directory/DiscoverySwipe";
import StoryMode from "@/components/directory/StoryMode";
import BusinessList from "@/components/directory/BusinessList";
import QuickViewModal from "@/components/directory/QuickViewModal";
import { Business, DiscoveryMode, FilterState } from "@/types/directory";
import { allBusinesses as mockBusinesses } from "@/data/index";

const Directory = () => {
  const [mode, setMode] = useState<DiscoveryMode>("mission");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    location: "",
    categories: [],
    rating: 0,
    priceRange: [],
    features: [],
    ownership: [],
    openNow: false,
  });
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [savedBusinesses, setSavedBusinesses] = useState<string[]>([]);
  const [viewType, setViewType] = useState<"grid" | "list">("grid");

  const handleSaveBusiness = (id: string) => {
    setSavedBusinesses(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const filteredBusinesses = mockBusinesses.filter(business => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!business.name.toLowerCase().includes(query) && 
          !business.category.toLowerCase().includes(query) &&
          !business.description.toLowerCase().includes(query)) {
        return false;
      }
    }
    if (filters.categories.length > 0 && !filters.categories.includes(business.category)) {
      return false;
    }
    if (filters.rating > 0 && business.rating < filters.rating) {
      return false;
    }
    if (filters.priceRange.length > 0 && !filters.priceRange.includes(business.priceRange)) {
      return false;
    }
    if (filters.openNow && !business.isOpen) {
      return false;
    }
    return true;
  });

  const renderContent = () => {
    switch (mode) {
      case "map":
        return (
          <BusinessMap 
            businesses={filteredBusinesses}
            onSelectBusiness={setSelectedBusiness}
            savedBusinesses={savedBusinesses}
            onSave={handleSaveBusiness}
          />
        );
      case "discovery":
        return (
          <DiscoverySwipe 
            businesses={filteredBusinesses}
            onSave={handleSaveBusiness}
            savedBusinesses={savedBusinesses}
          />
        );
      case "story":
        return (
          <StoryMode 
            businesses={filteredBusinesses}
            onSelectBusiness={setSelectedBusiness}
            savedBusinesses={savedBusinesses}
            onSave={handleSaveBusiness}
          />
        );
      case "saved":
        const saved = mockBusinesses.filter(b => savedBusinesses.includes(b.id));
        return viewType === "grid" ? (
          <BusinessGrid 
            businesses={saved}
            onSelectBusiness={setSelectedBusiness}
            savedBusinesses={savedBusinesses}
            onSave={handleSaveBusiness}
          />
        ) : (
          <BusinessList 
            businesses={saved}
            onSelectBusiness={setSelectedBusiness}
            savedBusinesses={savedBusinesses}
            onSave={handleSaveBusiness}
          />
        );
      case "best":
        const bestBusinesses = [...filteredBusinesses].sort((a, b) => b.rating - a.rating).slice(0, 20);
        return viewType === "grid" ? (
          <BusinessGrid 
            businesses={bestBusinesses}
            onSelectBusiness={setSelectedBusiness}
            savedBusinesses={savedBusinesses}
            onSave={handleSaveBusiness}
          />
        ) : (
          <BusinessList 
            businesses={bestBusinesses}
            onSelectBusiness={setSelectedBusiness}
            savedBusinesses={savedBusinesses}
            onSave={handleSaveBusiness}
          />
        );
      case "trending":
        const trending = [...filteredBusinesses].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 20);
        return viewType === "grid" ? (
          <BusinessGrid 
            businesses={trending}
            onSelectBusiness={setSelectedBusiness}
            savedBusinesses={savedBusinesses}
            onSave={handleSaveBusiness}
          />
        ) : (
          <BusinessList 
            businesses={trending}
            onSelectBusiness={setSelectedBusiness}
            savedBusinesses={savedBusinesses}
            onSave={handleSaveBusiness}
          />
        );
      default:
        return viewType === "grid" ? (
          <BusinessGrid 
            businesses={filteredBusinesses}
            onSelectBusiness={setSelectedBusiness}
            savedBusinesses={savedBusinesses}
            onSave={handleSaveBusiness}
          />
        ) : (
          <BusinessList 
            businesses={filteredBusinesses}
            onSelectBusiness={setSelectedBusiness}
            savedBusinesses={savedBusinesses}
            onSave={handleSaveBusiness}
          />
        );
    }
  };

  return (
    <>
      <Helmet>
        <title>Discover Canadian Businesses | LaunchPad Canada Directory</title>
        <meta 
          name="description" 
          content="Explore 50,000+ verified Canadian businesses. AI-powered search, multiple discovery modes, and personalized recommendations." 
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        
        {/* Sticky Search Bar */}
        <DirectorySearchBar 
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Discovery Mode Selector */}
        <DiscoveryModeSelector 
          mode={mode} 
          setMode={setMode}
          viewType={viewType}
          setViewType={setViewType}
        />

        {/* Smart Filters - Hidden in some modes */}
        {!["discovery", "story"].includes(mode) && (
          <SmartFilters 
            filters={filters}
            setFilters={setFilters}
            resultCount={filteredBusinesses.length}
          />
        )}

        {/* Main Content Area */}
        <main className="container mx-auto px-4 py-6">
          {renderContent()}
        </main>

        <Footer />

        {/* Quick View Modal */}
        {selectedBusiness && (
          <QuickViewModal 
            business={selectedBusiness}
            onClose={() => setSelectedBusiness(null)}
            isSaved={savedBusinesses.includes(selectedBusiness.id)}
            onSave={() => handleSaveBusiness(selectedBusiness.id)}
          />
        )}
      </div>
    </>
  );
};

export default Directory;
