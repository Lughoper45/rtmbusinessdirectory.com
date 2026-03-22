import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, AlertCircle, Bot, Bookmark, Share2, ChevronRight, Sparkles, DollarSign, TrendingUp } from 'lucide-react';
import ApplyForMeModal from './ApplyForMeModal';

export interface Grant {
  id: string;
  name: string;
  organization: string;
  amount: number;
  matchScore: number;
  deadline: number; // days
  readyPercentage: number;
  approvalRate: number;
  type: 'federal' | 'provincial' | 'municipal';
  requirements: {
    label: string;
    met: boolean;
  }[];
  timeToComplete: string;
}

const GrantDiscovery = () => {
  const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);
  const grants: Grant[] = [
    {
      id: '1',
      name: 'Canada Digital Adoption Program (CDAP)',
      organization: 'Innovation Canada',
      amount: 15000,
      matchScore: 94,
      deadline: 23,
      readyPercentage: 94,
      approvalRate: 73,
      type: 'federal',
      requirements: [
        { label: 'Business profile complete', met: true },
        { label: 'Financial docs uploaded', met: true },
        { label: 'Technology plan drafted', met: true },
        { label: 'Letter from tech vendor', met: false },
      ],
      timeToComplete: '8 min',
    },
    {
      id: '2',
      name: 'Ontario Innovation Tax Credit',
      organization: 'Ontario Ministry of Finance',
      amount: 50000,
      matchScore: 87,
      deadline: 45,
      readyPercentage: 76,
      approvalRate: 65,
      type: 'provincial',
      requirements: [
        { label: 'SR&ED eligible activities', met: true },
        { label: 'Payroll records uploaded', met: true },
        { label: 'Project descriptions', met: false },
        { label: 'Financial statements', met: true },
      ],
      timeToComplete: '25 min',
    },
    {
      id: '3',
      name: 'Toronto Business Improvement Grant',
      organization: 'City of Toronto',
      amount: 10000,
      matchScore: 92,
      deadline: 7,
      readyPercentage: 88,
      approvalRate: 81,
      type: 'municipal',
      requirements: [
        { label: 'Located in Toronto', met: true },
        { label: 'Active business license', met: true },
        { label: 'Improvement proposal', met: true },
        { label: 'Quote from contractor', met: false },
      ],
      timeToComplete: '12 min',
    },
    {
      id: '4',
      name: 'NRC-IRAP Funding',
      organization: 'National Research Council',
      amount: 75000,
      matchScore: 78,
      deadline: 60,
      readyPercentage: 62,
      approvalRate: 42,
      type: 'federal',
      requirements: [
        { label: 'Innovation-focused SME', met: true },
        { label: 'Technical feasibility study', met: false },
        { label: 'Market analysis', met: false },
        { label: 'Team qualifications', met: true },
      ],
      timeToComplete: '45 min',
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'federal':
        return 'bg-primary/10 text-primary border-primary/30';
      case 'provincial':
        return 'bg-success/10 text-success border-success/30';
      case 'municipal':
        return 'bg-warning/10 text-warning border-warning/30';
      default:
        return 'bg-secondary text-foreground border-border';
    }
  };

  const getDeadlineColor = (days: number) => {
    if (days <= 7) return 'text-destructive';
    if (days <= 14) return 'text-warning';
    return 'text-success';
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'from-success to-primary';
    if (score >= 70) return 'from-warning to-success';
    return 'from-destructive to-warning';
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-orbitron text-xl font-bold text-foreground flex items-center gap-3">
          <span className="text-2xl">🎯</span>
          Grant Discovery
          <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-sm font-normal">
            23 matches
          </span>
        </h2>
        <button className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
          See All Grants
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="-mx-4 flex gap-6 overflow-x-auto px-4 pb-2">
        {grants.map((grant, index) => (
          <motion.div
            key={grant.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className="w-[340px] shrink-0"
          >
            <div className="h-full p-6 rounded-2xl glass-panel border border-border hover:border-primary/30 transition-all group holo-card">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(grant.type)}`}>
                  {grant.type.charAt(0).toUpperCase() + grant.type.slice(1)}
                </span>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                    <Bookmark className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
                    <Share2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                {grant.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{grant.organization}</p>

              {/* Amount */}
              <div className="flex items-baseline gap-2 mb-4">
                <span className="font-orbitron text-3xl font-bold text-gradient shimmer">
                  ${grant.amount.toLocaleString()}
                </span>
              </div>

              {/* Match Score */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Match Score</span>
                  <span className={`font-semibold ${grant.matchScore >= 80 ? 'text-success' : 'text-warning'}`}>
                    {grant.matchScore}%
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${grant.matchScore}%` }}
                    transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                    className={`h-full rounded-full bg-gradient-to-r ${getMatchScoreColor(grant.matchScore)}`}
                  />
                </div>
              </div>

              {/* Readiness */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Application Ready</span>
                  <span className={`font-semibold ${grant.readyPercentage >= 80 ? 'text-success' : 'text-warning'}`}>
                    {grant.readyPercentage}%
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${grant.readyPercentage}%` }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.8 }}
                    className="h-full rounded-full bg-gradient-to-r from-primary to-success"
                  />
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-2 mb-4">
                {grant.requirements.map((req, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {req.met ? (
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-warning flex-shrink-0" />
                    )}
                    <span className={req.met ? 'text-muted-foreground' : 'text-foreground'}>
                      {req.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-between text-sm mb-4 py-3 border-t border-border">
                <div className="flex items-center gap-1">
                  <Clock className={`w-4 h-4 ${getDeadlineColor(grant.deadline)}`} />
                  <span className={getDeadlineColor(grant.deadline)}>
                    {grant.deadline} days
                  </span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  <span>{grant.approvalRate}% approval</span>
                </div>
              </div>

              {/* Time Estimate */}
              <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                ~{grant.timeToComplete} to complete
              </p>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">
                  Review
                </button>
                <button 
                  onClick={() => setSelectedGrant(grant)}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-2"
                >
                  <Bot className="w-4 h-4" />
                  Apply for Me
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load More */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 text-center"
      >
        <button className="px-6 py-3 rounded-xl border border-primary/50 text-primary font-medium hover:bg-primary/10 transition-colors inline-flex items-center gap-2">
          View All 23 Grants
          <ChevronRight className="w-4 h-4" />
        </button>
      </motion.div>

      {/* Apply for Me Modal */}
      <AnimatePresence>
        {selectedGrant && (
          <ApplyForMeModal 
            grant={selectedGrant} 
            onClose={() => setSelectedGrant(null)} 
          />
        )}
      </AnimatePresence>
    </motion.section>
  );
};

export default GrantDiscovery;
