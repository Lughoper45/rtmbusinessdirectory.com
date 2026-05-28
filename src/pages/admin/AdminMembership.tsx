import { useEffect, useMemo, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CreditCard,
  Mail,
  MailCheck,
  ChevronDown,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  Loader2,
  Phone,
  Clock,
  AlertCircle,
  SendHorizonal,
  FileText,
  Lock,
  Pencil,
  Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type MemberRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  phone: string | null;
  membership_status: string | null;
  referral_code: string | null;
  joined_at: string | null;
  created_at: string;
};

type EmailLogRow = {
  id: string;
  profile_id: string | null;
  email: string;
  template: string;
  subject: string;
  sent_by: string;
  sent_at: string;
};

type EmailCount = { profile_id: string; count: number; last_sent: string };

const TEMPLATES = [
  { id: "payment_reminder", label: "Payment reminder", description: "Nudge to complete $100 payment" },
  { id: "final_notice", label: "Final notice", description: "Last follow-up before archiving" },
] as const;

const statusVariant = (status: string | null): "default" | "secondary" | "outline" => {
  if (status === "active") return "default";
  if (status === "pending_payment") return "secondary";
  return "outline";
};

const templateLabel: Record<string, string> = {
  payment_reminder: "Payment reminder",
  final_notice: "Final notice",
  signup_welcome: "Signup welcome",
  activation_welcome: "Activation welcome",
  custom: "Custom",
};

export default function AdminMembership() {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [emailLog, setEmailLog] = useState<EmailLogRow[]>([]);
  const [emailCounts, setEmailCounts] = useState<Record<string, EmailCount>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sending, setSending] = useState<Record<string, boolean>>({});
  const [bulkSending, setBulkSending] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    profileId: string;
    name: string;
    template: string;
  } | null>(null);

  // Template editor state
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);
  const [templateOverrides, setTemplateOverrides] = useState<Record<string, { subject: string; notes: string }>>({
    payment_reminder: { subject: "Your RTM membership is waiting for activation", notes: "" },
    final_notice: { subject: "Final reminder — your RTM membership spot", notes: "" },
  });

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [{ data: profiles, error }, { data: logData }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, email, display_name, phone, membership_status, referral_code, joined_at, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("member_email_log")
          .select("id, profile_id, email, template, subject, sent_by, sent_at")
          .order("sent_at", { ascending: false })
          .limit(100),
      ]);

      if (error) throw error;
      setMembers((profiles ?? []) as MemberRow[]);
      setEmailLog((logData ?? []) as EmailLogRow[]);

      // Build count map
      const counts: Record<string, EmailCount> = {};
      for (const row of (logData ?? []) as EmailLogRow[]) {
        if (!row.profile_id) continue;
        if (!counts[row.profile_id]) {
          counts[row.profile_id] = { profile_id: row.profile_id, count: 0, last_sent: row.sent_at };
        }
        counts[row.profile_id].count += 1;
        if (row.sent_at > counts[row.profile_id].last_sent) {
          counts[row.profile_id].last_sent = row.sent_at;
        }
      }
      setEmailCounts(counts);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load membership data.");
    } finally {
      setLoading(false);
    }
  };

  const activateMember = async (profileId: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ membership_status: "active" })
      .eq("id", profileId);
    if (error) { toast.error(error.message); return; }
    toast.success("Member activated");
    void load();
  };

  const sendEmail = async (profileId: string, template: string) => {
    setSending((s) => ({ ...s, [profileId]: true }));
    try {
      const { error } = await supabase.functions.invoke("send-member-email", {
        body: { profileId, template },
      });
      if (error) throw error;
      toast.success(`${templateLabel[template] ?? template} sent`);
      void load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error(`Failed to send: ${msg}`);
    } finally {
      setSending((s) => ({ ...s, [profileId]: false }));
    }
  };

  const bulkEmailPending = async (template: string) => {
    const pending = members.filter((m) => m.membership_status === "pending_payment");
    if (pending.length === 0) { toast.info("No pending members to email"); return; }
    setBulkSending(true);
    let sent = 0;
    let failed = 0;
    for (const m of pending) {
      try {
        const { error } = await supabase.functions.invoke("send-member-email", {
          body: { profileId: m.id, template },
        });
        if (error) throw error;
        sent++;
      } catch {
        failed++;
      }
    }
    setBulkSending(false);
    toast.success(`Sent ${sent} emails${failed > 0 ? ` (${failed} failed)` : ""}`);
    void load();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return members.filter((m) => {
      const matchStatus = statusFilter === "all" || (m.membership_status ?? "") === statusFilter;
      const matchSearch =
        q.length === 0 ||
        (m.email ?? "").toLowerCase().includes(q) ||
        (m.display_name ?? "").toLowerCase().includes(q) ||
        (m.phone ?? "").includes(q) ||
        (m.referral_code ?? "").toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [members, search, statusFilter]);

  const pending = useMemo(() => members.filter((m) => m.membership_status === "pending_payment"), [members]);

  const stats = useMemo(() => ({
    total: members.length,
    active: members.filter((m) => m.membership_status === "active").length,
    pending: pending.length,
    contacted: pending.filter((m) => !!emailCounts[m.id]).length,
    recent: members.filter((m) => Date.now() - new Date(m.created_at).getTime() < 7 * 86400000).length,
  }), [members, pending, emailCounts]);

  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString("en-CA", { month: "short", day: "numeric" }) : "—";

  const fmtTime = (d: string) =>
    new Date(d).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const TEMPLATE_DEFINITIONS = [
    {
      id: "signup_welcome",
      label: "Signup welcome",
      trigger: "Auto — fires when user registers",
      locked: true,
      description: "Sent immediately on account creation. Contains two-step activation guide, benefits list, and Education Grant highlight.",
      preview: `Subject: Your RTM account is ready — complete your membership\n\nHi [name],\nThank you for signing up! Here's how to activate:\nStep 1 — Confirm your email\nStep 2 — Complete your $100 membership payment at your dashboard\n\nYou unlock: Member card, 5–50% savings, 50% off grants, FREE Education Grant, community fund.`,
    },
    {
      id: "payment_reminder",
      label: "Payment reminder",
      trigger: "Manual — send from outreach panel",
      locked: false,
      description: "First follow-up for pending_payment members. Highlights Education Grant as the new benefit added to membership.",
      preview: `Subject: Your RTM membership is waiting for activation\n\nHi [name],\nWe noticed you haven't completed your activation...\n\n[Education Grant callout]\nFREE govgranteducation.ca access ($49/year value) — activated automatically.`,
    },
    {
      id: "final_notice",
      label: "Final notice",
      trigger: "Manual — send from outreach panel",
      locked: false,
      description: "Last follow-up before marking inactive. Urgent tone, includes phone number for personal contact.",
      preview: `Subject: Final reminder — your RTM membership spot\n\nHi [name],\nThis is our last message about your pending RTM membership. Your spot is still reserved.\n\n[Activate now button]\n\nQuestions? Call +1 416 900 8728`,
    },
    {
      id: "activation_welcome",
      label: "Activation welcome",
      trigger: "Auto — fires when payment confirmed",
      locked: true,
      description: "Sent after payment succeeds. Includes dashboard link, referral code, Education Grant access, and grants workspace.",
      preview: `Subject: Welcome to RTM — you're activated!\n\nHi [name] 🎉\nYour membership is active!\n\n→ Dashboard: membership.rtmbusinessdirectory.com/dashboard\n→ Education Grant: govgranteducation.ca (auto-provisioned)\n→ Grants workspace: grants.rtmbusinessdirectory.com\n→ Referral link: earn 30% per member`,
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Membership</h1>
          <p className="text-muted-foreground">Track signups, send follow-up emails, manage templates, and activate members.</p>
        </div>

        <Tabs defaultValue="outreach">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="outreach">Outreach</TabsTrigger>
            <TabsTrigger value="templates">Email Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="outreach" className="mt-6 space-y-8">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div />
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={bulkSending} className="gap-2">
                  {bulkSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  Email all pending ({stats.pending})
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {TEMPLATES.map((t) => (
                  <DropdownMenuItem key={t.id} onClick={() => bulkEmailPending(t.id)}>
                    <div>
                      <div className="font-medium">{t.label}</div>
                      <div className="text-xs text-muted-foreground">{t.description}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          {[
            { label: "Total members", value: stats.total, icon: Users },
            { label: "Active", value: stats.active, icon: ShieldCheck, color: "text-green-600" },
            { label: "Pending payment", value: stats.pending, icon: CreditCard, color: "text-amber-600" },
            { label: "Contacted", value: `${stats.contacted}/${stats.pending}`, icon: MailCheck, color: "text-blue-600" },
            { label: "New (7 days)", value: stats.recent, icon: UserPlus },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardHeader className="pb-2">
                <CardTitle className={`text-sm font-medium flex items-center gap-2 ${color ?? ""}`}>
                  <Icon className="w-4 h-4" /> {label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${color ?? ""}`}>{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pending outreach tracker */}
        {pending.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <AlertCircle className="w-5 h-5" />
                Pending payment — outreach tracker
              </CardTitle>
              <CardDescription>
                {stats.contacted} of {stats.pending} contacted · Send emails directly from this panel
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Emails sent</TableHead>
                    <TableHead>Last contact</TableHead>
                    <TableHead>Registered</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((m) => {
                    const contact = emailCounts[m.id];
                    const isSending = sending[m.id];
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <p className="font-medium">{m.display_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{m.email}</p>
                        </TableCell>
                        <TableCell>
                          {m.phone ? (
                            <a href={`tel:${m.phone}`} className="flex items-center gap-1 text-sm text-primary hover:underline">
                              <Phone className="h-3 w-3" /> {m.phone}
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">Not provided</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {contact ? (
                            <Badge variant="outline" className="gap-1">
                              <MailCheck className="h-3 w-3" /> {contact.count}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Not contacted</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {contact ? (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> {fmtDate(contact.last_sent)}
                            </span>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {fmtDate(m.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" disabled={isSending} className="gap-1">
                                  {isSending
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <SendHorizonal className="h-3 w-3" />}
                                  Email
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {TEMPLATES.map((t) => (
                                  <DropdownMenuItem
                                    key={t.id}
                                    onClick={() =>
                                      setConfirmDialog({
                                        open: true,
                                        profileId: m.id,
                                        name: m.display_name ?? m.email ?? m.id,
                                        template: t.id,
                                      })
                                    }
                                  >
                                    <div>
                                      <div className="font-medium">{t.label}</div>
                                      <div className="text-xs text-muted-foreground">{t.description}</div>
                                    </div>
                                  </DropdownMenuItem>
                                ))}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => activateMember(m.id)}
                                  className="text-green-700 focus:text-green-700"
                                >
                                  Activate manually
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* All members */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" /> All members
            </CardTitle>
            <CardDescription>Full member directory with search and status filter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search name, email, phone, referral code…"
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
              <Button variant="outline" onClick={() => void load()}>Refresh</Button>
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
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Emails</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((m) => {
                    const contact = emailCounts[m.id];
                    return (
                      <TableRow key={m.id}>
                        <TableCell>
                          <p className="font-medium">{m.display_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{m.email || m.id}</p>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {m.phone ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(m.membership_status)}>
                            {m.membership_status ?? "unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {contact ? `${contact.count} sent` : "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {fmtDate(m.joined_at ?? m.created_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          {m.membership_status !== "active" && (
                            <div className="flex items-center justify-end gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button size="sm" variant="outline" disabled={sending[m.id]} className="gap-1">
                                    {sending[m.id]
                                      ? <Loader2 className="h-3 w-3 animate-spin" />
                                      : <SendHorizonal className="h-3 w-3" />}
                                    Email <ChevronDown className="h-3 w-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {TEMPLATES.map((t) => (
                                    <DropdownMenuItem
                                      key={t.id}
                                      onClick={() =>
                                        setConfirmDialog({
                                          open: true,
                                          profileId: m.id,
                                          name: m.display_name ?? m.email ?? m.id,
                                          template: t.id,
                                        })
                                      }
                                    >
                                      {t.label}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <Button size="sm" onClick={() => activateMember(m.id)}>Activate</Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Email log */}
        {emailLog.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MailCheck className="w-5 h-5" /> Email outreach log
              </CardTitle>
              <CardDescription>Last 100 emails sent to members</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>To</TableHead>
                    <TableHead>Template</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Sent by</TableHead>
                    <TableHead>Sent at</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emailLog.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-sm">{row.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {templateLabel[row.template] ?? row.template}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[260px] truncate">
                        {row.subject}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.sent_by === "system" ? "system" : row.sent_by.slice(0, 8) + "…"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {fmtTime(row.sent_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
          </TabsContent>

          {/* ── Email Templates tab ── */}
          <TabsContent value="templates" className="mt-6 space-y-4">
            <div>
              <h2 className="text-xl font-bold">Email Templates</h2>
              <p className="text-sm text-muted-foreground mt-1">
                View all member email templates. Locked templates are auto-sent by the system. Manual templates can be customised per send from the outreach panel.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {TEMPLATE_DEFINITIONS.map((tpl) => (
                <Card key={tpl.id} className={tpl.locked ? "border-border/50 opacity-90" : "border-primary/30"}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <CardTitle className="text-base">{tpl.label}</CardTitle>
                      </div>
                      {tpl.locked ? (
                        <Badge variant="outline" className="gap-1 text-xs shrink-0">
                          <Lock className="h-3 w-3" /> Auto
                        </Badge>
                      ) : (
                        <Badge className="gap-1 text-xs shrink-0 bg-primary/10 text-primary border-0">
                          <Pencil className="h-3 w-3" /> Manual
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-xs">{tpl.trigger}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{tpl.description}</p>

                    {!tpl.locked && templateOverrides[tpl.id] && (
                      <div className="space-y-2">
                        <Label className="text-xs">Subject line</Label>
                        <Input
                          value={templateOverrides[tpl.id].subject}
                          onChange={(e) =>
                            setTemplateOverrides((prev) => ({
                              ...prev,
                              [tpl.id]: { ...prev[tpl.id], subject: e.target.value },
                            }))
                          }
                          className="text-sm h-8"
                        />
                        <Label className="text-xs">Notes for yourself (not sent)</Label>
                        <Textarea
                          value={templateOverrides[tpl.id].notes}
                          onChange={(e) =>
                            setTemplateOverrides((prev) => ({
                              ...prev,
                              [tpl.id]: { ...prev[tpl.id], notes: e.target.value },
                            }))
                          }
                          className="text-sm resize-none"
                          rows={2}
                          placeholder="e.g. Use this after 2 days of no response"
                        />
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1 w-full"
                      onClick={() => setPreviewTemplate(previewTemplate === tpl.id ? null : tpl.id)}
                    >
                      <Eye className="h-3 w-3" />
                      {previewTemplate === tpl.id ? "Hide preview" : "Preview content"}
                    </Button>

                    {previewTemplate === tpl.id && (
                      <pre className="text-xs bg-muted/60 rounded-lg p-3 whitespace-pre-wrap text-muted-foreground leading-relaxed">
                        {tpl.preview}
                      </pre>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-dashed">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Send a custom one-off email
                </CardTitle>
                <CardDescription>Send a custom message to a specific member by email address.</CardDescription>
              </CardHeader>
              <CardContent>
                <CustomEmailForm members={members} onSent={() => void load()} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirm send dialog */}
      {confirmDialog && (
        <Dialog
          open={confirmDialog.open}
          onOpenChange={(open) => !open && setConfirmDialog(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send email</DialogTitle>
              <DialogDescription>
                Send <strong>{templateLabel[confirmDialog.template]}</strong> to{" "}
                <strong>{confirmDialog.name}</strong>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDialog(null)}>Cancel</Button>
              <Button
                onClick={() => {
                  sendEmail(confirmDialog.profileId, confirmDialog.template);
                  setConfirmDialog(null);
                }}
              >
                Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AdminLayout>
  );
}

function CustomEmailForm({
  members,
  onSent,
}: {
  members: MemberRow[];
  onSent: () => void;
}) {
  const [profileId, setProfileId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const send = async () => {
    if (!profileId || !subject.trim() || !body.trim()) {
      toast.error("Select a member and fill in subject + message");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke("send-member-email", {
        body: { profileId, template: "custom", customSubject: subject, customHtml: `<p style="font-family:Arial,sans-serif;line-height:1.7;color:#0f172a;">${body.replace(/\n/g, "<br/>")}</p>` },
      });
      if (error) throw error;
      toast.success("Custom email sent");
      setProfileId(""); setSubject(""); setBody("");
      onSent();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Recipient</Label>
        <Select value={profileId} onValueChange={setProfileId}>
          <SelectTrigger className="text-sm">
            <SelectValue placeholder="Select a member…" />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.display_name || m.email} {m.membership_status === "pending_payment" ? "· pending" : "· active"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Subject</Label>
        <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject…" className="text-sm" />
      </div>
      <div>
        <Label className="text-xs">Message</Label>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Write your message here…" className="text-sm resize-none" />
      </div>
      <Button onClick={send} disabled={sending} className="gap-2 w-full">
        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
        Send custom email
      </Button>
    </div>
  );
}
