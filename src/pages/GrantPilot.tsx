import { motion } from 'framer-motion';
import { ArrowLeft, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';
import ParticleBackground from '@/components/ParticleBackground';
import GrantPilotHero from '@/components/grantpilot/GrantPilotHero';
import GrantPipeline from '@/components/grantpilot/GrantPipeline';
import GrantDiscovery from '@/components/grantpilot/GrantDiscovery';
import { ApplicationTracker } from '@/components/grantpilot/ApplicationTracker';

const GrantPilot = () => {
  return (
    <div className="min-h-screen animated-gradient relative">
      <ParticleBackground />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 glass-panel border-b border-primary/20">
        <div className="h-full max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Home</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Rocket className="w-6 h-6 text-primary" />
              </motion.div>
              <span className="font-orbitron font-bold text-lg text-foreground">
                Canadian <span className="text-gradient">Grants</span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Section */}
          <GrantPilotHero />

          {/* Pipeline */}
          <GrantPipeline />

          {/* Grant Discovery */}
          <GrantDiscovery />

          {/* Application Tracker */}
          <ApplicationTracker />
        </div>
      </main>
    </div>
  );
};

export default GrantPilot;
