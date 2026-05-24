import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

type GrantAdvisoryDisclaimerProps = {
  variant?: 'full' | 'slim';
  className?: string;
};

const DISCLAIMER_BODY = (
  <>
    RTM Business Directory is a <strong>private Canadian business advisory and consulting platform</strong>.
    We are not a government agency. We do not disburse public funds. We do not guarantee grant approval.
    All grant programs listed are administered by their respective government or third-party entities, which hold
    sole authority over final eligibility determinations. RTM advisors assist with application preparation. RTM does
    not submit applications to government portals on your behalf without your explicit review and consent.
  </>
);

const GrantAdvisoryDisclaimer = ({ variant = 'full', className = '' }: GrantAdvisoryDisclaimerProps) => {
  const isFull = variant === 'full';

  return (
    <aside
      role="note"
      aria-label="Grant advisory disclaimer"
      className={`rounded-xl border border-border/70 bg-muted/40 text-sm leading-relaxed text-muted-foreground ${
        isFull ? 'p-4 md:p-5' : 'px-3 py-2.5'
      } ${className}`}
    >
      <div className="flex gap-3">
        <Shield className={`mt-0.5 shrink-0 text-primary ${isFull ? 'h-5 w-5' : 'h-4 w-4'}`} aria-hidden />
        <div className="space-y-2">
          <p className={isFull ? 'text-foreground/90' : 'text-xs md:text-sm'}>{DISCLAIMER_BODY}</p>
          <p className={`${isFull ? 'text-xs' : 'text-[11px]'} text-muted-foreground`}>
            See our{' '}
            <Link to="/privacy" className="font-medium text-primary underline underline-offset-2 hover:text-primary/80">
              Privacy Policy
            </Link>{' '}
            and{' '}
            <Link to="/terms" className="font-medium text-primary underline underline-offset-2 hover:text-primary/80">
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </div>
    </aside>
  );
};

export default GrantAdvisoryDisclaimer;
