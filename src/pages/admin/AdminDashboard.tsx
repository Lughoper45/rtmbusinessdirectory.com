import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, TrendingUp, Eye, Star, MapPin } from "lucide-react";
import { businessStats, allBusinesses } from "@/data/index";

const stats = [
  {
    title: "Total Businesses",
    value: businessStats.total.toLocaleString(),
    description:
      businessStats.sourceMode === "database"
        ? "Local bundle stats shown for reference while production uses the database"
        : `${businessStats.rtmCount} from RTM, ${businessStats.generatedCount} system-generated listings`,
    icon: Building2,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  {
    title: "Verified Listings",
    value: allBusinesses.filter(b => b.isVerified).length.toLocaleString(),
    description: "Businesses with verified badge",
    icon: Star,
    color: "text-green-600",
    bgColor: "bg-green-50 dark:bg-green-950",
  },
  {
    title: "Total Cities",
    value: new Set(allBusinesses.map(b => b.city)).size.toLocaleString(),
    description: "Cities with listings",
    icon: MapPin,
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950",
  },
  {
    title: "Total Categories",
    value: new Set(allBusinesses.map(b => b.category)).size.toLocaleString(),
    description: "Business categories",
    icon: TrendingUp,
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950",
  },
];

const recentBusinesses = allBusinesses.slice(0, 10);

export default function AdminDashboard() {
  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Overview of the local directory bundle used for fallback and demo states
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Recent Listings */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Listings</CardTitle>
              <CardDescription>
                Latest added businesses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBusinesses.map((business) => (
                  <div
                    key={business.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex-shrink-0 overflow-hidden">
                      {business.image ? (
                        <img
                          src={business.image}
                          alt={business.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/48x48?text=' + business.name.charAt(0);
                          }}
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-gray-400">
                          {business.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{business.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {business.city}, {business.province}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100">
                        {business.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
              <CardDescription>
                Businesses by category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(
                  allBusinesses.reduce((acc, b) => {
                    acc[b.category] = (acc[b.category] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                )
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{
                              width: `${(count / allBusinesses.length) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 w-12 text-right">
                          {count.toLocaleString()}
                        </span>
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
