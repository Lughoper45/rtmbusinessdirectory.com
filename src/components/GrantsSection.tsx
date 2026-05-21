import { motion } from 'framer-motion';
import { DollarSign, Clock, Star, ChevronRight, Bookmark, ExternalLink, Sparkles, Rocket } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Grant {
  id: string;
  name: string;
  organization: string;
  amount: number;
  matchScore: number;
  deadline: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  type: 'Federal' | 'Provincial' | 'Municipal';
  requirements: string[];
  approvalRate: number;
}

const grants: Grant[] = [
  {
    id: '1',
    name: 'Canada Small Business Financing',
    organization: 'Federal program',
    amount: 50000,
    matchScore: 87,
    deadline: 14,
    difficulty: 'Medium',
    type: 'Federal',
    requirements: ['Revenue < $500K', '2+ employees', 'Tech sector'],
    approvalRate: 73
  },
  {
    id: '2',
    name: 'Ontario Scale-Up Vouchers',
    organization: 'Ontario Ministry of Economic Development',
    amount: 25000,
    matchScore: 74,
    deadline: 30,
    difficulty: 'Easy',
    type: 'Provincial',
    requirements: ['Ontario based', '5+ employees', 'Export ready'],
    approvalRate: 68
  },
  {
    id: '3',
    name: 'Toronto Innovation Grant',
    organization: 'City of Toronto',
    amount: 10000,
    matchScore: 92,
    deadline: 7,
    difficulty: 'Easy',
    type: 'Municipal',
    requirements: ['Toronto based', 'Innovation focus', '< 50 employees'],
    approvalRate: 81
  },
  {
    id: '4',
    name: 'Digital Adoption Program',
    organization: 'ISED Canada',
    amount: 15000,
    matchScore: 89,
    deadline: 21,
    difficulty: 'Easy',
    type: 'Federal',
    requirements: ['Digital transformation', 'Revenue $500K+', 'Full-time staff'],
    approvalRate: 76
  },
  {
    id: '5',
    name: 'Export Development Grant',
    organization: 'EDC',
    amount: 35000,
    matchScore: 65,
    deadline: 45,
    difficulty: 'Hard',
    type: 'Federal',
    requirements: ['Export focused', '$1M+ revenue', 'Market research'],
    approvalRate: 58
  }
];

const GrantCard = ({ grant, index }: { grant: Grant; index: number }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Federal': return 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400';
      case 'Provincial': return 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400';
      case 'Municipal': return 'from-orange-500/20 to-orange-600/10 border-orange-500/30 text-orange-400';
      default: return 'from-primary/20 to-primary/10 border-primary/30 text-primary';
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-muted-foreground';
  };

  const getDeadlineColor = (days: number) => {
    if (days <= 7) return 'text-destructive bg-destructive/10 border-destructive/30';
    if (days <= 14) return 'text-warning bg-warning/10 border-warning/30';
    return 'text-success bg-success/10 border-success/30';
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'text-success';
      case 'Medium': return 'text-warning';
      case 'Hard': return 'text-destructive';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
      whileHover={{ scale: 1.02, y: -8 }}
      className="rounded-2xl glass-panel overflow-hidden cursor-pointer group holo-card"
    >
      {/* Header */}
      <div className={`p-4 bg-gradient-to-br ${getTypeColor(grant.type)} border-b border-border`}>
        <div className="flex items-center justify-between mb-2">
          <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-1 rounded-md bg-background/50 ${getTypeColor(grant.type).split(' ').pop()}`}>
            {grant.type}
          </span>
          <button className="p-1.5 rounded-lg hover:bg-background/50 transition-colors">
            <Bookmark className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <h3 className="font-semibold text-foreground line-clamp-2 min-h-[48px]">{grant.name}</h3>
        <p className="text-xs text-muted-foreground mt-1">{grant.organization}</p>
      </div>

      {/* Amount */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-success" />
          <span className="font-orbitron text-3xl font-bold text-foreground shimmer">
            ${grant.amount.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Match Score */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Match Score</span>
          <span className={`font-orbitron text-2xl font-bold ${getMatchColor(grant.matchScore)}`}>
            {grant.matchScore}%
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${grant.matchScore}%` }}
            transition={{ delay: 0.5 + index * 0.1, duration: 1 }}
            className="h-full bg-gradient-to-r from-warning via-success to-primary rounded-full"
          />
        </div>
        <div className="flex items-center justify-between mt-3 text-xs">
          <span className={getDifficultyColor(grant.difficulty)}>{grant.difficulty} Application</span>
          <span className="text-muted-foreground">{grant.approvalRate}% approval rate</span>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 border-b border-border">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getDeadlineColor(grant.deadline)}`}>
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">
            {grant.deadline <= 7 ? 'Due in ' : ''}{grant.deadline} days
          </span>
        </div>
        <div className="mt-3 space-y-1.5">
          {grant.requirements.map((req, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="text-success">✓</span>
              {req}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="p-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold flex items-center justify-center gap-2 group-hover:shadow-[0_0_30px_hsla(187,100%,50%,0.3)] transition-shadow"
        >
          Start Application
          <ExternalLink className="w-4 h-4" />
        </motion.button>
        <p className="text-xs text-center text-muted-foreground mt-2">~20 min to complete</p>
      </div>
    </motion.div>
  );
};

const GrantsSection = () => {
  const totalAvailable = grants.reduce((sum, g) => sum + g.amount, 0);

  return (
    <section className="mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-success/10">
            <DollarSign className="w-6 h-6 text-success" />
          </div>
          <div>
            <h2 className="font-orbitron text-xl font-bold text-foreground flex items-center gap-2">
              Grants & Funding
              <Sparkles className="w-5 h-5 text-warning animate-pulse" />
            </h2>
            <p className="text-sm text-muted-foreground">
              <span className="text-success font-semibold">${totalAvailable.toLocaleString()}</span> Available • {grants.length} Matches Found
            </p>
          </div>
        </div>
        <Link to="/grantpilot">
          <motion.button
            whileHover={{ x: 5 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-medium"
          >
            <Rocket className="w-4 h-4" />
            Open GrantPilot™
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </Link>
      </motion.div>

      {/* 3-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {grants.map((grant, index) => (
          <GrantCard key={grant.id} grant={grant} index={index} />
        ))}
        
        {/* Find More Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="rounded-2xl glass-panel flex flex-col items-center justify-center p-8 text-center cursor-pointer hover:border-primary/50 transition-colors group min-h-[400px]"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Star className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">Find More Grants</h3>
          <p className="text-sm text-muted-foreground mb-4">Let AI discover personalized funding opportunities</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2.5 rounded-xl border border-primary/50 text-primary hover:bg-primary/10 transition-colors"
          >
            Search Now
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default GrantsSection;
