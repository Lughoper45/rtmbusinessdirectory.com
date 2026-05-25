import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Circle, Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import GrowNavbar from "@/components/grow/GrowNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchMyGrowthEngagements,
  type GrowthEngagement,
} from "@/services/growthEngagements";
import { getGrowthPackageById, formatGrowthPrice } from "@/lib/growthPackages";
import { getGrantsPortalUrl } from "@/lib/site";

export default function GrowthWorkspace() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [engagements, setEngagements] = useState<GrowthEngagement[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEngagements(await fetchMyGrowthEngagements());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load workspace");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = `/auth?returnUrl=${encodeURIComponent("/workspace")}`;
        return;
      }
      await load();
    })();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Subscription active — your delivery plan is ready below.");
    }
  }, [searchParams]);

  const active = engagements.filter((e) => e.status === "active" || e.status === "pending_payment");

  return (
    <>
      <Helmet>
        <title>My Growth Workspace | RTM Growth Services</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <GrowNavbar />
        <main className="container mx-auto max-w-4xl px-6 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-[#cc0000]" />
              Growth workspace
            </h1>
            <p className="mt-2 text-muted-foreground">
              Track your RTM package delivery, milestones, and advisor progress.
            </p>
          </div>

          {loading ? (
            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
          ) : active.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No active engagements yet</CardTitle>
                <CardDescription>
                  Start with a free growth audit or choose a package to begin delivery.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button className="bg-[#cc0000] hover:bg-[#b30000]" asChild>
                  <Link to="/#growth-audit-cta">Free growth audit</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/packages">View packages</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {active.map((eng) => {
                const pkg = getGrowthPackageById(eng.package_id as Parameters<typeof getGrowthPackageById>[0]);
                const milestones = eng.milestones ?? [];
                const done = milestones.filter((m) => m.status === "done").length;
                const pct = milestones.length ? Math.round((done / milestones.length) * 100) : 0;

                return (
                  <Card key={eng.id}>
                    <CardHeader>
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <CardTitle>{pkg?.name ?? eng.package_id}</CardTitle>
                          <CardDescription>
                            {eng.business_name ?? "Your business"} ·{" "}
                            <Badge variant={eng.status === "active" ? "default" : "secondary"}>
                              {eng.status.replace("_", " ")}
                            </Badge>
                          </CardDescription>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          {done}/{milestones.length} milestones
                        </div>
                      </div>
                      <Progress value={pct} className="mt-4 h-2" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {milestones.map((m) => (
                        <div
                          key={m.id}
                          className="flex gap-3 rounded-lg border p-3 text-sm"
                        >
                          {m.status === "done" ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                          ) : (
                            <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-medium">{m.title}</p>
                            {m.description && (
                              <p className="text-muted-foreground mt-0.5">{m.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                      {eng.status === "active" && pkg?.id === "growth-os" && (
                        <Button variant="outline" size="sm" asChild className="mt-2">
                          <a href={getGrantsPortalUrl("/grants")}>
                            Explore grants that may fund digital spend →
                          </a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {engagements.length > 0 && (
            <p className="mt-8 text-center text-xs text-muted-foreground">
              Questions? Email info@rtmbusinessdirectory.com — an RTM growth advisor will respond within two
              business days.
            </p>
          )}
        </main>
      </div>
    </>
  );
}
