import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  BadgeCheck,
  Clock,
  ExternalLink,
  Filter,
  RefreshCw,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  fetchActiveGrants,
  fetchGrantCatalog,
  formatGrantFunding,
  getAdvisorContactMailto,
  grantDetailPath,
  type GrantCatalogFilters,
} from "@/lib/grants";
import { GrantCompatibilityScore } from "@/components/grantpilot/GrantCompatibilityScore";
import { loadGrantProfile } from "@/lib/grantProfile";
import type { GrantRecord, ScoredGrant } from "@/types/grant";

type SelectOption = {
  label: string;
  value: string;
};

interface GrantCatalogProps {
  showMatchScores?: boolean;
}

function uniqueOptions(grants: GrantRecord[], getter: (grant: GrantRecord) => string | string[] | null | undefined) {
  const values = new Set<string>();
  grants.forEach((grant) => {
    const value = getter(grant);
    if (Array.isArray(value)) value.forEach((item) => item && values.add(item));
    else if (value) values.add(value);
  });
  return [...values].sort((a, b) => a.localeCompare(b));
}

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-1 text-xs font-medium text-muted-foreground">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const GrantCatalog = ({ showMatchScores = false }: GrantCatalogProps) => {
  const [allGrants, setAllGrants] = useState<GrantRecord[]>([]);
  const [grants, setGrants] = useState<ScoredGrant[]>([]);
  const [filters, setFilters] = useState<GrantCatalogFilters>({
    search: "",
    province: "all",
    level: "all",
    category: "all",
    sector: "all",
    difficulty: "all",
    intakeOpen: "all",
    processing: "all",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const profile = loadGrantProfile();
      const [active, filtered] = await Promise.all([
        fetchActiveGrants(),
        fetchGrantCatalog(profile, filters),
      ]);
      setAllGrants(active);
      setGrants(filtered);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load grants");
      setAllGrants([]);
      setGrants([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const options = useMemo(() => {
    const provinceOptions = uniqueOptions(allGrants, (g) => g.provinces).map((value) => ({ value, label: value }));
    const levelOptions = uniqueOptions(allGrants, (g) => g.level ?? g.type).map((value) => ({ value, label: value }));
    const categoryOptions = uniqueOptions(allGrants, (g) => g.category).map((value) => ({ value, label: value }));
    const sectorOptions = uniqueOptions(allGrants, (g) => g.sectors).map((value) => ({ value, label: value }));
    const difficultyOptions = uniqueOptions(allGrants, (g) => g.difficulty).map((value) => ({
      value,
      label: value.charAt(0).toUpperCase() + value.slice(1),
    }));

    return {
      province: [{ value: "all", label: "All provinces" }, ...provinceOptions],
      level: [{ value: "all", label: "All levels" }, ...levelOptions],
      category: [{ value: "all", label: "All categories" }, ...categoryOptions],
      sector: [{ value: "all", label: "All sectors" }, ...sectorOptions],
      difficulty: [{ value: "all", label: "All difficulty" }, ...difficultyOptions],
    };
  }, [allGrants]);

  const updateFilter = (key: keyof GrantCatalogFilters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      search: "",
      province: "all",
      level: "all",
      category: "all",
      sector: "all",
      difficulty: "all",
      intakeOpen: "all",
      processing: "all",
    });
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-orbitron text-2xl font-bold text-foreground">Canadian grant catalog</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Search programs sourced from official listings. Compatibility scores are RTM estimates — not government determinations.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-sm text-primary">
          <Filter className="h-4 w-4" />
          {loading ? "Loading..." : `${grants.length} of ${allGrants.length} active programs`}
        </div>
      </div>

      <div className="rounded-2xl border border-border/50 bg-background/80 p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(220px,1.3fr)_repeat(4,minmax(130px,1fr))]">
          <label className="space-y-1 text-xs font-medium text-muted-foreground">
            <span>Search</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={filters.search ?? ""}
                onChange={(event) => updateFilter("search", event.target.value)}
                placeholder="Program, sector, tag, organization"
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
              />
            </div>
          </label>
          <SelectFilter label="Province" value={filters.province ?? "all"} options={options.province} onChange={(v) => updateFilter("province", v)} />
          <SelectFilter label="Level" value={filters.level ?? "all"} options={options.level} onChange={(v) => updateFilter("level", v)} />
          <SelectFilter label="Category" value={filters.category ?? "all"} options={options.category} onChange={(v) => updateFilter("category", v)} />
          <SelectFilter label="Sector" value={filters.sector ?? "all"} options={options.sector} onChange={(v) => updateFilter("sector", v)} />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <SelectFilter label="Difficulty" value={filters.difficulty ?? "all"} options={options.difficulty} onChange={(v) => updateFilter("difficulty", v)} />
          <SelectFilter
            label="Intake"
            value={filters.intakeOpen ?? "all"}
            options={[
              { value: "all", label: "All intake status" },
              { value: "open", label: "Open intake" },
              { value: "closed", label: "Closed intake" },
            ]}
            onChange={(v) => updateFilter("intakeOpen", v)}
          />
          <SelectFilter
            label="Processing"
            value={filters.processing ?? "all"}
            options={[
              { value: "all", label: "All programs" },
              { value: "rtm", label: "RTM processing eligible" },
              { value: "self", label: "Self-serve guidance" },
            ]}
            onChange={(v) => updateFilter("processing", v)}
          />
        </div>
        <button
          type="button"
          onClick={resetFilters}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Reset filters
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Grant catalog could not be loaded</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
            <button type="button" onClick={load} className="inline-flex items-center gap-2 text-sm text-primary">
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      )}

      {!error && loading && <p className="text-sm text-muted-foreground">Loading grant catalog...</p>}

      {!error && !loading && grants.length === 0 && (
        <div className="rounded-2xl border border-border/60 bg-secondary/30 p-8 text-center">
          <p className="font-medium text-foreground">No grants match these filters.</p>
          <button type="button" onClick={resetFilters} className="mt-3 text-sm font-medium text-primary">
            Clear filters
          </button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {grants.map((grant) => (
          <article key={grant.id} className="flex min-h-[360px] flex-col rounded-2xl border border-border bg-background p-5 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {grant.level ?? grant.type ?? "Program"}
              </span>
              <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs text-muted-foreground">
                {grant.category ?? grant.funding_type ?? "Grant"}
              </span>
              {grant.rtm_processing_eligible === false ? (
                <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  Self-serve
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-medium text-success">
                  <BadgeCheck className="h-3 w-3" />
                  RTM eligible
                </span>
              )}
            </div>

            <h3 className="line-clamp-2 text-base font-semibold text-foreground">{grant.name}</h3>
            <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{grant.organization}</p>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Funding</p>
                <p className="font-semibold text-foreground">{formatGrantFunding(grant)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">RTM compatibility</p>
                {showMatchScores ? (
                  <GrantCompatibilityScore score={grant.computedMatch} />
                ) : (
                  <p className="font-semibold text-foreground">{grant.difficulty ?? "Review"}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Coverage</p>
                <p className="line-clamp-1 font-medium text-foreground">{(grant.provinces ?? []).join(", ") || "Canada"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Intake</p>
                <p className="inline-flex items-center gap-1 font-medium text-foreground">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  {grant.intake_open === false ? "Closed" : grant.deadline_type ?? "Open"}
                </p>
              </div>
            </div>

            <p className="mt-4 line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">{grant.description}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {(grant.sectors ?? []).slice(0, 3).map((sector) => (
                <span key={sector} className="rounded-md bg-secondary px-2 py-1 text-xs text-muted-foreground">
                  {sector}
                </span>
              ))}
            </div>

            <div className="mt-5 flex flex-col gap-2">
              {grant.official_url ? (
                <a
                  href={grant.official_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  View official program guide
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <a
                  href={getAdvisorContactMailto(grant.name)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Contact RTM advisor
                </a>
              )}
              <Link
                to={grantDetailPath(grant.id)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/50
"
              >
                Prepare with RTM
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default GrantCatalog;
