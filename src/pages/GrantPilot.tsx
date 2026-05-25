import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  ExternalLink,
  Globe2,
  Lock,
  Mail,
  Phone,
  Rocket,
  Search,
  ShoppingCart,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import type { User } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import ParticleBackground from '@/components/ParticleBackground';
import GrantCatalog from '@/components/grantpilot/GrantCatalog';
import GrantChecklistRequestDialog from '@/components/grantpilot/GrantChecklistRequestDialog';
import GrantAdvisoryDisclaimer from '@/components/grantpilot/GrantAdvisoryDisclaimer';
import { supabase } from '@/integrations/supabase/client';
import { fetchPlatformMembership } from '@/services/membership';
import {
  GRANT_PACKAGES,
  formatPackagePrice,
  getPackageCheckoutUrl,
  getPackageRequestMailto,
  type GrantPackageId,
} from '@/lib/grantPackages';
import { DIRECTORY_APP_URL, getGrowPortalUrl, GRANTS_APP_URL, openMembershipJoin, SITE_CONTACT } from '@/lib/site';

const GRANT_CHECKLIST = [
  'Check eligibility criteria',
  'Gather documents',
  'Prepare your application',
  'Advisor review & submit',
] as const;

const steps = [
  {
    icon: Search,
    title: 'Build your business profile',
    description: 'Share industry, location, stage, and funding goals so RTM advisors can match real Canadian programs.',
  },
  {
    icon: ClipboardList,
    title: 'Choose an advisor package',
    description: 'Pick the level of support you need — from eligibility checklists to full application coordination.',
  },
  {
    icon: Rocket,
    title: 'Apply in your grant workspace',
    description: 'Active members use GrantPilot on the grants subdomain for matched programs, tracking, and submissions.',
  },
];

const faqs = [
  {
    q: 'How does RTM member pricing work?',
    a: 'Active RTM members receive 50% off all grant advisor packages listed on this page. List prices apply until your membership is active on membership.rtmbusinessdirectory.com. Member rates unlock automatically once your account shows an active membership status.',
  },
  {
    q: 'What is included in each advisor package?',
    a: 'Packages range from Maple Checklist (eligibility review and program shortlist) through Northern Star (dedicated advisor and end-to-end application coordination). Each tier adds deeper document review, provincial strategy, or full submission support — see the packages table above for highlights.',
  },
  {
    q: 'How do I access the grant workspace?',
    a: 'Sign in at grants.rtmbusinessdirectory.com with the same email and password you use for RTM membership. Your workspace shows profile-matched programs, RTM compatibility estimates, and application tracking. Package checkout and intake stay on the grants subdomain.',
  },
  {
    q: 'What is the typical timeline?',
    a: 'Eligibility review and checklist packages usually complete within one to two weeks. Application prep and full-service packages depend on program deadlines and document readiness — your RTM advisor will confirm milestones after you request a package.',
  },
  {
    q: 'Who is eligible for Canadian business grants?',
    a: 'Eligibility varies by program (sector, province, company size, and project type). RTM advisors assess your profile against federal, provincial, and regional programs. Listings here are sourced from official program pages; RTM compatibility estimates are not government eligibility determinations.',
  },
  {
    q: 'Do I need RTM membership?',
    a: 'You can browse featured programs here without signing in. Member pricing on advisor packages and the full GrantPilot workspace (match scores, application tracker) require active RTM membership.',
  },
];

function PackageRow({
  packageId,
  name,
  listPrice,
  memberPrice,
  description,
  memberActive,
  onRequest,
}: {
  packageId: GrantPackageId;
  name: string;
  listPrice: number;
  memberPrice: number;
  description: string;
  memberActive: boolean;
  onRequest: (id: GrantPackageId) => void;
}) {
  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="py-4 pr-4 align-top">
        <p className="font-semibold text-foreground">{name}</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
      </td>
      <td className="py-4 px-4 text-right align-top whitespace-nowrap">
        <span className="font-orbitron font-bold">{formatPackagePrice(listPrice)}</span>
      </td>
      <td className="py-4 pl-4 text-right align-top whitespace-nowrap">
        {memberActive ? (
          <span className="font-orbitron font-bold text-success">{formatPackagePrice(memberPrice)}</span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground blur-sm select-none" aria-hidden>
            <Lock className="w-3.5 h-3.5" />
            Member price
          </span>
        )}
      </td>
      <td className="py-4 pl-4 text-right align-top">
        <button
          type="button"
          onClick={() => onRequest(packageId)}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          Buy package
        </button>
        <a
          href={getPackageRequestMailto(packageId)}
          className="mt-2 block text-xs text-muted-foreground hover:text-primary"
        >
          Contact advisor instead
        </a>
      </td>
    </tr>
  );
}

const GrantPilot = () => {
  const [user, setUser] = useState<User | null>(null);
  const [memberActive, setMemberActive] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const returnUrl = typeof window !== 'undefined' ? window.location.href : undefined;

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setMemberActive(false);
      return;
    }
    fetchPlatformMembership(user.id, user.email).then((m) => setMemberActive(m.active));
  }, [user]);

  const handleRequestPackage = async (packageId: GrantPackageId) => {
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    window.location.href = getPackageCheckoutUrl(
      packageId,
      session?.access_token && session.refresh_token
        ? { access_token: session.access_token, refresh_token: session.refresh_token }
        : null,
    );
  };

  const workspaceUrl = `${GRANTS_APP_URL.replace(/\/$/, '')}/grants`;

  return (
    <>
      <Helmet>
        <title>Canadian Business Grants 2026 — RTM Advisory | RTM Global Canada</title>
        <meta
          name="description"
          content="Browse 217 federal and provincial grant programs. RTM advisors help Canadian SMEs prepare and submit grant applications. Private advisory — not a government agency."
        />
        <link rel="canonical" href="https://rtmbusinessdirectory.com/grants" />
      </Helmet>

      <motion.div className="min-h-screen animated-gradient relative">
        <ParticleBackground />
        <Navbar />

        <main className="px-4 pb-12 pt-8 lg:px-8 lg:pt-10 relative z-10">
          <div className="max-w-7xl mx-auto space-y-16">
            {/* Flyer hero */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl border border-[#061f3a]/20 bg-white text-[#061f3a] shadow-2xl"
            >
              <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(204,0,0,0.08),transparent_42%),linear-gradient(300deg,rgba(6,31,58,0.08),transparent_44%)]" />
              <div className="relative z-10 grid gap-8 p-6 lg:grid-cols-[minmax(280px,0.95fr)_1.05fr] lg:items-start lg:p-10">
                <div className="order-2 lg:order-1 flex justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-sm">
                  <img
                    src="/images/grants-flyer.png"
                    alt="RTM Business Directory — apply for Canadian business grants up to $30,000 or more"
                    className="max-h-[820px] w-full object-contain"
                  />
                </div>

                <div className="order-1 lg:order-2 flex flex-col justify-center">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#cc0000] px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-white">
                    <Rocket className="h-4 w-4" />
                    Business grants &amp; funding
                  </div>

                  <h1 className="mt-6 text-3xl font-black leading-[1.08] tracking-tight sm:text-4xl lg:text-[2.65rem]">
                    <span className="text-[#d4a800]">We can help you</span>{' '}
                    apply for business{' '}
                    <span className="text-[#cc0000]">grants</span> you may qualify for, up to{' '}
                    <span className="text-[#061f3a]">$30,000</span> dollars or more
                  </h1>

                  <p className="mt-5 flex max-w-2xl items-start gap-3 rounded-2xl border border-[#061f3a]/15 bg-[#f8fafc] px-4 py-4 text-base font-semibold leading-7 text-[#061f3a]">
                    <Building2 className="mt-0.5 h-6 w-6 shrink-0 text-[#cc0000]" aria-hidden />
                    RTM helps both established and startup businesses get grants.
                  </p>

                  <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
                    <div className="flex flex-wrap gap-3">
                      {memberActive ? (
                        <a
                          href={workspaceUrl}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#cc0000] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#a80000]"
                        >
                          Open grant workspace
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => openMembershipJoin({ returnUrl })}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#cc0000] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#a80000]"
                          >
                            Join RTM
                            <ArrowRight className="h-5 w-5" />
                          </button>
                          <a
                            href={workspaceUrl}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#061f3a] px-6 py-3 font-semibold text-[#061f3a] transition-colors hover:bg-[#061f3a] hover:text-white"
                          >
                            Sign in on grants site
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </>
                      )}
                      <GrantChecklistRequestDialog
                        triggerClassName="inline-flex items-center justify-center gap-2 rounded-xl border border-[#cc0000]/40 bg-red-50 px-6 py-3 font-semibold text-[#061f3a] transition-colors hover:bg-red-100"
                      />
                    </div>

                    <aside className="rounded-2xl border-2 border-[#061f3a]/20 bg-white p-5 shadow-md lg:min-w-[220px]">
                      <h2 className="text-center text-sm font-black uppercase tracking-[0.14em] text-[#061f3a]">
                        Grant <span className="text-[#cc0000]">Checklist</span>
                      </h2>
                      <ul className="mt-4 space-y-3">
                        {GRANT_CHECKLIST.map((item) => (
                          <li key={item} className="flex items-center gap-3 text-sm font-bold text-[#061f3a]">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#cc0000] text-white">
                              <ClipboardCheck className="h-4 w-4" />
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </aside>
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-4 rounded-2xl bg-[#061f3a] px-5 py-4 text-sm font-semibold text-white">
                    <a
                      href={DIRECTORY_APP_URL}
                      className="inline-flex items-center gap-2 hover:text-[#ffd700]"
                    >
                      <Globe2 className="h-5 w-5 text-[#cc0000]" />
                      www.rtmbusinessdirectory.com
                    </a>
                    <a
                      href={SITE_CONTACT.phoneHref}
                      className="inline-flex items-center gap-2 hover:text-[#ffd700]"
                    >
                      <Phone className="h-5 w-5 text-[#cc0000]" />
                      <span>
                        Tel: <span className="text-[#ffd700]">{SITE_CONTACT.phoneDisplay.replace('+1 ', '')}</span>
                      </span>
                    </a>
                    <span className="ml-auto inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white/90">
                      <span className="text-[#cc0000]" aria-hidden>
                        🍁
                      </span>
                      Proudly Canadian
                    </span>
                  </div>
                </div>
              </div>
            </motion.section>

            <GrantAdvisoryDisclaimer variant="full" />

            <section className="rounded-2xl border border-[#cc0000]/30 bg-gradient-to-r from-[#061f3a] to-[#0a2d52] p-6 md:p-8 text-white">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 text-[#97c93d] text-sm font-bold uppercase tracking-wide">
                    <TrendingUp className="h-4 w-4" />
                    Grow My Business
                  </div>
                  <h2 className="mt-2 text-2xl font-bold">
                    Grants can fund the digital tools RTM builds for you
                  </h2>
                  <p className="mt-2 text-white/80 max-w-xl text-sm leading-relaxed">
                    Many programs support websites, marketing, CRM, and training. Pair GrantPilot with RTM Growth
                    Services — visibility, sales systems, and automation on grow.rtmbusinessdirectory.com.
                  </p>
                </div>
                <a
                  href={getGrowPortalUrl("/?source=grantpilot")}
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#cc0000] px-6 py-3 font-semibold text-white hover:bg-[#a80000]"
                >
                  Free growth audit
                  <ArrowRight className="h-5 w-5" />
                </a>
              </div>
            </section>

            {/* How it works */}
            <section>
              <h2 className="font-orbitron text-2xl font-bold text-foreground mb-6">How it works</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {steps.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={step.title}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="glass-panel rounded-2xl p-6 border border-border/40"
                    >
                      <motion.div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                        <Icon className="w-6 h-6 text-primary" />
                      </motion.div>
                      <p className="text-xs font-semibold text-primary mb-2">Step {i + 1}</p>
                      <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </motion.div>
                  );
                })}
              </div>
            </section>

            {/* Packages */}
            <section>
              <GrantAdvisoryDisclaimer variant="slim" className="mb-4" />
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
                <div>
                  <h2 className="font-orbitron text-2xl font-bold text-foreground">Advisor packages</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    List pricing shown below. Active RTM members unlock 50% member rates.
                  </p>
                </div>
                {!memberActive && (
                  <button
                    type="button"
                    onClick={() => openMembershipJoin({ returnUrl })}
                    className="text-sm text-primary font-medium inline-flex items-center gap-1 hover:underline"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Unlock member pricing
                  </button>
                )}
              </div>

              <div className="glass-panel rounded-2xl border border-border/40 overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead>
                    <tr className="border-b border-border/60 text-left text-muted-foreground">
                      <th className="py-3 pr-4 font-medium">Package</th>
                      <th className="py-3 px-4 font-medium text-right">List price</th>
                      <th className="py-3 pl-4 font-medium text-right">Member price</th>
                      <th className="py-3 pl-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {GRANT_PACKAGES.map((pkg) => (
                      <PackageRow
                        key={pkg.id}
                        packageId={pkg.id}
                        name={pkg.name}
                        listPrice={pkg.listPrice}
                        memberPrice={pkg.memberPrice}
                        description={pkg.description}
                        memberActive={memberActive}
                        onRequest={handleRequestPackage}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Searchable grant catalog */}
            <section>
              <GrantCatalog showMatchScores={memberActive} />
            </section>

            {/* FAQ */}
            <section>
              <h2 className="font-orbitron text-2xl font-bold text-foreground mb-6">FAQ</h2>
              <div className="space-y-3">
                {faqs.map((item, i) => (
                  <div key={item.q} className="glass-panel rounded-xl border border-border/40 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                      className="w-full flex items-center justify-between gap-4 p-4 text-left"
                    >
                      <span className="font-medium text-foreground">{item.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${
                          openFaq === i ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {openFaq === i && (
                      <p className="px-4 pb-4 text-sm text-muted-foreground border-t border-border/40 pt-3">
                        {item.a}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* CTA */}
            <motion.section
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="glass-panel rounded-2xl p-8 text-center border border-primary/20"
            >
              <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-4" />
              <h2 className="font-orbitron text-xl font-bold text-foreground mb-2">Ready to pursue funding?</h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-6 text-sm">
                Join RTM for member package pricing, or open GrantPilot on the grants subdomain if you already have an
                active membership.
              </p>
              <motion.div className="flex flex-wrap justify-center gap-3">
                {memberActive ? (
                  <a
                    href={workspaceUrl}
                    className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold inline-flex items-center gap-2"
                  >
                    Go to grant workspace
                    <ExternalLink className="w-5 h-5" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => openMembershipJoin({ returnUrl })}
                    className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold inline-flex items-center gap-2"
                  >
                    Join RTM
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </motion.div>
            </motion.section>
          </div>
        </main>
      </motion.div>
    </>
  );
};

export default GrantPilot;
