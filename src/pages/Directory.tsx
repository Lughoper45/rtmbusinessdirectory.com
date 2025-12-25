import { useState, useMemo } from "react";
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
import { getPaginatedBusinesses, allBusinesses } from "@/data/index";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const PAGE_SIZE = 24;

const Directory = () => {
  const [mode, setMode] = useState<DiscoveryMode>("mission");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
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

  // Paginated data - only loads PAGE_SIZE businesses at a time
  const { paginatedBusinesses, totalCount, totalPages } = useMemo(() => {
    const result = getPaginatedBusinesses(currentPage, PAGE_SIZE, {
      search: searchQuery || undefined,
      category: filters.categories.length === 1 ? filters.categories[0] : undefined,
      minRating: filters.rating > 0 ? filters.rating : undefined,
    });
    return {
      paginatedBusinesses: result.businesses,
      totalCount: result.total,
      totalPages: result.pages,
    };
  }, [currentPage, searchQuery, filters.categories, filters.rating]);

  // Reset to page 1 when filters change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  const renderContent = () => {
    switch (mode) {
      case "map":
        return (
          <BusinessMap 
            businesses={paginatedBusinesses}
            onSelectBusiness={setSelectedBusiness}
            savedBusinesses={savedBusinesses}
            onSave={handleSaveBusiness}
          />
        );
      case "discovery":
        return (
          <DiscoverySwipe 
            businesses={paginatedBusinesses}
            onSave={handleSaveBusiness}
            savedBusinesses={savedBusinesses}
          />
        );
      case "story":
        return (
          <StoryMode 
            businesses={paginatedBusinesses}
            onSelectBusiness={setSelectedBusiness}
            savedBusinesses={savedBusinesses}
            onSave={handleSaveBusiness}
          />
        );
      case "saved":
        const saved = allBusinesses.filter(b => savedBusinesses.includes(b.id));
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
        const bestBusinesses = [...paginatedBusinesses].sort((a, b) => b.rating - a.rating);
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
        const trending = [...paginatedBusinesses].sort((a, b) => b.reviewCount - a.reviewCount);
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
            businesses={paginatedBusinesses}
            onSelectBusiness={setSelectedBusiness}
            savedBusinesses={savedBusinesses}
            onSave={handleSaveBusiness}
          />
        ) : (
          <BusinessList 
            businesses={paginatedBusinesses}
            onSelectBusiness={setSelectedBusiness}
            savedBusinesses={savedBusinesses}
            onSave={handleSaveBusiness}
          />
        );
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1 || ["discovery", "story", "saved"].includes(mode)) return null;
    
    return (
      <div className="mt-8 flex flex-col items-center gap-4">
        <p className="text-sm text-muted-foreground">
          Showing {((currentPage - 1) * PAGE_SIZE) + 1} - {Math.min(currentPage * PAGE_SIZE, totalCount)} of {totalCount.toLocaleString()} businesses
        </p>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
            
            {getPageNumbers().map((page, idx) => (
              <PaginationItem key={idx}>
                {page === "ellipsis" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
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
          setSearchQuery={handleSearchChange}
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
            setFilters={handleFiltersChange}
            resultCount={totalCount}
          />
        )}

        {/* Main Content Area */}
        <main className="container mx-auto px-4 py-6">
          {renderContent()}
          {renderPagination()}
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
