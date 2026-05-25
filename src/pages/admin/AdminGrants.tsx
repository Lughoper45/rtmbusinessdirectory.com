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
import { Calendar, ClipboardList, Copy, FileText, Inbox, Loader2, Mail, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  buildGrantChecklistReplyText,
  buildGrantChecklistReplyHtml,
  GRANT_CHECKLIST_EMAIL_SUBJECT,
  GRANT_CHECKLIST_LEAD_STATUSES,
  resolveGrantChecklistRecipientName,
  type GrantChecklistLead,
} from "@/lib/grantChecklistLeads";
import {
  fetchGrantChecklistLeads,
  isGrantChecklistLeadStatus,
  sendGrantChecklistBatch,
  sendGrantChecklistEmail,
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

type GrantIntakeRow = {
  id: string;
  user_id: string;
  email: string | null;
  grant_id: string;
  grant_name: string;
  package_id: string | null;
  status: string;
  readiness_score: number;
  readiness_status: string;
  source: string;
  created_at: string;
  updated_at: string;
};

export default function AdminGrants() {
  const [applications, setApplications] = useState<GrantApplicationRow[]>([]);
  const [intakes, setIntakes] = useState<GrantIntakeRow[]>([]);
  const [leads, setLeads] = useState<GrantChecklistLead[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [loadingIntakes, setLoadingIntakes] = useState(true);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [search, setSearch] = useState("");
  const [intakeSearch, setIntakeSearch] = useState("");
  const [leadSearch, setLeadSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [intakeStatusFilter, setIntakeStatusFilter] = useState("all");
  const [leadStatusFilter, setLeadStatusFilter] = useState("all");
  const [savingLeadId, setSavingLeadId] = useState<string | null>(null);
  const [sendingLeadId, setSendingLeadId] = useState<string | null>(null);
  const [batchSending, setBatchSending] = useState(false);
  const [applicationsWarning, setApplicationsWarning] = useState<string | null>(null);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);

  useEffect(() => {
    void loadApplications();
    void loadIntakes();
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
          : "Failed to load grant applications. Deploy admin-grants-bff and apply grants schema on kajwp.";
      setApplicationsError(message);
      toast.error(message);
    } finally {
      setLoadingApps(false);
    }
  };

  const loadIntakes = async () => {
    setLoadingIntakes(true);
    try {
      const { data: payload, error } = await supabase.functions.invoke("admin-grants-bff", {
        body: { action: "list-intakes" },
      });

      if (payload?.error) throw new Error(payload.error);
      if (error) throw new Error(await getEdgeFunctionErrorMessage(error, payload));

      setIntakes((payload?.intakes ?? []) as GrantIntakeRow[]);
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error
          ? e.message
          : "Failed to load grant intakes. Apply grant_intake_hub migration and deploy admin-grants-bff.",
      );
    } finally {
      setLoadingIntakes(false);
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

  const filteredIntakes = useMemo(() => {
    return intakes.filter((row) => {
      const q = intakeSearch.toLowerCase();
      const matchesSearch =
        !q ||
        row.email?.toLowerCase().includes(q) ||
        row.grant_name.toLowerCase().includes(q) ||
        row.status.toLowerCase().includes(q) ||
        row.readiness_status.toLowerCase().includes(q) ||
        row.package_id?.toLowerCase().includes(q);
      const matchesStatus = intakeStatusFilter === "all" || row.status === intakeStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [intakes, intakeSearch, intakeStatusFilter]);

  const intakeStatuses = useMemo(() => {
    return [...new Set(intakes.map((i) => i.status))].sort();
  }, [intakes]);

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
    const text = buildGrantChecklistReplyText({
      recipientName: resolveGrantChecklistRecipientName(lead.email, lead.name),
    });
    await navigator.clipboard.writeText(text);
    toast.success("Reply template copied to clipboard");
  };

  const previewHtml = (lead: GrantChecklistLead) => {
    const html = buildGrantChecklistReplyHtml({
      recipientName: resolveGrantChecklistRecipientName(lead.email, lead.name),
    });
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const handleSendChecklist = async (lead: GrantChecklistLead) => {
    setSendingLeadId(lead.id);
    try {
      const result = await sendGrantChecklistEmail(lead.id);
      if (!result.sent) {
        toast.error(result.error ?? "Failed to send checklist email");
        return;
      }
      setLeads((prev) =>
        prev.map((l) =>
          l.id === lead.id
            ? {
                ...l,
                status: l.status === "new" ? "contacted" : l.status,
                notes: l.notes
                  ? `${l.notes}\nChecklist email sent via admin ${new Date().toISOString().slice(0, 10)}.`
                  : `Checklist email sent via admin ${new Date().toISOString().slice(0, 10)}.`,
              }
            : l,
        ),
      );
      toast.success(`Checklist sent to ${result.email}`);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Failed to send checklist email");
    } finally {
      setSendingLeadId(null);
    }
  };

  const handleSendAllNew = async () => {
    const newLeadIds = leads.filter((l) => l.status === "new").map((l) => l.id);
    if (!newLeadIds.length) {
      toast.message("No new leads to send");
      return;
    }
    if (
      !window.confirm(
        `Send checklist email to ${newLeadIds.length} new lead(s) via Resend?\n\nSubject: ${GRANT_CHECKLIST_EMAIL_SUBJECT}`,
      )
    ) {
      return;
    }

    setBatchSending(true);
    try {
      const result = await sendGrantChecklistBatch(newLeadIds);
      await loadLeads();
      if (result.failedCount > 0) {
        toast.warning(`Sent ${result.sentCount}; ${result.failedCount} failed`);
      } else {
        toast.success(`Checklist sent to ${result.sentCount} lead(s)`);
      }
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Batch send failed");
    } finally {
      setBatchSending(false);
    }
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
            GrantPilot applications and Free Grant Checklist leads (kajwp)
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
            <TabsTrigger value="intakes" className="gap-2">
              <Inbox className="h-4 w-4" />
              Intakes
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
                      {filteredLeads.length} lead{filteredLeads.length !== 1 ? "s" : ""} — send via Resend from{" "}
                      <code className="text-xs">info@rtmbusinessdirectory.com</code>
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Button
                      variant="default"
                      size="sm"
                      disabled={batchSending || newLeadCount === 0}
                      onClick={() => void handleSendAllNew()}
                    >
                      {batchSending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Send to all new ({newLeadCount})
                    </Button>
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
                            {(row.name || resolveGrantChecklistRecipientName(row.email, row.name)) && (
                              <div className="text-xs text-gray-500">
                                {row.name ?? resolveGrantChecklistRecipientName(row.email, row.name)}
                              </div>
                            )}
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
                            <div className="flex justify-end gap-1 flex-wrap">
                              <Button
                                variant="default"
                                size="sm"
                                title="Send checklist via Resend"
                                disabled={sendingLeadId === row.id || batchSending}
                                onClick={() => void handleSendChecklist(row)}
                              >
                                {sendingLeadId === row.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                title="Preview HTML email"
                                onClick={() => previewHtml(row)}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm" asChild>
                                <a
                                  href={`mailto:${row.email}?subject=${encodeURIComponent(GRANT_CHECKLIST_EMAIL_SUBJECT)}`}
                                >
                                  <Mail className="h-4 w-4" />
                                </a>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                title="Copy plain-text template"
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

          <TabsContent value="intakes">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Inbox className="h-5 w-5" />
                      Intake queue
                    </CardTitle>
                    <CardDescription>
                      {filteredIntakes.length} intake{filteredIntakes.length !== 1 ? "s" : ""} — readiness scores from intake workflow
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search email, grant, status..."
                        value={intakeSearch}
                        onChange={(e) => setIntakeSearch(e.target.value)}
                        className="pl-9 w-64"
                      />
                    </div>
                    <Select value={intakeStatusFilter} onValueChange={setIntakeStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        {intakeStatuses.map((status) => (
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
                {loadingIntakes ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredIntakes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Inbox className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No grant intakes yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Readiness</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Grant</TableHead>
                        <TableHead>Package</TableHead>
                        <TableHead>Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIntakes.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold tabular-nums">{row.readiness_score}%</span>
                              <Badge variant="outline" className="text-xs">
                                {row.readiness_status.replace(/_/g, " ")}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{row.status}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {row.email || <span className="text-gray-400">—</span>}
                          </TableCell>
                          <TableCell className="font-medium max-w-[200px] truncate">{row.grant_name}</TableCell>
                          <TableCell>
                            {row.package_id ? (
                              <Badge variant="outline">{row.package_id}</Badge>
                            ) : (
                              <span className="text-gray-400 text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              {formatDate(row.updated_at)}
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
                      {filtered.length} application{filtered.length !== 1 ? "s" : ""} shown (read-only, kajwp)
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
                    <AlertTitle>Grants backend not configured</AlertTitle>
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
