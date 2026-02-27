import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
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
import { Business, DiscoveryMode, FilterState } from "@/types/directory";
import { getPaginatedBusinesses, allBusinesses } from "@/data/index";
import { businessProfilePath } from "@/lib/slug";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { User } from "@supabase/supabase-js";
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
  const navigate = useNavigate();

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
  const [savedBusinessIds, setSavedBusinessIds] = useState<string[]>([]);
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [user, setUser] = useState<User | null>(null);

  // Load user and saved businesses
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch saved businesses when user changes
  useEffect(() => {
    if (user) {
      fetchSavedBusinesses();
    } else {
      setSavedBusinessIds([]);
    }
  }, [user]);

  const fetchSavedBusinesses = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("saved_businesses")
      .select("business_id")
      .eq("user_id", user.id);

    if (!error && data) {
      setSavedBusinessIds(data.map(d => d.business_id));
    }
  };

  const openBusinessProfile = (business: Business) => {
    navigate(businessProfilePath(business));
  };

  const handleSaveBusiness = async (business: Business) => {
    if (!user) {
      toast.error("Please sign in to save businesses", {
        action: {
          label: "Sign In",
          onClick: () => navigate("/auth"),
        },
      });
      return;
    }

    const isSaved = savedBusinessIds.includes(business.id);

    if (isSaved) {
      // Remove from saved
      const { error } = await supabase
        .from("saved_businesses")
        .delete()
        .eq("user_id", user.id)
        .eq("business_id", business.id);

      if (error) {
        toast.error("Failed to remove business");
      } else {
        setSavedBusinessIds(prev => prev.filter(id => id !== business.id));
        toast.success("Removed from saved");
      }
    } else {
      // Add to saved
      const { error } = await supabase
        .from("saved_businesses")
        .insert({
          user_id: user.id,
          business_id: business.id,
          business_name: business.name,
          business_category: business.category,
          business_city: business.city,
        });

      if (error) {
        toast.error("Failed to save business");
      } else {
        setSavedBusinessIds(prev => [...prev, business.id]);
        toast.success("Business saved!");
      }
    }
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
            onSelectBusiness={openBusinessProfile}
            savedBusinesses={savedBusinessIds}
            onSave={handleSaveBusiness}
          />
        );
      case "discovery":
        return (
          <DiscoverySwipe
            businesses={paginatedBusinesses}
            onSave={handleSaveBusiness}
            savedBusinesses={savedBusinessIds}
          />
        );
      case "story":
        return (
          <StoryMode
            businesses={paginatedBusinesses}
            onSelectBusiness={openBusinessProfile}
            savedBusinesses={savedBusinessIds}
            onSave={handleSaveBusiness}
          />
        );
      case "saved":
        const saved = allBusinesses.filter((b) => savedBusinessIds.includes(b.id));
        return viewType === "grid" ? (
          <BusinessGrid
            businesses={saved}
            onSelectBusiness={openBusinessProfile}
            savedBusinesses={savedBusinessIds}
            onSave={handleSaveBusiness}
          />
        ) : (
          <BusinessList
            businesses={saved}
            onSelectBusiness={openBusinessProfile}
            savedBusinesses={savedBusinessIds}
            onSave={handleSaveBusiness}
          />
        );
      case "best":
        const bestBusinesses = [...paginatedBusinesses].sort((a, b) => b.rating - a.rating);
        return viewType === "grid" ? (
          <BusinessGrid
            businesses={bestBusinesses}
            onSelectBusiness={openBusinessProfile}
            savedBusinesses={savedBusinessIds}
            onSave={handleSaveBusiness}
          />
        ) : (
          <BusinessList
            businesses={bestBusinesses}
            onSelectBusiness={openBusinessProfile}
            savedBusinesses={savedBusinessIds}
            onSave={handleSaveBusiness}
          />
        );
      case "trending":
        const trending = [...paginatedBusinesses].sort((a, b) => b.reviewCount - a.reviewCount);
        return viewType === "grid" ? (
          <BusinessGrid
            businesses={trending}
            onSelectBusiness={openBusinessProfile}
            savedBusinesses={savedBusinessIds}
            onSave={handleSaveBusiness}
          />
        ) : (
          <BusinessList
            businesses={trending}
            onSelectBusiness={openBusinessProfile}
            savedBusinesses={savedBusinessIds}
            onSave={handleSaveBusiness}
          />
        );
      default:
        return viewType === "grid" ? (
          <BusinessGrid
            businesses={paginatedBusinesses}
            onSelectBusiness={openBusinessProfile}
            savedBusinesses={savedBusinessIds}
            onSave={handleSaveBusiness}
          />
        ) : (
          <BusinessList
            businesses={paginatedBusinesses}
            onSelectBusiness={openBusinessProfile}
            savedBusinesses={savedBusinessIds}
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
        <title>Discover Businesses | RTM Business Directory</title>
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
      </div>
    </>
  );
};

export default Directory;
