import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, UserCheck, UserX } from "lucide-react";

const stats = [
  { title: "Total Users", value: "1,234", icon: Users, color: "text-blue-600" },
  { title: "Active Users", value: "856", icon: UserCheck, color: "text-green-600" },
  { title: "Business Owners", value: "412", icon: Shield, color: "text-purple-600" },
  { title: "Inactive Users", value: "378", icon: UserX, color: "text-gray-600" },
];

export default function AdminUsers() {
  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage users and permissions
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Coming Soon</CardTitle>
            <CardDescription>
              User management features will be available after integrating authentication.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">
              This section will allow you to manage user accounts, roles, and permissions.
              Connect Supabase auth to enable user management.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
