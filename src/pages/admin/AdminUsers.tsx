import { useEffect, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Shield, UserCheck, UserX, Search, Calendar, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: "member" | "business" | "admin";
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

const stats = [
  { title: "Total Users", icon: Users, color: "text-blue-600", key: "total" },
  { title: "Admin Users", icon: Shield, color: "text-red-600", key: "admin" },
  { title: "Business Owners", icon: UserCheck, color: "text-purple-600", key: "business" },
  { title: "Members", icon: UserX, color: "text-orange-600", key: "member" },
] as const;

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statsData, setStatsData] = useState<Record<string, number>>({ total: 0, admin: 0, business: 0, member: 0 });
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    void loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const { data: payload, error } = await supabase.functions.invoke("list-admin-users");

      if (error) throw error;

      if (payload?.error) throw new Error(payload.error);

      const normalizedUsers: UserProfile[] = (payload?.users ?? []).map((profile: UserProfile) => ({
        ...profile,
        role: (profile.role || "member") as UserProfile["role"],
      }));

      setUsers(normalizedUsers);
      setStatsData({
        total: normalizedUsers.length,
        admin: normalizedUsers.filter((user) => user.role === "admin").length,
        business: normalizedUsers.filter((user) => user.role === "business").length,
        member: normalizedUsers.filter((user) => user.role === "member").length,
      });
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.user_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleUpdateUserRole = async (userId: string, role: UserProfile["role"]) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role })
        .eq("user_id", userId);

      if (error) throw error;

      toast.success("User role updated");
      setIsEditOpen(false);
      void loadUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user role");
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage profile roles and access levels</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat) => (
            <Card key={stat.key}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{statsData[stat.key]}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>All Profiles</CardTitle>
                <CardDescription>{filteredUsers.length} profile{filteredUsers.length !== 1 ? "s" : ""} found</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No profiles found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            {user.avatar_url ? (
                              <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full" />
                            ) : (
                              <span className="text-sm font-medium text-primary">
                                {user.full_name?.[0]?.toUpperCase() || "U"}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{user.full_name || "Unknown"}</div>
                            <div className="text-xs text-gray-500">{user.email || user.phone || "No email/phone"}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{user.user_id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(user.created_at)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update name and role for this profile</DialogDescription>
            </DialogHeader>
            {selectedUser ? (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Name</label>
                  <Input defaultValue={selectedUser.full_name || ""} id="edit-name" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role</label>
                  <Select
                    defaultValue={selectedUser.role}
                    onValueChange={(value: UserProfile["role"]) => handleUpdateUserRole(selectedUser.user_id, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : null}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  const name = (document.getElementById("edit-name") as HTMLInputElement).value;
                  if (selectedUser) {
                    supabase
                      .from("profiles")
                      .update({ full_name: name })
                      .eq("user_id", selectedUser.user_id)
                      .then(() => {
                        toast.success("User updated");
                        setIsEditOpen(false);
                        void loadUsers();
                      });
                  }
                }}
              >
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
