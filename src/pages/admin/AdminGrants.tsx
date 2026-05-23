import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ClipboardList, Copy, FileText, Loader2, Mail, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  buildGrantChecklistReplyText,
  GRANT_CHECKLIST_LEAD_STATUSES,
  type GrantChecklistLead,
} from "@/lib/grantChecklistLeads";
import {
  fetchGrantChecklistLeads,
  isGrantChecklistLeadStatus,
  updateGrantChecklistLead,
} from "@/services/grantChecklist";
import { getEdgeFunctionErrorMessage } from "@/lib/edgeFunctionErrors";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [leads, setLeads] = useState<GrantChecklistLead[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [search, setSearch] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [leadStatusFilter, setLeadStatusFilter] = useState("all");
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null);
  const [applicationsWarning, setApplicationsWarning] = useState<string | null>(null);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);

  useEffect(() => {
    void loadApplications();
    void loadLeads();
  }, []);

  const loadApplications = async () => {
    setLoadingApps(true);
    setApplicationsError(null);
    setApplicationsWarning(null);
    try {
      const { data: payload, error } = await supabase.functions.invoke("admin-grants-bff", {
        body: { action: "list-applications" },
      });

      if (payload?.error) throw new Error(payload.error);
      if (error) throw new Error(await getEdgeFunctionErrorMessage(error, payload));

      setApplications((payload?.applications ?? []) as GrantApplicationRow[]);
      if (typeof payload?.warning === "string" && payload.warning) {
        setApplicationsWarning(payload.warning);
      }
    } catch (e) {
      console.error(e);
      const message =
        e instanceof Error
          ? e.message
          : "Failed to load grant applications. Deploy admin-grants-bff and set Stellar secrets.";
      setApplicationsError(message);
      toast.error(message);
    } finally {
      setLoadingApps(false);
    }
  };

  const loadLeads = async () => {
    setLoadingLeads(true);
    try {
      setLeads(await fetchGrantChecklistLeads());
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : "Failed to load checklist leads. Run migration grant_checklist_leads on kajwp.",
      );
    } finally {
      setLoadingLeads(false);
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

  const filteredLeads = useMemo(() => {
    return leads.filter((row) => {
      const q = leadSearch.toLowerCase();
      const matchesSearch =
        !q ||
        row.email.toLowerCase().includes(q) ||
        row.name?.toLowerCase().includes(q) ||
        row.source.toLowerCase().includes(q) ||
        row.notes?.toLowerCase().includes(q);
      const matchesStatus = leadStatusFilter === "all" || row.status === leadStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, leadSearch, leadStatusFilter]);

  const statuses = useMemo(() => {
    return [...new Set(applications.map((a) => a.status))].sort();
  }, [applications]);

  const newLeadCount = useMemo(() => leads.filter((l) => l.status === "new").length, [leads]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const copyReplyTemplate = async (lead: GrantChecklistLead) => {
    const text = buildGrantChecklistReplyText({ recipientName: lead.name });
    await navigator.clipboard.writeText(text);
    toast.success("Reply template copied to clipboard");
  };

  const handleLeadStatusChange = async (lead: GrantChecklistLead, status: string) => {
    if (!isGrantChecklistLeadStatus(status)) return;
    setSavingLeadId(lead.id);
    try {
      await updateGrantChecklistLead(lead.id, { status });
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status } : l)));
      toast.success("Lead updated");
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to update lead");
    } finally {
      setSavingLeadId(null);
    }
  };

  const handleLeadNotesBlur = async (lead: GrantChecklistLead, notes: string) => {
    if (notes === (lead.notes ?? "")) return;
    setSavingLeadId(lead.id);
    try {
      await updateGrantChecklistLead(lead.id, { notes: notes || null });
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, notes: notes || null } : l)));
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to save notes");
    } finally {
      setSavingLeadId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Grants</h1>
          <p className="text-gray-600 dark:text-gray-400">
            GrantPilot applications (Stellar) and Free Grant Checklist leads (kajwp)
          </p>
        </div>

        <Tabs defaultValue="leads" className="space-y-6">
          <TabsList>
            <TabsTrigger value="leads" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Checklist leads
              {newLeadCount > 0 && (
                <Badge variant="default" className="ml-1 h-5 min-w-5 px-1.5">
                  {newLeadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="applications" className="gap-2">
              <FileText className="h-4 w-4" />
              Applications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5" />
                      Free Grant Checklist leads
                    </CardTitle>
                    <CardDescription>
                      {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""} — respond from{" "}
                      <code className="text-xs">info@rtmbusinessdirectory.com</code>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search email, name, notes..."
                        value={leadSearch}
                        onChange={(e) => setLeadSearch(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    <Select value={leadStatusFilter} onValueChange={setLeadStatusFilter}>
                      <SelectTrigger className="w-36">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        {GRANT_CHECKLIST_LEAD_STATUSES.map((status) => (
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
                {loadingLeads ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredLeads.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No checklist leads yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead>Requested</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <Select
                              value={row.status}
                              disabled={savingLeadId === row.id}
                              onValueChange={(v) => void handleLeadStatusChange(row, v)}
                            >
                              <SelectTrigger className="h-8 w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {GRANT_CHECKLIST_LEAD_STATUSES.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {status}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm font-medium">{row.email}</div>
                            {row.name && <div className="text-xs text-gray-500">{row.name}</div>}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{row.source}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              {formatDate(row.created_at)}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <Textarea
                              defaultValue={row.notes ?? ""}
                              placeholder="Internal notes…"
                              className="min-h-[60px] text-xs"
                              onBlur={(e) => void handleLeadNotesBlur(row, e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={`mailto:${row.email}?subject=${encodeURIComponent("Your Free Grant Checklist — RTM")}`}
                                >
                                  <Mail className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                title="Copy reply template"
                                onClick={() => void copyReplyTemplate(row)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Applications queue
                    </CardTitle>
                    <CardDescription>
                      {filtered.length} application{filtered.length !== 1 ? "s" : ""} shown (read-only, Stellar / vinbf)
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
                {applicationsWarning && (
                  <Alert className="mb-4" variant="default">
                    <AlertTitle>Stellar backend not configured</AlertTitle>
                    <AlertDescription>{applicationsWarning}</AlertDescription>
                  </Alert>
                )}
                {applicationsError && (
                  <Alert className="mb-4" variant="destructive">
                    <AlertTitle>Could not load applications</AlertTitle>
                    <AlertDescription>{applicationsError}</AlertDescription>
                  </Alert>
                )}
                {loadingApps ? (
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
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
