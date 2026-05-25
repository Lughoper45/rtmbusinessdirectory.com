import { useEffect, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Building2, Users, TrendingUp, Eye, Star, MapPin, CreditCard, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type BusinessRow = {
  id: string;
  name: string;
  city: string | null;
  category: string | null;
  is_verified: boolean | null;
  created_at: string;
};

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [totalBusinesses, setTotalBusinesses] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [cityCount, setCityCount] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [recentBusinesses, setRecentBusinesses] = useState<BusinessRow[]>([]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("id, name, city, category, is_verified, created_at")
          .order("created_at", { ascending: false })
          .limit(500);

        if (error) throw error;

        const rows = (data ?? []) as BusinessRow[];
        setTotalBusinesses(rows.length);
        setVerifiedCount(rows.filter((b) => b.is_verified).length);
        setCityCount(new Set(rows.map((b) => b.city).filter(Boolean)).size);
        setCategoryCount(new Set(rows.map((b) => b.category).filter(Boolean)).size);
        setRecentBusinesses(rows.slice(0, 10));
      } catch (err) {
        console.error("Error loading admin dashboard stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const stats = [
    {
      title: "Total Businesses",
      value: totalBusinesses.toLocaleString(),
      description: "Rows in production `public.businesses`",
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Verified Listings",
      value: verifiedCount.toLocaleString(),
      description: "Businesses with verified badge",
      icon: Star,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Total Cities",
      value: cityCount.toLocaleString(),
      description: "Cities with listings",
      icon: MapPin,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Total Categories",
      value: categoryCount.toLocaleString(),
      description: "Business categories",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Platform overview — directory listings and membership operations
            </p>
          </div>
          <Button asChild>
            <Link to="/admin/membership">
              <CreditCard className="w-4 h-4 mr-2" />
              Membership ops
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
              {stats.map((stat) => (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Listings</CardTitle>
                  <CardDescription>Latest businesses in Supabase</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentBusinesses.length === 0 ? (
                      <p className="text-sm text-gray-500">No businesses in the database yet.</p>
                    ) : (
                      recentBusinesses.map((business) => (
                        <div
                          key={business.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{business.name}</p>
                              <p className="text-sm text-gray-500">
                                {business.category || "Uncategorized"} · {business.city || "Unknown city"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {business.is_verified && (
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            )}
                            <Button variant="ghost" size="sm" asChild>
                              <Link to="/admin/businesses">
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link to="/admin/businesses">
                      View All Businesses
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common admin tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/admin/businesses">
                      <Building2 className="w-4 h-4 mr-2" />
                      Manage Businesses
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/admin/users">
                      <Users className="w-4 h-4 mr-2" />
                      Manage Users
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link to="/admin/analytics">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Analytics
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
