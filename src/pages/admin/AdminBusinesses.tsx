import { useState, useMemo, useEffect, useCallback } from "react";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  CheckCircle,
  XCircle,
  Percent,
  AlertTriangle,
  Database,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Business } from "@/types/directory";
import { LOCAL_DATA, LOCAL_DATA_STATS } from "@/data/sourceConfig";

const categories = [
  "Restaurants", "Professional Services", "Shopping", "Health & Medical",
  "Home Services", "Recreation", "Automotive", "Beauty & Spa",
  "Education", "Banking & Finance", "Arts & Entertainment"
];

const provinces = ["ON", "BC", "AB", "QC", "MB", "NS", "NB", "SK", "NL", "PE", "YT", "NT", "NU"];

interface DealRecord {
  id: string;
  business_id: string | null;
  title: string;
  description: string | null;
  discount_percent: number;
  code: string | null;
  expires_at: string | null;
  is_active: boolean;
}

type AdminBusiness = Business & {
  rowId: string;
};

export default function AdminBusinesses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);
  const [isDeleteDealDialogOpen, setIsDeleteDealDialogOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<AdminBusiness | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<DealRecord | null>(null);
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [deals, setDeals] = useState<DealRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingLocalData, setIsSyncingLocalData] = useState(false);
  const pageSize = 20;

  const [formData, setFormData] = useState<Partial<Business>>({
    name: "",
    category: "",
    subcategory: "",
    description: "",
    address: "",
    city: "",
    province: "ON",
    phone: "",
    website: "",
    isVerified: false,
    priceRange: "$$",
  });

  const [dealFormData, setDealFormData] = useState({
    business_id: "",
    title: "",
    description: "",
    discount_percent: 10,
    code: "",
    expires_at: "",
    is_active: true,
  });

  const fetchBusinesses = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("businesses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBusinesses((data || []).map(mapRowToBusiness));
    } catch (error) {
      console.error("Error fetching businesses:", error);
      toast.error("Failed to load businesses");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchDeals = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("business_deals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDeals(data || []);
    } catch (error) {
      console.error("Error fetching deals:", error);
      toast.error("Failed to load deals");
    }
  }, []);

  useEffect(() => {
    fetchBusinesses();
    fetchDeals();
  }, [fetchBusinesses, fetchDeals]);

  function mapRowToBusiness(row: any): AdminBusiness {
    return {
      rowId: row.id,
      id: row.business_id,
      name: row.name,
      category: row.category,
      subcategory: row.subcategory || undefined,
      description: row.description || "",
      image: row.image || "",
      rating: Number(row.rating) || 0,
      reviewCount: row.review_count || 0,
      priceRange: row.price_range as "$" | "$$" | "$$$" | "$$$$",
      address: row.address || "",
      city: row.city || "",
      province: row.province || "ON",
      isOpen: row.is_open ?? true,
      isVerified: row.is_verified ?? false,
      isTrending: row.is_trending ?? false,
      isNew: row.is_new ?? false,
      isAwardWinner: row.is_award_winner ?? false,
      isWorldCupReady: row.is_world_cup_ready ?? false,
      phone: row.phone || undefined,
      website: row.website || undefined,
      features: row.features || [],
      ownership: row.ownership || [],
      coordinates: row.lat && row.lng ? { lat: Number(row.lat), lng: Number(row.lng) } : undefined,
    };
  }

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((business) => {
      const matchesSearch = 
        business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        business.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || business.category === categoryFilter;
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "verified" && business.isVerified) ||
        (statusFilter === "unverified" && !business.isVerified);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [businesses, searchQuery, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filteredBusinesses.length / pageSize);
  const paginatedBusinesses = filteredBusinesses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleAdd = () => {
    setFormData({
      name: "",
      category: "",
      subcategory: "",
      description: "",
      address: "",
      city: "",
      province: "ON",
      phone: "",
      website: "",
      isVerified: false,
      priceRange: "$$",
    });
    setIsAddDialogOpen(true);
  };

  const handleEdit = (business: AdminBusiness) => {
    setSelectedBusiness(business);
    setFormData({ ...business });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (business: AdminBusiness) => {
    setSelectedBusiness(business);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveNew = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("businesses")
        .insert({
          business_id: `rtm-${Date.now()}`,
          name: formData.name || "",
          category: formData.category || "Other",
          subcategory: formData.subcategory || "",
          description: formData.description || "",
          address: formData.address || "",
          city: formData.city || "Toronto",
          province: formData.province || "ON",
          phone: formData.phone || "",
          website: formData.website || "",
          is_verified: formData.isVerified || false,
          price_range: formData.priceRange || "$$",
          rating: 0,
          review_count: 0,
          is_open: true,
          features: [],
          ownership: [],
        })
        .select()
        .single();

      if (error) throw error;

      setBusinesses([mapRowToBusiness(data), ...businesses]);
      setIsAddDialogOpen(false);
      toast.success("Business added successfully");
    } catch (error) {
      console.error("Error adding business:", error);
      toast.error("Failed to add business");
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedBusiness) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from("businesses")
        .update({
          name: formData.name,
          category: formData.category,
          subcategory: formData.subcategory,
          description: formData.description,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          phone: formData.phone,
          website: formData.website,
          is_verified: formData.isVerified,
          price_range: formData.priceRange,
          updated_at: new Date().toISOString(),
        })
        .eq("business_id", selectedBusiness.id)
        .select()
        .single();

      if (error) throw error;

      setBusinesses(businesses.map(b => 
        b.rowId === selectedBusiness.rowId ? mapRowToBusiness(data) : b
      ));
      setIsEditDialogOpen(false);
      toast.success("Business updated successfully");
    } catch (error) {
      console.error("Error updating business:", error);
      toast.error("Failed to update business");
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedBusiness) return;
    
    try {
      const { error } = await (supabase as any)
        .from("businesses")
        .delete()
        .eq("business_id", selectedBusiness.id);

      if (error) throw error;

      setBusinesses(businesses.filter(b => b.id !== selectedBusiness.id));
      setIsDeleteDialogOpen(false);
      toast.success("Business deleted successfully");
    } catch (error) {
      console.error("Error deleting business:", error);
      toast.error("Failed to delete business");
    }
  };

  const toggleVerification = async (business: AdminBusiness) => {
    try {
      const { error } = await (supabase as any)
        .from("businesses")
        .update({ 
          is_verified: !business.isVerified,
          updated_at: new Date().toISOString(),
        })
        .eq("business_id", business.id);

      if (error) throw error;

      setBusinesses(businesses.map(b => 
        b.rowId === business.rowId ? { ...b, isVerified: !b.isVerified } : b
      ));
      toast.success(business.isVerified ? "Business unverified" : "Business verified");
    } catch (error) {
      console.error("Error toggling verification:", error);
      toast.error("Failed to update verification status");
    }
  };

  const openNewDealDialog = () => {
    setSelectedDeal(null);
    setDealFormData({
      business_id: "",
      title: "",
      description: "",
      discount_percent: 10,
      code: "",
      expires_at: "",
      is_active: true,
    });
    setIsDealDialogOpen(true);
  };

  const handleEditDeal = (deal: DealRecord) => {
    setSelectedDeal(deal);
    setDealFormData({
      business_id: deal.business_id || "",
      title: deal.title,
      description: deal.description || "",
      discount_percent: deal.discount_percent,
      code: deal.code || "",
      expires_at: deal.expires_at ? deal.expires_at.slice(0, 10) : "",
      is_active: deal.is_active,
    });
    setIsDealDialogOpen(true);
  };

  const handleSaveDeal = async () => {
    try {
      const payload = {
        business_id: dealFormData.business_id || null,
        title: dealFormData.title,
        description: dealFormData.description || null,
        discount_percent: Number(dealFormData.discount_percent),
        code: dealFormData.code || null,
        expires_at: dealFormData.expires_at ? new Date(dealFormData.expires_at).toISOString() : null,
        is_active: dealFormData.is_active,
      };

      if (selectedDeal) {
        const { data, error } = await (supabase as any)
          .from("business_deals")
          .update(payload)
          .eq("id", selectedDeal.id)
          .select()
          .single();

        if (error) throw error;
        setDeals((prev) => prev.map((deal) => (deal.id === selectedDeal.id ? data : deal)));
        toast.success("Deal updated successfully");
      } else {
        const { data, error } = await (supabase as any)
          .from("business_deals")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        setDeals((prev) => [data, ...prev]);
        toast.success("Deal created successfully");
      }

      setIsDealDialogOpen(false);
    } catch (error) {
      console.error("Error saving deal:", error);
      toast.error("Failed to save deal");
    }
  };

  const handleDeleteDeal = async () => {
    if (!selectedDeal) return;

    try {
      const { error } = await (supabase as any)
        .from("business_deals")
        .delete()
        .eq("id", selectedDeal.id);

      if (error) throw error;
      setDeals((prev) => prev.filter((deal) => deal.id !== selectedDeal.id));
      setIsDeleteDealDialogOpen(false);
      toast.success("Deal deleted successfully");
    } catch (error) {
      console.error("Error deleting deal:", error);
      toast.error("Failed to delete deal");
    }
  };

  const getBusinessName = (businessId: string | null) => {
    if (!businessId) return "Unassigned";
    return businesses.find((business) => business.rowId === businessId)?.name || "Unknown business";
  };

  const mapBusinessToInsertRow = (business: Business) => ({
    business_id: business.id,
    name: business.name,
    category: business.category,
    subcategory: business.subcategory || null,
    description: business.description || "",
    image: business.image || "",
    logo: business.logo || null,
    rating: business.rating || 0,
    review_count: business.reviewCount || 0,
    price_range: business.priceRange || "$$",
    address: business.address || "",
    city: business.city || "Toronto",
    province: business.province || "ON",
    distance: business.distance ?? null,
    is_open: business.isOpen ?? true,
    closing_time: business.closingTime || null,
    phone: business.phone || null,
    website: business.website || null,
    is_verified: business.isVerified ?? false,
    is_world_cup_ready: business.isWorldCupReady ?? false,
    is_new: business.isNew ?? false,
    is_trending: business.isTrending ?? false,
    is_award_winner: business.isAwardWinner ?? false,
    features: business.features || [],
    ownership: business.ownership || [],
    cuisine: business.cuisine || null,
    recent_review_text: business.recentReview?.text || null,
    recent_review_author: business.recentReview?.author || null,
    recent_review_rating: business.recentReview?.rating || null,
    lat: business.coordinates?.lat ?? null,
    lng: business.coordinates?.lng ?? null,
    photos: business.photos || [],
  });

  const syncLocalBusinessesToDatabase = async () => {
    setIsSyncingLocalData(true);

    try {
      const BATCH_SIZE = 200;
      let processed = 0;

      for (let i = 0; i < LOCAL_DATA.length; i += BATCH_SIZE) {
        const batch = LOCAL_DATA.slice(i, i + BATCH_SIZE).map(mapBusinessToInsertRow);
        const { error } = await (supabase as any)
          .from("businesses")
          .upsert(batch, { onConflict: "business_id" });

        if (error) throw error;
        processed += batch.length;
      }

      await fetchBusinesses();
      toast.success(`Synced ${processed.toLocaleString()} businesses to Supabase`);
    } catch (error) {
      console.error("Error syncing local businesses:", error);
      toast.error("Failed to sync local businesses to Supabase");
    } finally {
      setIsSyncingLocalData(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Businesses</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your business listings ({filteredBusinesses.length} total)
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={syncLocalBusinessesToDatabase}
              disabled={isSyncingLocalData}
              className="gap-2"
            >
              {isSyncingLocalData ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              {isSyncingLocalData ? "Syncing Inventory..." : "Sync Local Inventory"}
            </Button>
            <Button onClick={handleAdd} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Business
            </Button>
          </div>
        </div>

        <Card className="mb-6 border-sky-200 bg-sky-50/80">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="font-medium text-sky-950">Directory inventory available for sync</p>
              <p className="text-sm text-sky-900">
                {LOCAL_DATA_STATS.rtmCount.toLocaleString()} RTM export businesses plus{" "}
                {LOCAL_DATA_STATS.generatedCount.toLocaleString()} system-generated Canadian listings are available locally in this app.
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={syncLocalBusinessesToDatabase}
              disabled={isSyncingLocalData}
              className="gap-2"
            >
              {isSyncingLocalData ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              Push to Database
            </Button>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search businesses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        {businesses.length === 0 && !isLoading ? (
          <Card className="mb-6 border-amber-300 bg-amber-50/80">
            <CardContent className="flex gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-700 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">Database businesses are empty</p>
                <p className="text-sm text-amber-800">
                  The public directory can still show bundled fallback data, but admin only manages rows in `public.businesses`.
                  Use "Push to Database" to sync the current local inventory into Supabase so businesses appear here and become selectable for deals.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBusinesses.map((business) => (
                  <TableRow key={business.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded bg-gray-100 dark:bg-gray-800 flex-shrink-0 overflow-hidden">
                          {business.image ? (
                            <img
                              src={business.image}
                              alt={business.name}
                              className="h-full w-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/40x40?text=' + business.name.charAt(0);
                              }}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-400 text-sm">
                              {business.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{business.name}</p>
                          {business.phone && (
                            <p className="text-sm text-gray-500">{business.phone}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{business.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {business.city}, {business.province}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleVerification(business)}
                        className="gap-1"
                      >
                        {business.isVerified ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">Verified</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-400">Unverified</span>
                          </>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(business)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(business)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredBusinesses.length)} of {filteredBusinesses.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        <div className="mt-10">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">Deals & Discounts</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Manage public RTM offers and membership redemption campaigns
              </p>
            </div>
            <Button onClick={openNewDealDialog} className="gap-2">
              <Percent className="h-4 w-4" />
              Add Deal
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Offer</TableHead>
                    <TableHead>Business</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deals.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{deal.title}</p>
                          {deal.code ? <p className="text-sm text-gray-500">{deal.code}</p> : null}
                        </div>
                      </TableCell>
                      <TableCell>{getBusinessName(deal.business_id)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{deal.discount_percent}% off</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={deal.is_active ? "default" : "secondary"}>
                          {deal.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{deal.expires_at ? new Date(deal.expires_at).toLocaleDateString() : "Ongoing"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditDeal(deal)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              setSelectedDeal(deal);
                              setIsDeleteDealDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Business</DialogTitle>
              <DialogDescription>
                Add a new business listing to the directory.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-2">
                <Label htmlFor="name">Business Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter business name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subcategory">Subcategory</Label>
                  <Input
                    id="subcategory"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Business description"
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Street address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="province">Province</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(value) => setFormData({ ...formData, province: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map(prov => (
                        <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Phone number"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="Website URL"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveNew}>Add Business</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Business</DialogTitle>
              <DialogDescription>
                Update the business listing.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Business Name</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-subcategory">Subcategory</Label>
                  <Input
                    id="edit-subcategory"
                    value={formData.subcategory}
                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input
                  id="edit-address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-city">City</Label>
                  <Input
                    id="edit-city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-province">Province</Label>
                  <Select
                    value={formData.province}
                    onValueChange={(value) => setFormData({ ...formData, province: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map(prov => (
                        <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Phone</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-website">Website</Label>
                  <Input
                    id="edit-website"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Business</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedBusiness?.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDealDialogOpen} onOpenChange={setIsDealDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedDeal ? "Edit Deal" : "Create Deal"}</DialogTitle>
              <DialogDescription>
                Configure a discount offer that appears on the public RTM deals surfaces.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="deal-business">Business</Label>
                <Select
                  value={dealFormData.business_id}
                  onValueChange={(value) => setDealFormData((prev) => ({ ...prev, business_id: value }))}
                >
                  <SelectTrigger id="deal-business">
                    <SelectValue placeholder="Select business" />
                  </SelectTrigger>
                  <SelectContent>
                    {businesses.map((business) => (
                      <SelectItem key={business.rowId} value={business.rowId}>
                        {business.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deal-title">Title</Label>
                <Input
                  id="deal-title"
                  value={dealFormData.title}
                  onChange={(e) => setDealFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="20% off weekday lunch"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="deal-description">Description</Label>
                <Textarea
                  id="deal-description"
                  value={dealFormData.description}
                  onChange={(e) => setDealFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="deal-percent">Discount Percent</Label>
                  <Input
                    id="deal-percent"
                    type="number"
                    min={5}
                    max={50}
                    value={dealFormData.discount_percent}
                    onChange={(e) => setDealFormData((prev) => ({ ...prev, discount_percent: Number(e.target.value) }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deal-code">Promo Code</Label>
                  <Input
                    id="deal-code"
                    value={dealFormData.code}
                    onChange={(e) => setDealFormData((prev) => ({ ...prev, code: e.target.value }))}
                    placeholder="RTM20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="deal-expiry">Expires On</Label>
                  <Input
                    id="deal-expiry"
                    type="date"
                    value={dealFormData.expires_at}
                    onChange={(e) => setDealFormData((prev) => ({ ...prev, expires_at: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="deal-status">Status</Label>
                  <Select
                    value={dealFormData.is_active ? "active" : "inactive"}
                    onValueChange={(value) => setDealFormData((prev) => ({ ...prev, is_active: value === "active" }))}
                  >
                    <SelectTrigger id="deal-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDealDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveDeal}>{selectedDeal ? "Save Deal" : "Create Deal"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDealDialogOpen} onOpenChange={setIsDeleteDealDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Deal</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{selectedDeal?.title}"? This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDealDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteDeal}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
