import { useEffect, useMemo, useState, useCallback } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { fetchPaginatedBusinesses, fetchBusinessesByIds } from "@/data/database";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Database, TriangleAlert } from "lucide-react";

const PAGE_SIZE = 24;
const showDirectorySourceNotice =
  import.meta.env.DEV || import.meta.env.VITE_SHOW_DIRECTORY_SOURCE_NOTICE === "true";

const Directory = () => {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  // Read URL query params on mount
  const urlSearch = searchParams.get("search") || "";
  const urlProvince = searchParams.get("province") || "";
  const urlCategory = searchParams.get("category") || "";
  const urlOwnership = searchParams.get("ownership") || "";
  const urlFilter = searchParams.get("filter") || "";

  const [mode, setMode] = useState<DiscoveryMode>("mission");
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FilterState>({
    location: urlProvince,
    categories: urlCategory ? [urlCategory] : [],
    rating: 0,
    priceRange: [],
    features: [],
    ownership: urlOwnership ? [urlOwnership] : [],
    openNow: false,
  });
  const [savedBusinessIds, setSavedBusinessIds] = useState<string[]>([]);
  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [user, setUser] = useState<User | null>(null);

  // Database query state
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [savedBusinesses, setSavedBusinesses] = useState<Business[]>([]);
  const [dataSource, setDataSource] = useState<"database" | "local">("database");
  const [databaseEmpty, setDatabaseEmpty] = useState(false);
  const [sourceMode, setSourceMode] = useState<"hybrid" | "database" | "local">("hybrid");
  const [localStats, setLocalStats] = useState({ total: 0, rtmCount: 0, generatedCount: 0 });

  // Load user
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch saved businesses
  useEffect(() => {
    if (user) {
      supabase
        .from("saved_businesses")
        .select("business_id")
        .eq("user_id", user.id)
        .then(({ data }) => {
          if (data) setSavedBusinessIds(data.map(d => d.business_id));
        });
    } else {
      setSavedBusinessIds([]);
    }
  }, [user]);

  // Fetch saved business details when IDs change
  useEffect(() => {
    if (savedBusinessIds.length > 0 && mode === "saved") {
      fetchBusinessesByIds(savedBusinessIds).then(setSavedBusinesses);
    }
  }, [savedBusinessIds, mode]);

  // Fetch businesses from database
  const loadBusinesses = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchPaginatedBusinesses(currentPage, PAGE_SIZE, {
      search: searchQuery || undefined,
      category: filters.categories.length === 1 ? filters.categories[0] : undefined,
      minRating: filters.rating > 0 ? filters.rating : undefined,
      province: filters.location || undefined,
      ownership: filters.ownership.length === 1 ? filters.ownership[0] : undefined,
      worldCupReady: urlFilter === "world-cup" ? true : undefined,
    });
    setBusinesses(result.businesses);
    setTotalCount(result.total);
    setTotalPages(result.pages);
    setDataSource(result.source);
    setDatabaseEmpty(result.databaseEmpty);
    setSourceMode(result.sourceMode);
    setLocalStats(result.localStats);
    setIsLoading(false);
  }, [currentPage, searchQuery, filters.categories, filters.rating, filters.location, filters.ownership, urlFilter]);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  const openBusinessProfile = (business: Business) => {
    navigate(businessProfilePath(business));
  };

  const handleSaveBusiness = async (business: Business) => {
    if (!user) {
      toast.error("Please sign in to save businesses", {
        action: { label: "Sign In", onClick: () => navigate("/auth") },
      });
      return;
    }

    const isSaved = savedBusinessIds.includes(business.id);
    if (isSaved) {
      const { error } = await supabase
        .from("saved_businesses")
        .delete()
        .eq("user_id", user.id)
        .eq("business_id", business.id);
      if (!error) {
        setSavedBusinessIds(prev => prev.filter(id => id !== business.id));
        toast.success("Removed from saved");
      }
    } else {
      const { error } = await supabase
        .from("saved_businesses")
        .insert({
          user_id: user.id,
          business_id: business.id,
          business_name: business.name,
          business_category: business.category,
          business_city: business.city,
        });
      if (!error) {
        setSavedBusinessIds(prev => [...prev, business.id]);
        toast.success("Business saved!");
      }
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

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
    if (isLoading) {
      return (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Loading businesses...</p>
        </div>
      );
    }

    switch (mode) {
      case "map":
        return <BusinessMap businesses={businesses} onSelectBusiness={openBusinessProfile} savedBusinesses={savedBusinessIds} onSave={handleSaveBusiness} />;
      case "discovery":
        return <DiscoverySwipe businesses={businesses} onSave={handleSaveBusiness} savedBusinesses={savedBusinessIds} />;
      case "story":
        return <StoryMode businesses={businesses} onSelectBusiness={openBusinessProfile} savedBusinesses={savedBusinessIds} onSave={handleSaveBusiness} />;
      case "saved":
        return viewType === "grid"
          ? <BusinessGrid businesses={savedBusinesses} onSelectBusiness={openBusinessProfile} savedBusinesses={savedBusinessIds} onSave={handleSaveBusiness} />
          : <BusinessList businesses={savedBusinesses} onSelectBusiness={openBusinessProfile} savedBusinesses={savedBusinessIds} onSave={handleSaveBusiness} />;
      case "best": {
        const sorted = [...businesses].sort((a, b) => b.rating - a.rating);
        return viewType === "grid"
          ? <BusinessGrid businesses={sorted} onSelectBusiness={openBusinessProfile} savedBusinesses={savedBusinessIds} onSave={handleSaveBusiness} />
          : <BusinessList businesses={sorted} onSelectBusiness={openBusinessProfile} savedBusinesses={savedBusinessIds} onSave={handleSaveBusiness} />;
      }
      case "trending": {
        const trending = [...businesses].sort((a, b) => b.reviewCount - a.reviewCount);
        return viewType === "grid"
          ? <BusinessGrid businesses={trending} onSelectBusiness={openBusinessProfile} savedBusinesses={savedBusinessIds} onSave={handleSaveBusiness} />
          : <BusinessList businesses={trending} onSelectBusiness={openBusinessProfile} savedBusinesses={savedBusinessIds} onSave={handleSaveBusiness} />;
      }
      default:
        return viewType === "grid"
          ? <BusinessGrid businesses={businesses} onSelectBusiness={openBusinessProfile} savedBusinesses={savedBusinessIds} onSave={handleSaveBusiness} />
          : <BusinessList businesses={businesses} onSelectBusiness={openBusinessProfile} savedBusinesses={savedBusinessIds} onSave={handleSaveBusiness} />;
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
              <PaginationPrevious onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
            </PaginationItem>
            {getPageNumbers().map((page, idx) => (
              <PaginationItem key={idx}>
                {page === "ellipsis" ? <PaginationEllipsis /> : (
                  <PaginationLink onClick={() => setCurrentPage(page)} isActive={currentPage === page} className="cursor-pointer">{page}</PaginationLink>
                )}
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
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
        <meta name="description" content="Explore 10,000+ verified Canadian businesses. AI-powered search, multiple discovery modes, and personalized recommendations." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navbar />
        <DirectorySearchBar searchQuery={searchQuery} setSearchQuery={handleSearchChange} />
        <DiscoveryModeSelector mode={mode} setMode={setMode} viewType={viewType} setViewType={setViewType} />
        {!["discovery", "story"].includes(mode) && (
          <SmartFilters filters={filters} setFilters={handleFiltersChange} resultCount={totalCount} />
        )}
        <main className="container mx-auto px-4 py-6">
          {showDirectorySourceNotice && dataSource === "local" && (
            <Alert className="mb-6 border-amber-200 bg-amber-50 text-amber-950">
              <TriangleAlert className="h-4 w-4" />
              <AlertTitle>Directory is using bundled fallback data</AlertTitle>
              <AlertDescription>
                {databaseEmpty
                  ? `Supabase businesses are empty, so the public directory is currently showing ${localStats.rtmCount.toLocaleString()} RTM-export businesses plus ${localStats.generatedCount.toLocaleString()} system-generated Canadian business listings.`
                  : `The directory fell back to bundled local data because the database request failed. Current local bundle: ${localStats.rtmCount.toLocaleString()} RTM-export businesses plus ${localStats.generatedCount.toLocaleString()} system-generated Canadian business listings.`}
                {sourceMode === "hybrid"
                  ? " Set VITE_DIRECTORY_SOURCE_MODE=database once the full old-site import is loaded into public.businesses."
                  : ""}
              </AlertDescription>
            </Alert>
          )}
          {showDirectorySourceNotice && dataSource === "database" && sourceMode === "database" && totalCount === 0 && (
            <Alert className="mb-6 border-sky-200 bg-sky-50 text-sky-950">
              <Database className="h-4 w-4" />
              <AlertTitle>Directory is running database-only</AlertTitle>
              <AlertDescription>
                No businesses were returned from `public.businesses`. This is the correct production-safe behavior while the full old-site import is still pending.
              </AlertDescription>
            </Alert>
          )}
          {renderContent()}
          {renderPagination()}
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Directory;
