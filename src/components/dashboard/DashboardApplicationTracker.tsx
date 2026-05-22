import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, RefreshCw, Plus, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyGrantApplications } from "@/lib/stellarApi";
import { fetchGrantById, formatGrantAmount, grantDetailPath } from "@/lib/grants";

type Row = {
  id: string;
  itemId: string;
  name: string;
  organization: string;
  amount: number;
  status: string;
  progress: number;
  submittedDate: string;
};

function progressForStatus(status: string): number {
  const s = status.toLowerCase();
  if (s.includes("approve") || s.includes("reject")) return 100;
  if (s.includes("review")) return 65;
  return 30;
}

export function DashboardApplicationTracker() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setRows([]);
        return;
      }

      const apps = await fetchMyGrantApplications(session.access_token);
      const enriched = await Promise.all(
        apps.map(async (app) => {
          const grant = await fetchGrantById(app.item_id);
          return {
            id: app.id,
            itemId: app.item_id,
            name: grant?.name ?? app.item_id,
            organization: grant?.organization ?? "Canadian program",
            amount: Number(grant?.amount ?? 0),
            status: app.status,
            progress: progressForStatus(app.status),
            submittedDate: app.created_at,
          };
        }),
      );
      setRows(enriched);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load applications");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-primary" />
            Grant applications
          </CardTitle>
          <CardDescription>Applications you started through RTM GrantPilot</CardDescription>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button size="sm" asChild>
            <Link to="/grants">
              <Plus className="w-4 h-4 mr-1" />
              New
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-sm text-muted-foreground">Loading applications…</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!loading && !error && rows.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">No grant applications yet.</p>
            <Button asChild size="sm">
              <Link to="/grants">Explore grants</Link>
            </Button>
          </div>
        )}
        <div className="space-y-3">
          {rows.map((row) => (
            <div
              key={row.id}
              className="rounded-lg border p-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                <div>
                  <Link to={grantDetailPath(row.itemId)} className="font-medium hover:text-primary">
                    {row.name}
                  </Link>
                  <p className="text-xs text-muted-foreground">{row.organization}</p>
                </div>
                <div className="flex items-center gap-2">
                  {row.amount > 0 && (
                    <span className="text-sm font-medium">{formatGrantAmount(row.amount)}</span>
                  )}
                  <Badge variant="outline" className="capitalize">
                    {row.status.replace(/_/g, " ")}
                  </Badge>
                </div>
              </div>
              <Progress value={row.progress} className="h-1.5 mb-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(row.submittedDate).toLocaleDateString()}
                </span>
                <Link
                  to={grantDetailPath(row.itemId)}
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  View grant
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
