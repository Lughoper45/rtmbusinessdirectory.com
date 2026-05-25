import { Info } from 'lucide-react';
import { COMPATIBILITY_TOOLTIP, formatCompatibilityPercent } from '@/lib/grants';

type GrantCompatibilityScoreProps = {
  score: number;
  className?: string;
};

/** Displays RTM compatibility estimate with required tooltip (not eligibility determination). */
export function GrantCompatibilityScore({ score, className = '' }: GrantCompatibilityScoreProps) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} title={COMPATIBILITY_TOOLTIP}>
      <span className="font-semibold text-foreground">{formatCompatibilityPercent(score)}</span>
      <Info className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      <span className="sr-only">{COMPATIBILITY_TOOLTIP}</span>
    </span>
  );
}
