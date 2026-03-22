import { motion } from 'framer-motion';
import { Rocket, DollarSign, Target, Zap, ArrowRight, Sparkles } from 'lucide-react';

interface GrantPilotHeroProps {
  onStartProfile: () => void;
}

const GrantPilotHero = ({ onStartProfile }: GrantPilotHeroProps) => {
  const fundingPotential = 487000;
  const grantsMatched = 23;
  const timeSaved = 35;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      {/* Main Hero Card */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-8 lg:p-12">
        {/* Animated Background Glow */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-success/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Grant Discovery</span>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-orbitron text-4xl lg:text-5xl font-bold mb-4"
              >
                <span className="text-foreground">Your Funding</span>
                <br />
                <span className="text-gradient">Potential</span>
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring' }}
                className="mb-6"
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl lg:text-7xl font-orbitron font-bold text-success text-shadow-glow">
                    ${fundingPotential.toLocaleString()}
                  </span>
                </div>
                <p className="text-muted-foreground mt-2">
                  Based on your profile, you're eligible for{' '}
                  <span className="text-primary font-semibold">{grantsMatched} grants</span>
                </p>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-lg text-muted-foreground mb-8 max-w-md"
              >
                GrantPilot finds, fills, and submits grant applications while you focus on building your business.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap gap-4"
              >
                <button
                  onClick={onStartProfile}
                  className="group px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-primary/25 transition-all"
                >
                  <Rocket className="w-5 h-5" />
                  Explore Grants
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={onStartProfile}
                  className="px-6 py-3 rounded-xl border border-primary/50 text-primary font-semibold hover:bg-primary/10 transition-colors"
                >
                  Complete Profile
                </button>
              </motion.div>
            </div>

            {/* Right Stats Grid */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 gap-4"
            >
              {/* Stat Card 1 */}
              <div className="p-6 rounded-2xl bg-secondary/50 border border-border hover:border-primary/30 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div className="font-orbitron text-3xl font-bold text-foreground mb-1">
                  {grantsMatched}
                </div>
                <p className="text-sm text-muted-foreground">Grants Matched</p>
              </div>

              {/* Stat Card 2 */}
              <div className="p-6 rounded-2xl bg-secondary/50 border border-border hover:border-success/30 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
                <div className="font-orbitron text-3xl font-bold text-foreground mb-1">
                  94%
                </div>
                <p className="text-sm text-muted-foreground">Ready to Apply</p>
              </div>

              {/* Stat Card 3 */}
              <div className="p-6 rounded-2xl bg-secondary/50 border border-border hover:border-warning/30 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-6 h-6 text-warning" />
                </div>
                <div className="font-orbitron text-3xl font-bold text-foreground mb-1">
                  {timeSaved}h
                </div>
                <p className="text-sm text-muted-foreground">Time Saved</p>
              </div>

              {/* Stat Card 4 */}
              <div className="p-6 rounded-2xl bg-secondary/50 border border-border hover:border-accent/30 transition-colors group">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Rocket className="w-6 h-6 text-accent" />
                </div>
                <div className="font-orbitron text-3xl font-bold text-foreground mb-1">
                  40%
                </div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="flex items-center gap-3 p-4 rounded-xl glass-panel">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <span className="text-lg">🏛️</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Federal</p>
            <p className="font-semibold text-foreground">8 grants</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl glass-panel">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
            <span className="text-lg">🍁</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Provincial</p>
            <p className="font-semibold text-foreground">10 grants</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl glass-panel">
          <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
            <span className="text-lg">🏙️</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Municipal</p>
            <p className="font-semibold text-foreground">3 grants</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl glass-panel">
          <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
            <span className="text-lg">🎯</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Industry</p>
            <p className="font-semibold text-foreground">2 grants</p>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
};

export default GrantPilotHero;
