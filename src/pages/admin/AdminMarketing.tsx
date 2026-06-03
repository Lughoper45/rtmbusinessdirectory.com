import { useCallback, useEffect, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  BarChart3,
  Loader2,
  Mail,
  Play,
  Pause,
  Upload,
  FileText,
  Workflow,
  Send,
} from "lucide-react";
import {
  invokeMarketingAdmin,
  parsePasteRows,
  type MarketingAnalytics,
  type MarketingCampaign,
  type MarketingProspect,
  type MarketingSequence,
  type MarketingTemplate,
} from "@/services/marketingAdmin";

const VARS_HINT = "{{business_name}}, {{city}}, {{province}}, {{contact_name_greeting}}, {{partner_url}}, {{deals_url}}, {{grants_url}}, {{unsubscribe_url}}";

export default function AdminMarketing() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<MarketingTemplate[]>([]);
  const [sequences, setSequences] = useState<MarketingSequence[]>([]);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [prospects, setProspects] = useState<MarketingProspect[]>([]);
  const [analytics, setAnalytics] = useState<MarketingAnalytics | null>(null);

  const [editTemplate, setEditTemplate] = useState<Partial<MarketingTemplate>>({
    template_key: "",
    name: "",
    subject: "",
    html_body: "",
    audience_type: "deal_partner_prospect",
    is_active: true,
  });

  const [editSequence, setEditSequence] = useState({
    sequence_key: "custom_sequence",
    name: "Custom sequence",
    audience_type: "deal_partner_prospect",
    steps: [
      { step_index: 0, delay_hours: 0, template_key: "deal_partner_intro" },
      { step_index: 1, delay_hours: 96, template_key: "deal_partner_followup" },
    ] as { step_index: number; delay_hours: number; template_key: string }[],
  });

  const [newCampaign, setNewCampaign] = useState({
    name: "",
    sequence_id: "",
    daily_send_cap: 50,
    send_mode: "automated",
  });

  const [pasteText, setPasteText] = useState("");
  const [lastBatchId, setLastBatchId] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [t, s, c, p, a] = await Promise.all([
        invokeMarketingAdmin<{ templates: MarketingTemplate[] }>("list-templates"),
        invokeMarketingAdmin<{ sequences: MarketingSequence[] }>("list-sequences"),
        invokeMarketingAdmin<{ campaigns: MarketingCampaign[] }>("list-campaigns"),
        invokeMarketingAdmin<{ prospects: MarketingProspect[] }>("list-prospects", {}),
        invokeMarketingAdmin<MarketingAnalytics>("get-analytics", {}),
      ]);
      setTemplates(t.templates ?? []);
      setSequences(s.sequences ?? []);
      setCampaigns(c.campaigns ?? []);
      setProspects(p.prospects ?? []);
      setAnalytics(a);
      if (!newCampaign.sequence_id && s.sequences?.[0]?.id) {
        setNewCampaign((prev) => ({ ...prev, sequence_id: s.sequences[0].id }));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load marketing hub");
    } finally {
      setLoading(false);
    }
  }, [newCampaign.sequence_id]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const loadCampaignAnalytics = async (campaignId: string) => {
    try {
      const a = await invokeMarketingAdmin<MarketingAnalytics>("get-analytics", { campaign_id: campaignId });
      setAnalytics(a);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Analytics failed");
    }
  };

  const saveTemplate = async () => {
    if (!editTemplate.template_key || !editTemplate.subject) {
      toast.error("Template key and subject required");
      return;
    }
    try {
      await invokeMarketingAdmin("upsert-template", { ...editTemplate });
      toast.success("Template saved");
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const previewTemplate = async () => {
    try {
      const res = await invokeMarketingAdmin<{ subject: string; html: string }>("preview-template", {
        template_key: editTemplate.template_key,
        html_body: editTemplate.html_body,
        subject_override: editTemplate.subject,
      });
      window.open("about:blank")?.document.write(
        `<title>${res.subject}</title>${res.html}`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Preview failed");
    }
  };

  const saveSequence = async () => {
    try {
      await invokeMarketingAdmin("upsert-sequence", editSequence);
      toast.success("Sequence saved");
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  };

  const createCampaign = async () => {
    if (!newCampaign.name || !newCampaign.sequence_id) {
      toast.error("Campaign name and sequence required");
      return;
    }
    try {
      await invokeMarketingAdmin("upsert-campaign", newCampaign);
      toast.success("Campaign created (draft)");
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Create failed");
    }
  };

  const importPaste = async () => {
    const rows = parsePasteRows(pasteText);
    if (!rows.length) {
      toast.error("No rows found. Use header: email, business_name, city, province");
      return;
    }
    try {
      const res = await invokeMarketingAdmin<{ batch: { id: string }; inserted: number; valid: number }>(
        "import-rows",
        {
          batch_name: `Paste ${new Date().toLocaleDateString()}`,
          source: "paste",
          rows,
          audience_type: "deal_partner_prospect",
        },
      );
      setLastBatchId(res.batch?.id ?? null);
      toast.success(`Imported ${res.inserted} rows (${res.valid} sendable)`);
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    }
  };

  const startCampaign = async (campaignId: string) => {
    try {
      const res = await invokeMarketingAdmin<{ enrolled: number }>("start-campaign", {
        campaign_id: campaignId,
        batch_id: lastBatchId ?? undefined,
      });
      toast.success(`Campaign running — ${res.enrolled} enrolled. Emails send automatically via ops-dispatcher.`);
      await invokeMarketingAdmin("run-dispatcher-marketing");
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Start failed");
    }
  };

  const pauseCampaign = async (campaignId: string) => {
    try {
      await invokeMarketingAdmin("pause-campaign", { campaign_id: campaignId });
      toast.success("Campaign paused");
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Pause failed");
    }
  };

  const runDispatcherNow = async () => {
    try {
      const res = await invokeMarketingAdmin<{ sent: string[]; errors: string[] }>("run-dispatcher-marketing");
      toast.success(`Sent ${res.sent?.length ?? 0} emails${res.errors?.length ? ` (${res.errors.length} errors)` : ""}`);
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Dispatcher failed");
    }
  };

  const statusColor = (status: string) => {
    if (status === "valid" || status === "role_account") return "default";
    if (status === "pending") return "secondary";
    return "destructive";
  };

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Marketing Hub</h1>
            <p className="text-muted-foreground text-sm">
              Automated sequences · email validation · open/click tracking · editable templates
            </p>
          </div>
          <Button variant="outline" onClick={() => void runDispatcherNow()}>
            <Send className="h-4 w-4 mr-2" />
            Run send queue now
          </Button>
        </div>

        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Sent</p>
                <p className="text-2xl font-bold">{analytics.sent}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Open rate</p>
                <p className="text-2xl font-bold">{analytics.open_rate}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Click rate</p>
                <p className="text-2xl font-bold">{analytics.click_rate}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Opened</p>
                <p className="text-2xl font-bold">{analytics.opened}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Bounced</p>
                <p className="text-2xl font-bold">{analytics.bounced}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="import">
            <TabsList className="flex flex-wrap h-auto">
              <TabsTrigger value="import">
                <Upload className="h-4 w-4 mr-1" /> Import
              </TabsTrigger>
              <TabsTrigger value="campaigns">
                <Play className="h-4 w-4 mr-1" /> Campaigns
              </TabsTrigger>
              <TabsTrigger value="templates">
                <FileText className="h-4 w-4 mr-1" /> Templates
              </TabsTrigger>
              <TabsTrigger value="sequences">
                <Workflow className="h-4 w-4 mr-1" /> Sequences
              </TabsTrigger>
              <TabsTrigger value="prospects">
                <Mail className="h-4 w-4 mr-1" /> Prospects
              </TabsTrigger>
              <TabsTrigger value="analytics">
                <BarChart3 className="h-4 w-4 mr-1" /> Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="import" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Paste or import businesses</CardTitle>
                  <CardDescription>
                    Header row required: email, business_name, city, province (tab or comma separated).
                    Emails are validated automatically (syntax, MX, disposable domains).
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    className="min-h-[200px] font-mono text-sm"
                    placeholder={"email\tbusiness_name\tcity\tprovince\nowner@cafe.ca\tMaple Cafe\tToronto\tON"}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                  />
                  <Button onClick={() => void importPaste()}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import &amp; validate
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>New campaign</CardTitle>
                  <CardDescription>
                    Status <strong>running</strong> + ops-dispatcher cron sends emails automatically (no manual per-contact send).
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Campaign name</Label>
                    <Input
                      value={newCampaign.name}
                      onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Sequence</Label>
                    <Select
                      value={newCampaign.sequence_id}
                      onValueChange={(v) => setNewCampaign({ ...newCampaign, sequence_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select sequence" />
                      </SelectTrigger>
                      <SelectContent>
                        {sequences.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Daily send cap</Label>
                    <Input
                      type="number"
                      value={newCampaign.daily_send_cap}
                      onChange={(e) =>
                        setNewCampaign({ ...newCampaign, daily_send_cap: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={() => void createCampaign()}>Create draft campaign</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Active campaigns</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Sequence</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Cap/day</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>{c.marketing_sequences?.name ?? c.sequence_id}</TableCell>
                          <TableCell>
                            <Badge variant={c.status === "running" ? "default" : "secondary"}>{c.status}</Badge>
                          </TableCell>
                          <TableCell>{c.daily_send_cap}</TableCell>
                          <TableCell className="flex gap-2">
                            {c.status !== "running" ? (
                              <Button size="sm" onClick={() => void startCampaign(c.id)}>
                                <Play className="h-3 w-3 mr-1" /> Start auto-send
                              </Button>
                            ) : (
                              <Button size="sm" variant="outline" onClick={() => void pauseCampaign(c.id)}>
                                <Pause className="h-3 w-3 mr-1" /> Pause
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Email template editor</CardTitle>
                  <CardDescription>{VARS_HINT}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>Template key</Label>
                      <Input
                        value={editTemplate.template_key ?? ""}
                        onChange={(e) => setEditTemplate({ ...editTemplate, template_key: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={editTemplate.name ?? ""}
                        onChange={(e) => setEditTemplate({ ...editTemplate, name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Subject</Label>
                    <Input
                      value={editTemplate.subject ?? ""}
                      onChange={(e) => setEditTemplate({ ...editTemplate, subject: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>HTML body</Label>
                    <Textarea
                      className="min-h-[240px] font-mono text-xs"
                      value={editTemplate.html_body ?? ""}
                      onChange={(e) => setEditTemplate({ ...editTemplate, html_body: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => void saveTemplate()}>Save template</Button>
                    <Button variant="outline" onClick={() => void previewTemplate()}>
                      Preview sample
                    </Button>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Load existing</p>
                    <div className="flex flex-wrap gap-2">
                      {templates.map((t) => (
                        <Button
                          key={t.id}
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditTemplate(t)}
                        >
                          {t.template_key}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="sequences" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sequence builder</CardTitle>
                  <CardDescription>
                    Steps run automatically: step 0 sends immediately on enroll; later steps use delay_hours.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      placeholder="sequence_key"
                      value={editSequence.sequence_key}
                      onChange={(e) => setEditSequence({ ...editSequence, sequence_key: e.target.value })}
                    />
                    <Input
                      placeholder="Display name"
                      value={editSequence.name}
                      onChange={(e) => setEditSequence({ ...editSequence, name: e.target.value })}
                    />
                  </div>
                  {editSequence.steps.map((step, i) => (
                    <div key={i} className="flex flex-wrap gap-2 items-end border p-3 rounded-lg">
                      <div>
                        <Label className="text-xs">Step</Label>
                        <Input
                          type="number"
                          className="w-16"
                          value={step.step_index}
                          onChange={(e) => {
                            const steps = [...editSequence.steps];
                            steps[i].step_index = Number(e.target.value);
                            setEditSequence({ ...editSequence, steps });
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Delay (hours)</Label>
                        <Input
                          type="number"
                          className="w-24"
                          value={step.delay_hours}
                          onChange={(e) => {
                            const steps = [...editSequence.steps];
                            steps[i].delay_hours = Number(e.target.value);
                            setEditSequence({ ...editSequence, steps });
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <Label className="text-xs">Template key</Label>
                        <Input
                          value={step.template_key}
                          onChange={(e) => {
                            const steps = [...editSequence.steps];
                            steps[i].template_key = e.target.value;
                            setEditSequence({ ...editSequence, steps });
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() =>
                      setEditSequence({
                        ...editSequence,
                        steps: [
                          ...editSequence.steps,
                          {
                            step_index: editSequence.steps.length,
                            delay_hours: 72,
                            template_key: "deal_partner_followup",
                          },
                        ],
                      })
                    }
                  >
                    Add step
                  </Button>
                  <Button onClick={() => void saveSequence()}>Save sequence</Button>
                  <div className="pt-4">
                    <p className="text-sm font-medium mb-2">Existing sequences</p>
                    {sequences.map((s) => (
                      <div key={s.id} className="text-sm text-muted-foreground mb-2">
                        <strong>{s.name}</strong> ({s.sequence_key}) —{" "}
                        {(s.marketing_sequence_steps ?? []).length} steps
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="prospects">
              <Card>
                <CardHeader>
                  <CardTitle>Prospects ({prospects.length})</CardTitle>
                  <CardDescription>Email validation runs on import. Only valid / role_account enroll when campaign starts.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Business</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Validation</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prospects.slice(0, 100).map((p) => (
                        <TableRow key={p.id}>
                          <TableCell>{p.email}</TableCell>
                          <TableCell>{p.business_name}</TableCell>
                          <TableCell>{p.city}</TableCell>
                          <TableCell>
                            <Badge variant={statusColor(p.email_status)}>{p.email_status}</Badge>
                          </TableCell>
                          <TableCell>{p.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Campaign analytics</CardTitle>
                  <CardDescription>
                    Requires Resend webhook → <code>resend-webhook</code> for open/click rates.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                    <SelectTrigger className="max-w-md">
                      <SelectValue placeholder="All campaigns (global)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All campaigns</SelectItem>
                      {campaigns.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() =>
                      void loadCampaignAnalytics(
                        selectedCampaignId && selectedCampaignId !== "__all__"
                          ? selectedCampaignId
                          : undefined,
                      )
                    }
                  >
                    Refresh metrics
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}
