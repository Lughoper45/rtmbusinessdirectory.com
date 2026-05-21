import { motion } from 'framer-motion';
import { Trophy, Lock, Star, Zap, Target, DollarSign, FileCheck, Rocket, Award, TrendingUp } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  earned: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress?: number;
  progressMax?: number;
}

const GrantAchievements = () => {
  const badges: Badge[] = [
    {
      id: 'profile-complete',
      name: 'Profile Complete',
      description: 'Finish your master profile',
      icon: <FileCheck className="w-6 h-6" />,
      earned: true,
      rarity: 'common',
    },
    {
      id: 'first-application',
      name: 'First Application',
      description: 'Submit your first grant',
      icon: <Rocket className="w-6 h-6" />,
      earned: true,
      rarity: 'common',
    },
    {
      id: 'grant-winner',
      name: 'Grant Winner',
      description: 'Receive funding approval',
      icon: <Trophy className="w-6 h-6" />,
      earned: true,
      rarity: 'rare',
    },
    {
      id: 'funding-master',
      name: 'Funding Master',
      description: 'Win 3+ grants',
      icon: <Award className="w-6 h-6" />,
      earned: false,
      rarity: 'epic',
      progress: 2,
      progressMax: 3,
    },
    {
      id: 'six-figure-club',
      name: 'Six-Figure Club',
      description: 'Build a strong funding workflow',
      icon: <DollarSign className="w-6 h-6" />,
      earned: false,
      rarity: 'legendary',
      progress: 31500,
      progressMax: 100000,
    },
    {
      id: 'speed-demon',
      name: 'Speed Demon',
      description: 'Submit 5 applications in one day',
      icon: <Zap className="w-6 h-6" />,
      earned: false,
      rarity: 'epic',
      progress: 2,
      progressMax: 5,
    },
  ];

  const getRarityColors = (rarity: string, earned: boolean) => {
    if (!earned) return 'from-muted to-muted/50 border-border';
    switch (rarity) {
      case 'legendary':
        return 'from-warning via-accent to-warning border-warning/50';
      case 'epic':
        return 'from-accent to-primary border-accent/50';
      case 'rare':
        return 'from-primary to-success border-primary/50';
      default:
        return 'from-success/80 to-success border-success/50';
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 'bg-warning/20 text-warning';
      case 'epic':
        return 'bg-accent/20 text-accent';
      case 'rare':
        return 'bg-primary/20 text-primary';
      default:
        return 'bg-success/20 text-success';
    }
  };

  // Stats
  const totalFunding = 31500;
  const applicationsSubmitted = 5;
  const successRate = 40;
  const currentLevel = 4;
  const xpProgress = 78;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-orbitron text-xl font-bold text-foreground flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          Achievements
        </h2>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-xl glass-panel text-center">
          <div className="font-orbitron text-2xl font-bold text-success mb-1">
            ${totalFunding.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">Total Awarded</p>
        </div>
        <div className="p-4 rounded-xl glass-panel text-center">
          <div className="font-orbitron text-2xl font-bold text-primary mb-1">
            {applicationsSubmitted}
          </div>
          <p className="text-xs text-muted-foreground">Applications</p>
        </div>
        <div className="p-4 rounded-xl glass-panel text-center">
          <div className="font-orbitron text-2xl font-bold text-warning mb-1">
            {successRate}%
          </div>
          <p className="text-xs text-muted-foreground">Success Rate</p>
        </div>
        <div className="p-4 rounded-xl glass-panel text-center">
          <div className="font-orbitron text-2xl font-bold text-accent mb-1">
            Level {currentLevel}
          </div>
          <p className="text-xs text-muted-foreground">Grant Applicant</p>
        </div>
      </div>

      {/* Level Progress */}
      <div className="p-6 rounded-2xl glass-panel mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🌿</div>
            <div>
              <h3 className="font-orbitron font-bold text-foreground">Level {currentLevel} - Grant Applicant</h3>
              <p className="text-sm text-muted-foreground">Next: Grant Winner (Submit 2 more applications)</p>
            </div>
          </div>
          <div className="text-right">
            <div className="font-orbitron text-lg font-bold text-primary">{xpProgress}/100 XP</div>
          </div>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${xpProgress}%` }}
            transition={{ delay: 0.5, duration: 1 }}
            className="h-full rounded-full bg-gradient-to-r from-primary via-success to-warning"
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>🌱 Startup</span>
          <span>🌿 Growing</span>
          <span>🌳 Thriving</span>
          <span>🏆 Leading</span>
          <span>💎 Elite</span>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: badge.earned ? 1.05 : 1 }}
            className={`relative p-4 rounded-2xl border bg-gradient-to-br ${getRarityColors(badge.rarity, badge.earned)} ${
              !badge.earned && 'opacity-60'
            }`}
          >
            {/* Rarity Label */}
            <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase ${getRarityLabel(badge.rarity)}`}>
              {badge.rarity}
            </span>

            {/* Icon */}
            <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${
              badge.earned ? 'bg-background/20' : 'bg-background/10'
            }`}>
              {badge.earned ? (
                <div className="text-foreground">{badge.icon}</div>
              ) : (
                <Lock className="w-5 h-5 text-muted-foreground" />
              )}
            </div>

            {/* Name */}
            <h4 className={`font-semibold text-sm text-center mb-1 ${
              badge.earned ? 'text-foreground' : 'text-muted-foreground'
            }`}>
              {badge.name}
            </h4>

            {/* Description */}
            <p className="text-xs text-center text-muted-foreground mb-2">
              {badge.description}
            </p>

            {/* Progress (if not earned) */}
            {!badge.earned && badge.progress !== undefined && badge.progressMax !== undefined && (
              <div className="mt-2">
                <div className="h-1.5 bg-background/20 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground/50"
                    style={{ width: `${(badge.progress / badge.progressMax) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-center text-muted-foreground mt-1">
                  {typeof badge.progress === 'number' && badge.progress > 1000
                    ? `$${badge.progress.toLocaleString()}`
                    : badge.progress} / {typeof badge.progressMax === 'number' && badge.progressMax > 1000
                    ? `$${badge.progressMax.toLocaleString()}`
                    : badge.progressMax}
                </p>
              </div>
            )}

            {/* Earned indicator */}
            {badge.earned && (
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-success flex items-center justify-center">
                <Star className="w-3 h-3 text-success-foreground" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default GrantAchievements;
