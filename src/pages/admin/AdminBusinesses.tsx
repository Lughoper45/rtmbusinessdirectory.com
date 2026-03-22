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
  Eye, 
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Business } from "@/types/directory";

const categories = [
  "Restaurants", "Professional Services", "Shopping", "Health & Medical",
  "Home Services", "Recreation", "Automotive", "Beauty & Spa",
  "Education", "Banking & Finance", "Arts & Entertainment"
];

const provinces = ["ON", "BC", "AB", "QC", "MB", "NS", "NB", "SK", "NL", "PE", "YT", "NT", "NU"];

export default function AdminBusinesses() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  function mapRowToBusiness(row: any): Business {
    return {
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

  const handleEdit = (business: Business) => {
    setSelectedBusiness(business);
    setFormData({ ...business });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (business: Business) => {
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
        b.id === selectedBusiness.id ? mapRowToBusiness(data) : b
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

  const toggleVerification = async (business: Business) => {
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
        b.id === business.id ? { ...b, isVerified: !b.isVerified } : b
      ));
      toast.success(business.isVerified ? "Business unverified" : "Business verified");
    } catch (error) {
      console.error("Error toggling verification:", error);
      toast.error("Failed to update verification status");
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
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Business
          </Button>
        </div>

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
      </div>
    </AdminLayout>
  );
}
