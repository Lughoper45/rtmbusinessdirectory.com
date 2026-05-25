import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  fetchGrowthAuditLeads,
  updateGrowthAuditLead,
  isGrowthAuditLeadStatus,
  type GrowthAuditLead,
} from "@/services/growthAudit";
import {
  fetchGrowthEngagementsAdmin,
  updateGrowthEngagementAdmin,
  updateGrowthMilestoneAdmin,
  type GrowthEngagement,
} from "@/services/growthEngagements";
import { getGrowPortalUrl } from "@/lib/site";

const LEAD_STATUSES = ["new", "contacted", "audit_scheduled", "proposal_sent", "won", "closed"] as const;
const ENGAGEMENT_STATUSES = ["pending_payment", "active", "paused", "completed", "cancelled"] as const;

export default function AdminGrowth() {
  const [tab, setTab] = useState("leads");
  const [leads, setLeads] = useState<GrowthAuditLead[]>([]);
  const [engagements, setEngagements] = useState<GrowthEngagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [engLoading, setEngLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLeads(await fetchGrowthAuditLeads());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load growth audit leads");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadEngagements = useCallback(async () => {
    setEngLoading(true);
    try {
      setEngagements(await fetchGrowthEngagementsAdmin());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load engagements");
    } finally {
      setEngLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    void loadEngagements();
  }, [load, loadEngagements]);

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      l.email.toLowerCase().includes(q) ||
      l.business_name?.toLowerCase().includes(q) ||
      l.city?.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || l.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const saveLead = async (id: string, patch: { status?: string; notes?: string }) => {
    setSavingId(id);
    try {
      if (patch.status && !isGrowthAuditLeadStatus(patch.status)) {
        throw new Error("Invalid status");
      }
      await updateGrowthAuditLead(id, patch);
      await load();
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingId(null);
    }
  };

  const saveEngagement = async (id: string, patch: { status?: string; advisor_notes?: string }) => {
    setSavingId(id);
    try {
      await updateGrowthEngagementAdmin(id, patch);
      await loadEngagements();
      toast.success("Saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Growth Services</h1>
          <p className="text-sm text-muted-foreground">
            Audit leads and client engagements —{" "}
            <a href={getGrowPortalUrl("/")} className="text-primary hover:underline">
              grow.rtmbusinessdirectory.com
            </a>
          </p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="leads">Audit leads</TabsTrigger>
            <TabsTrigger value="engagements">Engagements</TabsTrigger>
          </TabsList>

          <TabsContent value="leads" className="space-y-4 mt-4">
        <div className="flex flex-wrap gap-3">
          <Input
            placeholder="Search email, business, city…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {LEAD_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => void load()}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Leads ({filtered.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Challenge</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="font-medium">{lead.business_name ?? "—"}</div>
                        <div className="text-xs text-muted-foreground">{lead.city}</div>
                        <div className="text-xs">{lead.business_type}</div>
                      </TableCell>
                      <TableCell>
                        <a href={`mailto:${lead.email}`} className="text-primary text-sm">
                          {lead.email}
                        </a>
                        {lead.name && <div className="text-xs">{lead.name}</div>}
                      </TableCell>
                      <TableCell className="text-sm max-w-[160px]">{lead.biggest_challenge ?? "—"}</TableCell>
                      <TableCell className="text-xs">{lead.interested_package ?? "—"}</TableCell>
                      <TableCell>
                        <Select
                          value={lead.status}
                          onValueChange={(v) => void saveLead(lead.id, { status: v })}
                          disabled={savingId === lead.id}
                        >
                          <SelectTrigger className="h-8 w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LEAD_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="min-w-[200px]">
                        <Textarea
                          defaultValue={lead.notes ?? ""}
                          rows={2}
                          className="text-xs"
                          onBlur={(e) => {
                            if (e.target.value !== (lead.notes ?? "")) {
                              void saveLead(lead.id, { notes: e.target.value });
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" asChild>
                          <a href={`mailto:${lead.email}`}>
                            <Mail className="h-4 w-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
          </TabsContent>

          <TabsContent value="engagements" className="space-y-4 mt-4">
            <Button variant="outline" onClick={() => void loadEngagements()}>
              Refresh
            </Button>
            {engLoading ? (
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            ) : (
              <div className="space-y-4">
                {engagements.map((eng) => (
                  <Card key={eng.id}>
                    <CardHeader className="pb-2">
                      <div className="flex flex-wrap justify-between gap-2">
                        <CardTitle className="text-lg">
                          {eng.business_name ?? eng.package_id}
                        </CardTitle>
                        <Badge>{eng.status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Package: {eng.package_id} · User: {eng.user_id.slice(0, 8)}…
                      </p>
                      <Select
                        value={eng.status}
                        onValueChange={(v) => void saveEngagement(eng.id, { status: v })}
                        disabled={savingId === eng.id}
                      >
                        <SelectTrigger className="h-8 w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ENGAGEMENT_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Textarea
                        placeholder="Advisor notes"
                        defaultValue={eng.advisor_notes ?? ""}
                        rows={2}
                        className="text-sm"
                        onBlur={(e) => {
                          if (e.target.value !== (eng.advisor_notes ?? "")) {
                            void saveEngagement(eng.id, { advisor_notes: e.target.value });
                          }
                        }}
                      />
                      <ul className="text-sm space-y-1 border-t pt-3">
                        {(eng.milestones ?? []).map((m) => (
                          <li key={m.id} className="flex items-center justify-between gap-2">
                            <span>{m.title}</span>
                            <Select
                              value={m.status}
                              onValueChange={(v) =>
                                void updateGrowthMilestoneAdmin(m.id, {
                                  status: v as typeof m.status,
                                }).then(() => loadEngagements())
                              }
                            >
                              <SelectTrigger className="h-7 w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">pending</SelectItem>
                                <SelectItem value="in_progress">in_progress</SelectItem>
                                <SelectItem value="done">done</SelectItem>
                                <SelectItem value="skipped">skipped</SelectItem>
                              </SelectContent>
                            </Select>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
