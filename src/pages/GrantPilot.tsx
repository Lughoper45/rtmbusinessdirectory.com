import { motion } from 'framer-motion';
import { ClipboardCheck, DollarSign, Globe2, Mail, Phone, Rocket, Search, ShieldAlert } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import ParticleBackground from '@/components/ParticleBackground';
import GrantPipeline from '@/components/grantpilot/GrantPipeline';
import GrantDiscovery from '@/components/grantpilot/GrantDiscovery';

const grantFlyerPoints = [
  {
    icon: Search,
    title: 'Identify grant programs',
    description: 'Review Canadian business grants and funding programs that may fit your business stage and goals.',
  },
  {
    icon: ClipboardCheck,
    title: 'Check qualification fit',
    description: 'Use a grant checklist to compare your business criteria against program rules before applying.',
  },
  {
    icon: DollarSign,
    title: 'Up to $30,000 or more',
    description: 'Some programs may offer $30,000 or more, depending on the business, program, and eligibility rules.',
  },
  {
    icon: ShieldAlert,
    title: 'Program rules apply',
    description: "Grant eligibility depends on your business criteria and each grant program's rules.",
  },
];

const GrantPilot = () => {
  return (
    <>
      <Helmet>
        <title>Canadian Business Grants & Funding | RTM Business Directory</title>
        <meta
          name="description"
          content="Explore Canadian business grants and funding programs, identify opportunities you may qualify for, and request a free active grant checklist from RTM Business Directory."
        />
      </Helmet>

      <div className="min-h-screen animated-gradient relative">
        <ParticleBackground />

        <Navbar />

        {/* Main Content */}
        <main className="px-4 pb-12 pt-8 lg:px-8 lg:pt-10 relative z-10">
          <div className="max-w-7xl mx-auto space-y-8">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl border border-primary/20 bg-white text-[#061f3a] shadow-2xl"
            >
              <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(204,0,0,0.08),transparent_42%),linear-gradient(300deg,rgba(6,31,58,0.08),transparent_44%)]" />
              <div className="relative z-10 grid gap-8 p-6 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
                <div className="flex justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2">
                  <img
                    src="/grant-flyer2.jpeg"
                    alt="RTM Business Directory Canadian business grants and funding flyer"
                    className="max-h-[820px] w-full object-contain"
                  />
                </div>

                <div className="flex flex-col justify-center">
                  <div className="inline-flex w-fit items-center gap-2 rounded-full bg-red-700 px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-white">
                    <Rocket className="h-4 w-4" />
                    Business grants or funding
                  </div>
                  <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight md:text-6xl">
                    Are you currently exploring grants to grow your business?
                  </h1>
                  <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-slate-700">
                    RTM Business Directory helps Canadian startups and established businesses identify grant programs they may qualify for, including programs that can reach up to $30,000 or more in some cases.
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {grantFlyerPoints.map((item) => {
                      const Icon = item.icon;

                      return (
                        <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-700 text-white">
                            <Icon className="h-5 w-5" />
                          </div>
                          <h2 className="mt-4 text-xl font-black text-[#061f3a]">{item.title}</h2>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-700 text-white">
                        <Mail className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-[#061f3a]">Request a free grant checklist</h2>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          Send us your email and we can share a checklist of active grant programs with links to apply.
                        </p>
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                          <a
                            href="mailto:info@rtmbusinessdirectory.com?subject=Free%20Grant%20Checklist%20Request"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 font-semibold text-white transition-colors hover:bg-red-800"
                          >
                            <Mail className="h-5 w-5" />
                            Request checklist
                          </a>
                          <a
                            href="tel:+14169008728"
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#061f3a] px-5 py-3 font-semibold text-[#061f3a] transition-colors hover:bg-[#061f3a] hover:text-white"
                          >
                            <Phone className="h-5 w-5" />
                            416 900 8728
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-700">
                    <a href="https://www.rtmbusinessdirectory.com" className="inline-flex items-center gap-2 hover:text-red-700">
                      <Globe2 className="h-5 w-5 text-red-700" />
                      www.rtmbusinessdirectory.com
                    </a>
                    <span className="text-slate-400">Eligibility depends on your business criteria and the grant rules.</span>
                  </div>
                </div>
              </div>
            </motion.section>

            {/* Pipeline */}
            <GrantPipeline />

            {/* Grant Discovery */}
            <GrantDiscovery />

          </div>
        </main>
      </div>
    </>
  );
};

export default GrantPilot;
