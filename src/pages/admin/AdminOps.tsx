import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Loader2, ExternalLink, Plus, X, Download } from "lucide-react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { invokeListingAdmin } from "@/services/listingAdmin";

type CrmContact = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  company: string | null;
  stage: string;
  source: string | null;
  tags: string[] | null;
  lead_score: number | null;
  notes: string | null;
  owner_user_id: string | null;
  profile_id: string | null;
  created_at: string;
  updated_at: string;
};

type CrmActivity = {
  id: string;
  contact_id: string;
  deal_id: string | null;
  kind: string;
  payload: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
};

type CrmTask = {
  id: string;
  contact_id: string;
  task_type: string | null;
  title: string;
  due_at: string | null;
  status: string;
  ai_suggested_body: string | null;
  created_at: string;
  updated_at: string;
};

type CrmDeal = {
  id: string;
  contact_id: string;
  deal_type: string;
  amount_cents: number | null;
  stage: string;
  package_id: string | null;
  notes: string | null;
  created_at: string;
};

type ContactDetail = {
  contact: CrmContact;
  activities: CrmActivity[];
  tasks: CrmTask[];
  deals: CrmDeal[];
};

const STAGES = ["visitor", "lead", "qualified", "member", "opportunity", "customer", "alumni"] as const;

const stageBadgeClass: Record<string, string> = {
  visitor: "bg-gray-100 text-gray-700",
  lead: "bg-blue-100 text-blue-700",
  qualified: "bg-purple-100 text-purple-700",
  member: "bg-emerald-100 text-emerald-700",
  opportunity: "bg-orange-100 text-orange-700",
  customer: "bg-green-100 text-green-700",
  alumni: "bg-slate-100 text-slate-700",
};

const SOURCE_TABS = [
  { label: "All", value: "" },
  { label: "Grant Leads", value: "grant_checklist" },
  { label: "Growth Audit", value: "growth_audit" },
  { label: "Listing Outreach", value: "listing_outreach" },
  { label: "Members", value: "member" },
];

function sourceLabel(source: string | null): string {
  if (!source) return "—";
  if (source === "grant_checklist") return "Grant Leads";
  if (source === "grow_page" || source === "growth_audit") return "Growth Audit";
  if (source === "listing_outreach") return "Listing Outreach";
  if (source === "member") return "Members";
  return source;
}

function StageBadge({ stage }: { stage: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stageBadgeClass[stage] ?? "bg-gray-100 text-gray-700"}`}>
      {stage}
    </span>
  );
}

function FunnelBar({
  contacts,
  activeStage,
  onStageClick,
}: {
  contacts: CrmContact[];
  activeStage: string;
  onStageClick: (stage: string) => void;
}) {
  const counts = STAGES.reduce<Record<string, number>>((acc, s) => {
    acc[s] = contacts.filter((c) => c.stage === s).length;
    return acc;
  }, {});

  return (
    <div className="flex flex-wrap gap-2">
      {STAGES.map((stage) => (
        <button
          key={stage}
          onClick={() => onStageClick(activeStage === stage ? "" : stage)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            activeStage === stage ? "ring-2 ring-offset-1 ring-current" : "opacity-80 hover:opacity-100"
          } ${stageBadgeClass[stage] ?? "bg-gray-100 text-gray-700"}`}
        >
          {stage}
          <span className="bg-white/50 rounded-full px-1.5 py-0.5 text-xs font-bold">{counts[stage]}</span>
        </button>
      ))}
    </div>
  );
}

function ActivityItem({ activity }: { activity: CrmActivity }) {
  const relTime = formatDistanceToNow(new Date(activity.created_at), { addSuffix: true });

  let description = "";
  if (activity.kind === "note") {
    description = String(activity.payload?.text ?? "");
  } else if (activity.kind === "stage_change") {
    description = `Stage: ${String(activity.payload?.from ?? "")} → ${String(activity.payload?.to ?? "")}`;
  } else {
    description = JSON.stringify(activity.payload);
  }

  return (
    <div className="flex gap-3 py-2 border-b last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
            activity.kind === "note" ? "bg-blue-50 text-blue-700" :
            activity.kind === "stage_change" ? "bg-purple-50 text-purple-700" :
            "bg-gray-50 text-gray-600"
          }`}>
            {activity.kind}
          </span>
          <span className="text-xs text-muted-foreground">{relTime}</span>
        </div>
        <p className="text-sm text-foreground">{description}</p>
      </div>
    </div>
  );
}

function ContactDrawer({
  contactId,
  onClose,
  onSaved,
}: {
  contactId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [detail, setDetail] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editStage, setEditStage] = useState("");
  const [editScore, setEditScore] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const loadDetail = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await invokeListingAdmin<ContactDetail>("get-crm-contact", { contact_id: id });
      setDetail(res);
      setEditName(res.contact.name ?? "");
      setEditPhone(res.contact.phone ?? "");
      setEditCompany(res.contact.company ?? "");
      setEditStage(res.contact.stage);
      setEditScore(res.contact.lead_score != null ? String(res.contact.lead_score) : "");
      setEditNotes(res.contact.notes ?? "");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load contact");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (contactId) void loadDetail(contactId);
    else setDetail(null);
  }, [contactId, loadDetail]);

  async function handleSave() {
    if (!contactId) return;
    setSaving(true);
    try {
      await invokeListingAdmin("update-crm-contact", {
        contact_id: contactId,
        patch: {
          name: editName || null,
          phone: editPhone || null,
          company: editCompany || null,
          stage: editStage,
          lead_score: editScore ? Number(editScore) : null,
          notes: editNotes || null,
        },
      });
      toast.success("Contact saved");
      onSaved();
      void loadDetail(contactId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote() {
    if (!contactId || !noteText.trim()) return;
    setSubmittingNote(true);
    try {
      await invokeListingAdmin("add-crm-note", { contact_id: contactId, note: noteText.trim() });
      setNoteText("");
      toast.success("Note added");
      void loadDetail(contactId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add note");
    } finally {
      setSubmittingNote(false);
    }
  }

  async function handleToggleTask(task: CrmTask) {
    const newStatus = task.status === "done" ? "open" : "done";
    try {
      await invokeListingAdmin("update-crm-task", { task_id: task.id, patch: { status: newStatus } });
      if (contactId) void loadDetail(contactId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update task");
    }
  }

  async function handleAddTask() {
    if (!contactId || !newTaskTitle.trim()) return;
    setAddingTask(true);
    try {
      await invokeListingAdmin("create-crm-task", {
        contact_id: contactId,
        title: newTaskTitle.trim(),
        due_at: newTaskDue || undefined,
      });
      setNewTaskTitle("");
      setNewTaskDue("");
      setShowTaskForm(false);
      toast.success("Task created");
      void loadDetail(contactId);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create task");
    } finally {
      setAddingTask(false);
    }
  }

  return (
    <Sheet open={!!contactId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-[600px] overflow-y-auto p-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : detail ? (
          <div className="flex flex-col h-full">
            <SheetHeader className="px-6 py-4 border-b">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-lg font-semibold truncate">
                    {detail.contact.name ?? detail.contact.email}
                  </SheetTitle>
                  <p className="text-sm text-muted-foreground truncate">{detail.contact.email}</p>
                </div>
                <StageBadge stage={detail.contact.stage} />
              </div>
            </SheetHeader>

            <div className="flex flex-1 min-h-0">
              <div className="w-1/3 border-r p-4 space-y-3 overflow-y-auto">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Name</label>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Full name" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Phone</label>
                  <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="Phone" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Company</label>
                  <Input value={editCompany} onChange={(e) => setEditCompany(e.target.value)} placeholder="Company" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Stage</label>
                  <Select value={editStage} onValueChange={setEditStage}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Lead Score</label>
                  <Input type="number" value={editScore} onChange={(e) => setEditScore(e.target.value)} placeholder="0–100" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Notes</label>
                  <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Internal notes..." rows={4} className="text-sm resize-none" />
                </div>
                <Button onClick={handleSave} disabled={saving} size="sm" className="w-full">
                  {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  Save
                </Button>

                {detail.deals.length > 0 && (
                  <div className="pt-2 border-t space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Deals</p>
                    {detail.deals.map((d) => (
                      <div key={d.id} className="rounded border p-2 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{d.deal_type}</span>
                          <StageBadge stage={d.stage} />
                        </div>
                        {d.amount_cents != null && (
                          <p className="text-muted-foreground">${(d.amount_cents / 100).toFixed(2)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Add Note</p>
                  <Textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Write a note..."
                    rows={3}
                    className="text-sm resize-none"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={submittingNote || !noteText.trim()}
                  >
                    {submittingNote ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    Add Note
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tasks</p>
                    <button
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      onClick={() => setShowTaskForm((v) => !v)}
                    >
                      <Plus className="h-3 w-3" /> Add task
                    </button>
                  </div>
                  {showTaskForm && (
                    <div className="flex gap-2 items-start">
                      <Input
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="Task title"
                        className="h-8 text-sm flex-1"
                      />
                      <Input
                        type="date"
                        value={newTaskDue}
                        onChange={(e) => setNewTaskDue(e.target.value)}
                        className="h-8 text-sm w-36"
                      />
                      <Button size="sm" onClick={handleAddTask} disabled={addingTask || !newTaskTitle.trim()}>
                        {addingTask ? <Loader2 className="h-3 w-3 animate-spin" /> : "Add"}
                      </Button>
                      <button onClick={() => setShowTaskForm(false)}>
                        <X className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                  {detail.tasks.length === 0 && !showTaskForm ? (
                    <p className="text-xs text-muted-foreground">No tasks</p>
                  ) : (
                    <div className="space-y-1">
                      {detail.tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2 py-1">
                          <Checkbox
                            checked={task.status === "done"}
                            onCheckedChange={() => void handleToggleTask(task)}
                          />
                          <span className={`text-sm flex-1 ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                            {task.title}
                          </span>
                          {task.due_at && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(task.due_at), "MMM d")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Activity Timeline</p>
                  {detail.activities.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No activity yet</p>
                  ) : (
                    <div className="divide-y">
                      {detail.activities.map((a) => (
                        <ActivityItem key={a.id} activity={a} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function exportCSV(contacts: CrmContact[]) {
  const headers = ["id", "email", "name", "phone", "company", "stage", "source", "tags", "lead_score", "updated_at"];
  const rows = contacts.map((c) => [
    c.id,
    c.email,
    c.name ?? "",
    c.phone ?? "",
    c.company ?? "",
    c.stage,
    c.source ?? "",
    (c.tags ?? []).join(";"),
    c.lead_score ?? "",
    c.updated_at,
  ]);
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `crm-contacts-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminOps() {
  const [allContacts, setAllContacts] = useState<CrmContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStage, setBulkStage] = useState("");
  const [applyingBulk, setApplyingBulk] = useState(false);
  const [drawerContactId, setDrawerContactId] = useState<string | null>(null);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = { limit: 500 };
      if (stageFilter) payload.stage = stageFilter;
      if (sourceFilter) payload.source = sourceFilter;
      if (search.trim()) payload.search = search.trim();
      const res = await invokeListingAdmin<{ contacts: CrmContact[]; total: number }>("list-crm-contacts", payload);
      setAllContacts(res.contacts ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load contacts");
    } finally {
      setLoading(false);
    }
  }, [stageFilter, sourceFilter, search]);

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  const filtered = allContacts;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)));
    }
  }

  async function handleBulkApply() {
    if (!bulkStage || selectedIds.size === 0) return;
    setApplyingBulk(true);
    try {
      await invokeListingAdmin("bulk-update-crm-contacts", { ids: Array.from(selectedIds), stage: bulkStage });
      toast.success(`Updated ${selectedIds.size} contacts to "${bulkStage}"`);
      setSelectedIds(new Set());
      setBulkStage("");
      void loadContacts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk update failed");
    } finally {
      setApplyingBulk(false);
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Ops CRM</h1>

        {!loading && (
          <FunnelBar
            contacts={allContacts}
            activeStage={stageFilter}
            onStageClick={(s) => { setStageFilter(s); setSelectedIds(new Set()); }}
          />
        )}

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex gap-1">
              {SOURCE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => { setSourceFilter(tab.value); setSelectedIds(new Set()); }}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                    sourceFilter === tab.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex-1 min-w-48">
              <Input
                placeholder="Search name, email, company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            {stageFilter && (
              <Button variant="outline" size="sm" onClick={() => setStageFilter("")} className="h-8 gap-1">
                <X className="h-3 w-3" /> Clear stage
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 ml-auto"
              onClick={() => exportCSV(filtered)}
              disabled={filtered.length === 0}
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 px-3 py-2 bg-muted rounded-md">
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <Select value={bulkStage} onValueChange={setBulkStage}>
                <SelectTrigger className="h-8 w-40 text-sm">
                  <SelectValue placeholder="Change stage..." />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" onClick={handleBulkApply} disabled={applyingBulk || !bulkStage} className="h-8">
                {applyingBulk ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Apply
              </Button>
              <button
                className="text-xs text-muted-foreground hover:text-foreground ml-auto"
                onClick={() => setSelectedIds(new Set())}
              >
                Deselect all
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={filtered.length > 0 && selectedIds.size === filtered.length}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Name / Email</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No contacts found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((c) => (
                      <TableRow
                        key={c.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setDrawerContactId(c.id)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(c.id)}
                            onCheckedChange={() => toggleSelect(c.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">{c.name ?? "—"}</div>
                          <div className="text-xs text-muted-foreground">{c.email}</div>
                        </TableCell>
                        <TableCell>
                          <StageBadge stage={c.stage} />
                        </TableCell>
                        <TableCell className="text-sm">{sourceLabel(c.source)}</TableCell>
                        <TableCell className="text-xs">
                          {(c.tags ?? []).length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {(c.tags ?? []).slice(0, 3).map((t) => (
                                <Badge key={t} variant="outline" className="text-xs py-0">{t}</Badge>
                              ))}
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-sm">{c.lead_score ?? "—"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(c.updated_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <button
                            className="p-1 rounded hover:bg-muted"
                            onClick={() => setDrawerContactId(c.id)}
                          >
                            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <ContactDrawer
          contactId={drawerContactId}
          onClose={() => setDrawerContactId(null)}
          onSaved={() => void loadContacts()}
        />
      </div>
    </AdminLayout>
  );
}
