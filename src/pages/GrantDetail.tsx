import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchGrantById, formatGrantFunding, grantDetailPath, scoreGrantForProfile } from "@/lib/grants";
import { loadGrantProfile } from "@/lib/grantProfile";
import { SITE_CONTACT } from "@/lib/site";
import type { ScoredGrant } from "@/types/grant";
import GrantIntakeHub from "@/components/grantpilot/GrantIntakeHub";
import GrantAdvisoryDisclaimer from "@/components/grantpilot/GrantAdvisoryDisclaimer";
import { GrantCompatibilityScore } from "@/components/grantpilot/GrantCompatibilityScore";
import {
  Building2,
  BadgeCheck,
  ChevronLeft,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  Info,
  ListChecks,
  MapPin,
  Sparkles,
  Target,
} from "lucide-react";

export default function GrantDetail() {
  const { id } = useParams();
  const [grant, setGrant] = useState<ScoredGrant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const row = await fetchGrantById(id);
        if (row) setGrant(scoreGrantForProfile(row, loadGrantProfile()));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not load grant");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const applyHref = grant?.official_url
    ?? (grant
      ? `mailto:${SITE_CONTACT.email}?subject=${encodeURIComponent(`Grant application – ${grant.name}`)}`
      : null);

  return (
    <>
      <Helmet>
        <title>{grant ? `${grant.name} — RTM Grant Advisory` : "Grant | RTM Business Directory"}</title>
        <meta
          name="description"
          content={
            grant
              ? `${grant.name} — ${grant.organization}. Funding: ${formatGrantFunding(grant)}. RTM private grant advisory — not a government agency.`
              : "Canadian grant program details from RTM Business Directory."
          }
        />
        {grant && <link rel="canonical" href={`https://rtmbusinessdirectory.com/grants/${grant.id}`} />}
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 pt-24 pb-16 max-w-5xl">
          <Link to="/grants" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back to grants
          </Link>

          {loading && <p className="text-muted-foreground">Loading…</p>}
          {error && <p className="text-destructive">{error}</p>}

          {!loading && !error && !grant && (
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold">Grant not found</h1>
              <Link to="/grants" className="text-primary mt-2 inline-block">Browse grants</Link>
            </div>
          )}

          {grant && (
            <>
              <GrantAdvisoryDisclaimer variant="full" className="mb-6" />

              <div className="rounded-2xl border bg-gradient-to-br from-primary/5 p-6 md:p-8 mb-8">
                <Badge className="mb-2">{grant.type}</Badge>
                <h1 className="text-3xl font-bold mb-2">{grant.name}</h1>
                <p className="text-muted-foreground flex items-center gap-2 mb-4">
                  <Building2 className="w-4 h-4" />
                  {grant.organization}
                </p>
                {applyHref ? (
                  <Button asChild>
                    <a href={applyHref} target={grant.official_url ? "_blank" : undefined} rel={grant.official_url ? "noopener noreferrer" : undefined}>
                      {grant.official_url ? "View official program guide" : "Contact RTM advisor"}
                    </a>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link to="/grants">Browse grants</Link>
                  </Button>
                )}
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="p-4">
                  <DollarSign className="w-5 h-5 text-green-600 mb-2" />
                  <p className="text-xs text-muted-foreground">Funding</p>
                  <p className="font-semibold">{formatGrantFunding(grant)}</p>
                </Card>
                <Card className="p-4">
                  <Sparkles className="w-5 h-5 text-primary mb-2" />
                  <p className="text-xs text-muted-foreground">RTM compatibility estimate</p>
                  <GrantCompatibilityScore score={grant.computedMatch} />
                </Card>
                <Card className="p-4">
                  <Clock className="w-5 h-5 text-amber-600 mb-2" />
                  <p className="text-xs text-muted-foreground">Timeline</p>
                  <p className="font-semibold text-sm">{grant.deadline_label || `${grant.deadline_days} days`}</p>
                </Card>
                <Card className="p-4">
                  <Target className="w-5 h-5 text-primary mb-2" />
                  <p className="text-xs text-muted-foreground">Difficulty</p>
                  <p className="font-semibold">{grant.difficulty || "Medium"}</p>
                </Card>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {grant.rtm_processing_eligible !== false && (
                    <GrantIntakeHub grant={grant} />
                  )}
                  {grant.description && (
                    <Card className="p-6">
                      <h2 className="font-semibold mb-3">About this program</h2>
                      <p className="text-muted-foreground leading-relaxed">{grant.description}</p>
                    </Card>
                  )}
                  <Card className="p-6">
                    <h2 className="font-semibold mb-3 flex items-center gap-2">
                      <BadgeCheck className="w-4 h-4" />
                      RTM intake readiness
                    </h2>
                    {grant.rtm_processing_eligible === false ? (
                      <p className="text-sm text-muted-foreground">
                        This program is best handled as self-serve guidance unless an RTM advisor confirms fit.
                        Use the official page and checklist to prepare your documents.
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        RTM can process this program through the intake hub. The assistant uses the fields and
                        documents below to identify missing information before advisor review.
                      </p>
                    )}
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Required information
                        </p>
                        <ul className="space-y-2">
                          {(grant.required_fields ?? []).slice(0, 8).map((field) => (
                            <li key={field.key} className="flex gap-2 text-sm">
                              <span className={field.required === false ? "text-muted-foreground" : "text-primary"}>
                                {field.required === false ? "-" : "*"}
                              </span>
                              <span>{field.label}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Documents
                        </p>
                        <ul className="space-y-2">
                          {(grant.required_documents ?? []).slice(0, 8).map((doc) => (
                            <li key={doc.key} className="flex gap-2 text-sm">
                              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                              <span>{doc.label}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                  {grant.eligibility_summary && (
                    <Card className="p-6">
                      <h2 className="font-semibold mb-3 flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        Eligibility
                      </h2>
                      <p className="text-muted-foreground">{grant.eligibility_summary}</p>
                    </Card>
                  )}
                  <Card className="p-6">
                    <h2 className="font-semibold mb-3">Requirements</h2>
                    <ul className="space-y-2">
                      {(grant.requirements || []).map((r) => (
                        <li key={r} className="text-sm flex gap-2">
                          <span className="text-green-600">✓</span>
                          {r}
                        </li>
                      ))}
                    </ul>
                  </Card>
                  {(grant.application_steps?.length ?? 0) > 0 && (
                    <Card className="p-6">
                      <h2 className="font-semibold mb-3 flex items-center gap-2">
                        <ListChecks className="w-4 h-4" />
                        How to apply
                      </h2>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                        {grant.application_steps!.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    </Card>
                  )}
                </div>

                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Coverage
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(grant.provinces || []).map((p) => (
                        <Badge key={p} variant="secondary">{p}</Badge>
                      ))}
                    </div>
                  </Card>
                  <Card className="p-6">
                    <h3 className="font-semibold mb-3">Program metadata</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Category</dt>
                        <dd className="text-right font-medium">{grant.category ?? "General"}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Funding type</dt>
                        <dd className="text-right font-medium">{grant.funding_type ?? "grant"}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Intake</dt>
                        <dd className="text-right font-medium">{grant.intake_open === false ? "Closed" : "Open"}</dd>
                      </div>
                      <div className="flex justify-between gap-4">
                        <dt className="text-muted-foreground">Estimated prep</dt>
                        <dd className="text-right font-medium">
                          {grant.application_hours_estimate ? `${grant.application_hours_estimate} hours` : "Review"}
                        </dd>
                      </div>
                    </dl>
                  </Card>
                  {grant.funding_notes && (
                    <Card className="p-6 border-amber-200 bg-amber-50">
                      <p className="text-sm font-medium mb-1">Important</p>
                      <p className="text-sm text-muted-foreground">{grant.funding_notes}</p>
                    </Card>
                  )}
                  {grant.official_url && (
                    <Card className="p-6">
                      <p className="text-sm text-muted-foreground mb-2">Official reference:</p>
                      <a
                        href={grant.official_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary inline-flex items-center gap-1"
                      >
                        Government program page
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </Card>
                  )}
                  <Card className="p-6 bg-primary/5">
                    <p className="font-medium mb-2">Ready to apply?</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Complete your application on GrantPilot with your RTM membership.
                    </p>
                    {applyHref ? (
                      <Button asChild className="w-full">
                        <a
                          href={applyHref}
                          target={grant.official_url ? "_blank" : undefined}
                          rel={grant.official_url ? "noopener noreferrer" : undefined}
                        >
                          {grant.rtm_processing_eligible === false ? "Open official guidance" : "Review official program"}
                        </a>
                      </Button>
                    ) : (
                      <Button asChild className="w-full">
                        <Link to={grantDetailPath(grant.id)}>View program details</Link>
                      </Button>
                    )}
                  </Card>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
}
