import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Search, ShieldCheck, UserPlus, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type MemberRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  display_name: string | null;
  full_name: string | null;
  membership_status: string | null;
  referral_code: string | null;
  role: string | null;
  joined_at: string | null;
  created_at: string;
};

type PaymentRow = {
  id: string;
  user_id: string;
  amount: number | null;
  status: string | null;
  created_at: string;
};

const statusVariant = (status: string | null) => {
  if (status === "active") return "default";
  if (status === "pending_payment") return "secondary";
  return "outline";
};

export default function AdminMembership() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(
          "id, user_id, email, display_name, full_name, membership_status, referral_code, role, joined_at, created_at",
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMembers((profiles ?? []) as MemberRow[]);

      const { data: payData, error: payError } = await supabase
        .from("membership_payments")
        .select("id, user_id, amount, status, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!payError) {
        setPayments((payData ?? []) as PaymentRow[]);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load membership data. Ensure admin RLS policies are applied.");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (profileId: string, status: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ membership_status: status })
      .eq("id", profileId);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Membership status updated");
    void load();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      const matchesStatus = statusFilter === "all" || (m.membership_status ?? "unknown") === statusFilter;
      const matchesSearch =
        q.length === 0 ||
        (m.email ?? "").toLowerCase().includes(q) ||
        (m.display_name ?? "").toLowerCase().includes(q) ||
        (m.full_name ?? "").toLowerCase().includes(q) ||
        (m.referral_code ?? "").toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [members, search, statusFilter]);

  const stats = useMemo(
    () => ({
      total: members.length,
      active: members.filter((m) => m.membership_status === "active").length,
      pending: members.filter((m) => m.membership_status === "pending_payment").length,
      recent: members.filter((m) => {
        const created = new Date(m.created_at).getTime();
        return Date.now() - created < 7 * 86400000;
      }).length,
    }),
    [members],
  );

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Membership operations</h1>
          <p className="text-muted-foreground">
            Monitor signups, payment status, and activate members from one admin workspace.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total members</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Pending payment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                New (7 days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.recent}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Member directory
            </CardTitle>
            <CardDescription>All profiles from membership.rtmbusinessdirectory.com signups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search email, name, referral code…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending_payment">Pending payment</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => void load()}>
                Refresh
              </Button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Referral</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>
                        <p className="font-medium">{m.display_name || m.full_name || "—"}</p>
                        <p className="text-xs text-muted-foreground">{m.email || m.id}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(m.membership_status)}>
                          {m.membership_status ?? "unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{m.referral_code ?? "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {m.joined_at
                          ? new Date(m.joined_at).toLocaleDateString()
                          : new Date(m.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {m.membership_status !== "active" && (
                          <Button size="sm" onClick={() => void updateStatus(m.id, "active")}>
                            Activate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {payments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Recent payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm font-mono">{p.user_id.slice(0, 8)}…</TableCell>
                      <TableCell>${Number(p.amount ?? 0).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{p.status ?? "—"}</Badge>
                      </TableCell>
                      <TableCell>{new Date(p.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
