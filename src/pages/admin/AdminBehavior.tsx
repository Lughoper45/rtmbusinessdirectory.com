import { useEffect, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MousePointerClick, Route, Users, Zap, TrendingDown, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type PageFunnelRow = {
  page_path: string;
  visits: number;
  unique_sessions: number;
  avg_seconds: number;
};

type BuilderDropoffRow = {
  step: number;
  sessions_reached: number;
  sessions_advanced: number;
  drop_rate: number;
};

type SessionRow = {
  session_id: string;
  current_page: string | null;
  confusion_score: number | null;
  profile_builder_step: number | null;
  profile_completion_pct: number | null;
  membership_status: string | null;
  last_active_at: string;
};

type TriggerRow = {
  rule_id: string;
  fires: number;
  unique_sessions: number;
};

type GrantViewRow = {
  grant_id: string;
  grant_name: string;
  views: number;
  avg_match_score: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtSecs(s: number): string {
  if (!s) return "—";
  if (s < 60) return `${Math.round(s)}s`;
  return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
}

function confusionColor(score: number | null): string {
  if (!score) return "bg-muted text-muted-foreground";
  if (score >= 70) return "bg-red-100 text-red-700";
  if (score >= 40) return "bg-yellow-100 text-yellow-700";
  return "bg-green-100 text-green-700";
}

function ProgressBar({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-border overflow-hidden">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminBehavior() {
  const [loading, setLoading] = useState(true);
  const [funnel, setFunnel] = useState<PageFunnelRow[]>([]);
  const [dropoff, setDropoff] = useState<BuilderDropoffRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [triggers, setTriggers] = useState<TriggerRow[]>([]);
  const [grantViews, setGrantViews] = useState<GrantViewRow[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);
  const [highConfusion, setHighConfusion] = useState(0);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Page funnel
        const { data: funnelData } = await supabase
          .from("behavior_page_funnel" as never)
          .select("*")
          .order("visits", { ascending: false })
          .limit(20);
        setFunnel((funnelData ?? []) as PageFunnelRow[]);

        // Builder drop-off
        const { data: dropData } = await supabase
          .from("behavior_builder_dropoff" as never)
          .select("*")
          .order("step", { ascending: true });
        setDropoff((dropData ?? []) as BuilderDropoffRow[]);

        // Recent sessions (last 50, ordered by activity)
        const { data: sessionData, count } = await supabase
          .from("user_sessions")
          .select("session_id, current_page, confusion_score, profile_builder_step, profile_completion_pct, membership_status, last_active_at", { count: "exact" })
          .order("last_active_at", { ascending: false })
          .limit(50);
        setSessions((sessionData ?? []) as SessionRow[]);
        setTotalSessions(count ?? 0);
        setHighConfusion(((sessionData ?? []) as SessionRow[]).filter((s) => (s.confusion_score ?? 0) >= 40).length);

        // Trigger fire counts
        const { data: triggerData } = await supabase
          .from("trigger_fires")
          .select("rule_id")
          .limit(1000);
        if (triggerData) {
          const counts: Record<string, number> = {};
          for (const row of triggerData as { rule_id: string }[]) {
            counts[row.rule_id] = (counts[row.rule_id] ?? 0) + 1;
          }
          setTriggers(
            Object.entries(counts)
              .map(([rule_id, fires]) => ({ rule_id, fires, unique_sessions: fires }))
              .sort((a, b) => b.fires - a.fires),
          );
        }

        // Top viewed grants from behavior events
        const { data: grantEvents } = await supabase
          .from("user_behavior_events")
          .select("metadata")
          .eq("event_type", "grant_viewed")
          .limit(500);
        if (grantEvents) {
          const grantMap: Record<string, { name: string; views: number; scoreSum: number }> = {};
          for (const row of grantEvents as { metadata: Record<string, unknown> }[]) {
            const id = String(row.metadata?.grant_id ?? "");
            const name = String(row.metadata?.grant_name ?? id);
            const score = Number(row.metadata?.match_score ?? 0);
            if (!id) continue;
            if (!grantMap[id]) grantMap[id] = { name, views: 0, scoreSum: 0 };
            grantMap[id].views += 1;
            grantMap[id].scoreSum += score;
          }
          setGrantViews(
            Object.entries(grantMap)
              .map(([grant_id, v]) => ({
                grant_id,
                grant_name: v.name,
                views: v.views,
                avg_match_score: v.views > 0 ? Math.round(v.scoreSum / v.views) : 0,
              }))
              .sort((a, b) => b.views - a.views)
              .slice(0, 10),
          );
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  const maxVisits = Math.max(...funnel.map((r) => r.visits), 1);
  const maxBuilderReached = dropoff[0]?.sessions_reached ?? 1;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">User Behavior</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Navigation patterns, drop-off points, and proactive trigger performance.
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total sessions", value: totalSessions, icon: Users },
            { label: "High confusion (≥40)", value: highConfusion, icon: TrendingDown },
            { label: "Trigger fires", value: triggers.reduce((s, t) => s + t.fires, 0), icon: Zap },
            { label: "Grant views", value: grantViews.reduce((s, g) => s + g.views, 0), icon: MousePointerClick },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="pt-6">
                <Icon className="w-4 h-4 text-muted-foreground mb-2" />
                <p className="text-2xl font-bold">{value.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Page funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="w-4 h-4" /> Page funnel
              </CardTitle>
              <CardDescription>Most visited pages · avg time on page</CardDescription>
            </CardHeader>
            <CardContent>
              {funnel.length === 0 ? (
                <p className="text-sm text-muted-foreground">No data yet.</p>
              ) : (
                <div className="space-y-3">
                  {funnel.map((row) => (
                    <div key={row.page_path}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-mono truncate max-w-[200px]">{row.page_path || "/"}</span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                          <span>{row.visits} visits</span>
                          <span>{fmtSecs(row.avg_seconds)}</span>
                        </div>
                      </div>
                      <ProgressBar value={row.visits} max={maxVisits} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile builder drop-off */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4" /> Grant profile builder drop-off
              </CardTitle>
              <CardDescription>How far users get through the 6 questions</CardDescription>
            </CardHeader>
            <CardContent>
              {dropoff.length === 0 ? (
                <p className="text-sm text-muted-foreground">No builder sessions tracked yet.</p>
              ) : (
                <div className="space-y-3">
                  {dropoff.map((row) => {
                    const dropPct = row.drop_rate ?? 0;
                    const barColor = dropPct > 40 ? "bg-red-500" : dropPct > 20 ? "bg-yellow-500" : "bg-primary";
                    return (
                      <div key={row.step}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm">Q{row.step}</span>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{row.sessions_reached} reached</span>
                            {dropPct > 0 && (
                              <Badge variant="outline" className={dropPct > 40 ? "border-red-300 text-red-600" : ""}>
                                {dropPct.toFixed(0)}% dropped
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ProgressBar value={row.sessions_reached} max={maxBuilderReached} color={barColor} />
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top viewed grants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MousePointerClick className="w-4 h-4" /> Top grant pages viewed
              </CardTitle>
              <CardDescription>Which grants attract the most attention</CardDescription>
            </CardHeader>
            <CardContent>
              {grantViews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No grant views tracked yet.</p>
              ) : (
                <div className="space-y-2">
                  {grantViews.map((g, i) => (
                    <div key={g.grant_id} className="flex items-center justify-between py-2 border-b border-border/40 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                        <span className="text-sm font-medium truncate max-w-[200px]">{g.grant_name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                        <span>{g.views} views</span>
                        {g.avg_match_score > 0 && <span>{g.avg_match_score}% avg match</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trigger fire rates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-4 h-4" /> Proactive trigger fires
              </CardTitle>
              <CardDescription>Which bot triggers fire most often</CardDescription>
            </CardHeader>
            <CardContent>
              {triggers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No triggers fired yet.</p>
              ) : (
                <div className="space-y-2">
                  {triggers.map((t) => (
                    <div key={t.rule_id} className="flex items-center justify-between py-1.5">
                      <span className="text-sm font-mono">{t.rule_id}</span>
                      <Badge variant="secondary">{t.fires}×</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-4 h-4" /> Recent sessions
            </CardTitle>
            <CardDescription>Last 50 active sessions · confusion score highlights stuck users</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">Session</th>
                  <th className="pb-2 pr-4">Current page</th>
                  <th className="pb-2 pr-4">Membership</th>
                  <th className="pb-2 pr-4">Profile</th>
                  <th className="pb-2 pr-4">Builder step</th>
                  <th className="pb-2">Confusion</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s.session_id} className="border-b border-border/40 last:border-0">
                    <td className="py-2 pr-4 font-mono text-xs text-muted-foreground">{s.session_id.slice(0, 8)}…</td>
                    <td className="py-2 pr-4 font-mono text-xs truncate max-w-[180px]">{s.current_page ?? "—"}</td>
                    <td className="py-2 pr-4">
                      <Badge variant="outline" className="text-xs">{s.membership_status ?? "—"}</Badge>
                    </td>
                    <td className="py-2 pr-4 text-xs">{s.profile_completion_pct != null ? `${s.profile_completion_pct}%` : "—"}</td>
                    <td className="py-2 pr-4 text-xs">{s.profile_builder_step != null ? `Q${s.profile_builder_step}` : "—"}</td>
                    <td className="py-2">
                      {s.confusion_score != null ? (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${confusionColor(s.confusion_score)}`}>
                          {s.confusion_score}
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
