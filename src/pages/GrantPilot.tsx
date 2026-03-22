import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Rocket, Target, CheckCircle2, Clock, TrendingUp, Zap, ChevronRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import ParticleBackground from '@/components/ParticleBackground';
import GrantPilotHero from '@/components/grantpilot/GrantPilotHero';
import GrantPipeline from '@/components/grantpilot/GrantPipeline';
import GrantDiscovery from '@/components/grantpilot/GrantDiscovery';
import MasterProfileWizard from '@/components/grantpilot/MasterProfileWizard';
import GrantAchievements from '@/components/grantpilot/GrantAchievements';
import { ApplicationTracker } from '@/components/grantpilot/ApplicationTracker';
const GrantPilot = () => {
  const [showProfileWizard, setShowProfileWizard] = useState(false);
  const [profileComplete, setProfileComplete] = useState(67); // percentage

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
              <span className="hidden sm:inline">Back to Dashboard</span>
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
                Grant<span className="text-gradient">Pilot</span>™
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Profile Completion */}
            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-secondary/50">
              <div className="text-sm">
                <span className="text-muted-foreground">Profile: </span>
                <span className={profileComplete >= 80 ? 'text-success' : 'text-warning'}>
                  {profileComplete}%
                </span>
              </div>
              <div className="w-20 h-2 bg-background rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${profileComplete}%` }}
                  className={`h-full rounded-full ${
                    profileComplete >= 80 
                      ? 'bg-gradient-to-r from-success to-primary' 
                      : 'bg-gradient-to-r from-warning to-primary'
                  }`}
                />
              </div>
            </div>

            <button
              onClick={() => setShowProfileWizard(true)}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Complete Profile</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Hero Section */}
          <GrantPilotHero onStartProfile={() => setShowProfileWizard(true)} />

          {/* Pipeline */}
          <GrantPipeline />

          {/* Grant Discovery */}
          <GrantDiscovery />

          {/* Application Tracker Dashboard */}
          <ApplicationTracker />

          {/* Achievements */}
          <GrantAchievements />
        </div>
      </main>

      {/* Profile Wizard Modal */}
      <AnimatePresence>
        {showProfileWizard && (
          <MasterProfileWizard 
            onClose={() => setShowProfileWizard(false)}
            onComplete={(completion) => {
              setProfileComplete(completion);
              setShowProfileWizard(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default GrantPilot;
