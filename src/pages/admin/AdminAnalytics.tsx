import { useState, useEffect } from "react";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Building2, Users, MapPin, TrendingUp, CheckCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminAnalytics() {
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    verifiedBusinesses: 0,
    byProvince: {} as Record<string, number>,
    byCategory: {} as Record<string, number>,
    topCategories: [] as { category: string; count: number }[],
    topProvinces: [] as { province: string; count: number }[],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from("businesses")
          .select("province,category,is_verified");

        if (error) throw error;

        const byProvince: Record<string, number> = {};
        const byCategory: Record<string, number> = {};
        let verified = 0;

        (data || []).forEach((b: { province: string; category: string; is_verified: boolean }) => {
          byProvince[b.province] = (byProvince[b.province] || 0) + 1;
          byCategory[b.category] = (byCategory[b.category] || 0) + 1;
          if (b.is_verified) verified++;
        });

        const topCategories = Object.entries(byCategory)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        const topProvinces = Object.entries(byProvince)
          .map(([province, count]) => ({ province, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setStats({
          totalBusinesses: data?.length || 0,
          verifiedBusinesses: verified,
          byProvince,
          byCategory,
          topCategories,
          topProvinces,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Directory performance overview
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
              <Building2 className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBusinesses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">In directory</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.verifiedBusinesses.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.verifiedBusinesses / stats.totalBusinesses) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.byCategory).length}</div>
              <p className="text-xs text-muted-foreground">Unique categories</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Provinces</CardTitle>
              <MapPin className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Object.keys(stats.byProvince).length}</div>
              <p className="text-xs text-muted-foreground">Provinces covered</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Top Categories</CardTitle>
              <CardDescription>Businesses by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topCategories.map(({ category, count }) => (
                  <div key={category} className="flex items-center">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{category}</span>
                        <span className="text-sm text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(count / stats.totalBusinesses) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Businesses by Province</CardTitle>
              <CardDescription>Geographic distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topProvinces.map(({ province, count }) => (
                  <div key={province} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{province}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{count}</span>
                      <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-accent rounded-full"
                          style={{ width: `${(count / stats.topProvinces[0].count) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
