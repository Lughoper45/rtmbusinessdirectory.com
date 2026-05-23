import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  ExternalLink,
  Lock,
  Mail,
  Rocket,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import type { User } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import ParticleBackground from '@/components/ParticleBackground';
import GrantDiscovery from '@/components/grantpilot/GrantDiscovery';
import { supabase } from '@/integrations/supabase/client';
import { fetchPlatformMembership } from '@/services/membership';
import {
  GRANT_PACKAGES,
  formatPackagePrice,
  getPackageRequestMailto,
  type GrantPackageId,
} from '@/lib/grantPackages';
import { GRANTS_APP_URL, openMembershipJoin } from '@/lib/site';

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
    q: 'Is this AI?',
    a: 'No — RTM grant advisors review your profile and guide you through verified Canadian programs. GrantPilot organizes matches and tracking; humans handle advisory packages and complex submissions.',
  },
  {
    q: 'Do I need RTM membership?',
    a: 'Member pricing on advisor packages and the full GrantPilot workspace (match scores, application tracker) require active RTM membership. You can explore featured programs on this page without signing in.',
  },
  {
    q: 'Where do I apply to grants?',
    a: 'Marketing and package info lives on rtmbusinessdirectory.com. Your personalized grant workspace is at grants.rtmbusinessdirectory.com after sign-in.',
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
          <Mail className="w-4 h-4" />
          Request package
        </button>
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

  const handleRequestPackage = (packageId: GrantPackageId) => {
    window.location.href = getPackageRequestMailto(packageId);
  };

  const workspaceUrl = `${GRANTS_APP_URL.replace(/\/$/, '')}/grants`;

  return (
    <>
      <Helmet>
        <title>RTM Grant Programs & Advisor Packages | RTM Business Directory</title>
        <meta
          name="description"
          content="Funding programs matched to your business profile. Explore RTM grant advisor packages and open your GrantPilot workspace on the grants subdomain."
        />
      </Helmet>

      <motion.div className="min-h-screen animated-gradient relative">
        <ParticleBackground />
        <Navbar />

        <main className="px-4 pb-12 pt-8 lg:px-8 lg:pt-10 relative z-10">
          <div className="max-w-7xl mx-auto space-y-16">
            {/* Hero */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl glass-panel border border-primary/20 p-8 lg:p-12"
            >
              <motion.div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
              </motion.div>
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6 text-sm font-medium text-primary">
                  <Users className="w-4 h-4" />
                  Advisor-led grant support
                </div>
                <h1 className="font-orbitron text-4xl lg:text-5xl font-bold text-foreground mb-4">
                  Funding programs matched to your{' '}
                  <span className="text-gradient">business profile</span>
                </h1>
                <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
                  RTM helps Canadian businesses identify grant programs they may qualify for, then supports applications
                  with structured advisor packages — not automated submissions.
                </p>
                <div className="flex flex-wrap gap-3">
                  {memberActive ? (
                    <a
                      href={workspaceUrl}
                      className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold inline-flex items-center gap-2 hover:bg-primary/90 transition-colors"
                    >
                      Open grant workspace
                      <ExternalLink className="w-5 h-5" />
                    </a>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => openMembershipJoin({ returnUrl })}
                        className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold inline-flex items-center gap-2 hover:bg-primary/90 transition-colors"
                      >
                        Join RTM
                        <ArrowRight className="w-5 h-5" />
                      </button>
                      <a
                        href={workspaceUrl}
                        className="px-6 py-3 rounded-xl border border-primary/50 text-primary font-semibold hover:bg-primary/10 transition-colors inline-flex items-center gap-2"
                      >
                        Sign in on grants site
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </>
                  )}
                </div>
              </div>
            </motion.section>

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

            {/* Featured programs teaser */}
            <section>
              <div className="mb-2">
                <h2 className="font-orbitron text-2xl font-bold text-foreground">Featured programs</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {memberActive
                    ? 'Browse your full matched catalog in the grant workspace.'
                    : 'Preview verified Canadian programs — sign in on the grants site for match scores and tracking.'}
                </p>
              </div>
              <GrantDiscovery limit={3} showMatchScores={memberActive} />
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
