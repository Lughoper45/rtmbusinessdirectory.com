import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, FileText, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type GrantApplicationRow = {
  id: string;
  status: string;
  email: string | null;
  grant_name: string;
  item_type: string;
  item_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export default function AdminGrants() {
  const [applications, setApplications] = useState<GrantApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    void loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const { data: payload, error } = await supabase.functions.invoke("admin-grants-bff", {
        body: { action: "list-applications" },
      });

      if (error) throw error;
      if (payload?.error) throw new Error(payload.error);

      setApplications((payload?.applications ?? []) as GrantApplicationRow[]);
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : "Failed to load grant applications. Deploy admin-grants-bff and set Stellar secrets.",
      );
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return applications.filter((row) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        row.email?.toLowerCase().includes(q) ||
        row.grant_name.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q) ||
        row.user_id.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || row.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [applications, search, statusFilter]);

  const statuses = useMemo(() => {
    return [...new Set(applications.map((a) => a.status))].sort();
  }, [applications]);

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
          <h1 className="text-3xl font-bold">Grants</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Read-only queue of GrantPilot applications (Stellar / vinbf)
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Applications queue
                </CardTitle>
                <CardDescription>
                  {filtered.length} application{filtered.length !== 1 ? "s" : ""} shown
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search email, grant, status..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {statuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No grant applications found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Grant</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Badge variant="secondary">{row.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.email || <span className="text-gray-400">—</span>}
                      </TableCell>
                      <TableCell className="font-medium">{row.grant_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4" />
                          {formatDate(row.created_at)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
