import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { GrantRecord } from "@/types/grant";
import type { ReadinessResult } from "@/lib/grantIntake";
import {
  countRecentAiDrafts,
  fetchGrantIntakeAnswers,
  getOrCreateGrantIntake,
  MAX_DRAFTS_PER_HOUR,
  type GrantIntakeRow,
} from "@/services/grantIntake";
import {
  analyzeGrantIntakeReadiness,
  generateGrantIntakeDraft,
  listGrantIntakeMissing,
} from "@/services/grantIntakeAssistant";
import {
  AlertCircle,
  BadgeCheck,
  FileText,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react";

const DRAFT_LABELS: Record<string, string> = {
  project_summary: "Project summary",
  use_of_funds: "Use of funds",
  business_description: "Business description",
  objectives: "Objectives",
  budget_notes: "Budget notes",
};

type Props = {
  grant: GrantRecord;
};

export default function GrantIntakeHub({ grant }: Props) {
  const [intake, setIntake] = useState<GrantIntakeRow | null>(null);
  const [readiness, setReadiness] = useState<ReadinessResult | null>(null);
  const [missingFields, setMissingFields] = useState<{ key: string; label: string }[]>([]);
  const [missingDocs, setMissingDocs] = useState<{ key: string; label: string }[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [draftsUsed, setDraftsUsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [draftingKey, setDraftingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authRequired, setAuthRequired] = useState(false);

  const refreshMissing = useCallback(async (intakeId: string) => {
    const { result, error: missError } = await listGrantIntakeMissing(intakeId, grant.id);
    if (missError) {
      setError(missError);
      return;
    }
    setMissingFields(result?.missing_fields ?? []);
    setMissingDocs(result?.missing_documents ?? []);
  }, [grant.id]);

  const runReadiness = useCallback(async (intakeId: string) => {
    setLoading(true);
    setError(null);
    const { result, error: analyzeError } = await analyzeGrantIntakeReadiness(intakeId, grant.id);
    setLoading(false);
    if (analyzeError) {
      setError(analyzeError);
      return;
    }
    if (result) {
      setReadiness({
        score: result.score,
        status: result.status,
        details: result.details,
      });
      setIntake((prev) =>
        prev
          ? {
              ...prev,
              readiness_score: result.score,
              readiness_status: result.status,
            }
          : prev,
      );
    }
    await refreshMissing(intakeId);
    setDraftsUsed(await countRecentAiDrafts(intakeId));
  }, [grant.id, refreshMissing]);

  const startIntake = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { intake: row, error: intakeError } = await getOrCreateGrantIntake(grant.id);
    if (intakeError) {
      setLoading(false);
      if (intakeError.includes("Sign in")) setAuthRequired(true);
      else setError(intakeError);
      return;
    }
    if (!row) {
      setLoading(false);
      setError("Could not start intake.");
      return;
    }
    setIntake(row);
    setAuthRequired(false);

    const { answers } = await fetchGrantIntakeAnswers(row.id);
    const loaded: Record<string, string> = {};
    for (const [key, value] of Object.entries(answers)) {
      if (value) loaded[key] = value;
    }
    setDrafts(loaded);

    await runReadiness(row.id);
  }, [grant.id, runReadiness]);

  useEffect(() => {
    void startIntake();
  }, [startIntake]);

  const handleGenerateDraft = async (fieldKey: string) => {
    if (!intake) return;
    if (draftsUsed >= MAX_DRAFTS_PER_HOUR) {
      setError(`Draft limit reached (${MAX_DRAFTS_PER_HOUR}/hour). Edit manually or try again later.`);
      return;
    }
    setDraftingKey(fieldKey);
    setError(null);
    const { result, error: draftError } = await generateGrantIntakeDraft(intake.id, fieldKey, grant.id);
    setDraftingKey(null);
    if (draftError) {
      setError(draftError);
      return;
    }
    if (result?.draft) {
      setDrafts((prev) => ({ ...prev, [fieldKey]: result.draft }));
      setDraftsUsed(await countRecentAiDrafts(intake.id));
    }
  };

  if (grant.rtm_processing_eligible === false) return null;

  if (authRequired) {
    return (
      <Card className="p-6">
        <h2 className="font-semibold mb-2 flex items-center gap-2">
          <BadgeCheck className="w-4 h-4" />
          Prepare with RTM
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Sign in to run Application Assistant readiness checks and generate narrative drafts for this program.
        </p>
        <Button asChild>
          <Link to="/auth">Sign in to continue</Link>
        </Button>
      </Card>
    );
  }

  const score = readiness?.score ?? intake?.readiness_score ?? 0;
  const draftsRemaining = Math.max(0, MAX_DRAFTS_PER_HOUR - draftsUsed);

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="font-semibold flex items-center gap-2">
            <BadgeCheck className="w-4 h-4" />
            Application Assistant
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Readiness analysis and AI narrative drafts — review before advisor submission.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => intake && runReadiness(intake.id)} disabled={loading || !intake}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Re-check readiness
        </Button>
      </div>

      {error && (
        <div className="mb-4 flex gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">Readiness score</span>
          <span className="font-semibold">{score}/100</span>
        </div>
        <Progress value={score} className="h-2" />
        {readiness?.status && (
          <Badge variant="secondary" className="mt-2 capitalize">
            {readiness.status.replace(/_/g, " ")}
          </Badge>
        )}
      </div>

      {(missingFields.length > 0 || missingDocs.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          {missingFields.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Missing information
              </p>
              <ul className="space-y-1 text-sm">
                {missingFields.slice(0, 6).map((f) => (
                  <li key={f.key} className="text-muted-foreground">• {f.label}</li>
                ))}
              </ul>
            </div>
          )}
          {missingDocs.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Missing documents
              </p>
              <ul className="space-y-1 text-sm">
                {missingDocs.slice(0, 6).map((d) => (
                  <li key={d.key} className="flex gap-2 text-muted-foreground">
                    <FileText className="w-3 h-3 mt-1 shrink-0" />
                    {d.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium">Narrative drafts</p>
          <span className="text-xs text-muted-foreground">
            {draftsRemaining} AI draft{draftsRemaining !== 1 ? "s" : ""} remaining this hour
          </span>
        </div>
        <div className="space-y-3">
          {Object.keys(DRAFT_LABELS).map((fieldKey) => (
            <div key={fieldKey} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-medium">{DRAFT_LABELS[fieldKey]}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!!draftingKey || loading || !intake}
                  onClick={() => handleGenerateDraft(fieldKey)}
                >
                  {draftingKey === fieldKey ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-1" />
                      Generate
                    </>
                  )}
                </Button>
              </div>
              {drafts[fieldKey] ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">{drafts[fieldKey]}</p>
              ) : (
                <p className="text-xs text-muted-foreground italic">No draft yet</p>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Review and edit all drafts before submitting. RTM does not submit applications on your behalf.
        </p>
      </div>
    </Card>
  );
}
