import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, AlertCircle, Bookmark, ChevronRight, Sparkles } from 'lucide-react';
import { fetchRecommendedGrants, formatGrantAmount, grantDetailPath } from '@/lib/grants';
import { loadGrantProfile } from '@/lib/grantProfile';
import type { ScoredGrant } from '@/types/grant';

const GrantDiscovery = () => {
  const [grants, setGrants] = useState<ScoredGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const profile = loadGrantProfile();
        const list = await fetchRecommendedGrants(profile, 12);
        setGrants(list);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load grants');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const getTypeColor = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('federal')) return 'bg-primary/10 text-primary border-primary/30';
    if (t.includes('provincial')) return 'bg-success/10 text-success border-success/30';
    if (t.includes('municipal')) return 'bg-warning/10 text-warning border-warning/30';
    return 'bg-secondary text-foreground border-border';
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
          Featured Grants
          <span className="px-2 py-1 rounded-lg bg-primary/10 text-primary text-sm font-normal">
            {loading ? '…' : `${grants.length} programs`}
          </span>
        </h2>
      </div>

      {error && (
        <p className="text-sm text-muted-foreground mb-4 rounded-lg border border-border p-4">{error}</p>
      )}

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading verified Canadian programs…</p>
      ) : (
        <div className="-mx-4 flex gap-6 overflow-x-auto px-4 pb-2">
          {grants.map((grant, index) => (
            <motion.div
              key={grant.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="w-[340px] shrink-0"
            >
              <div className="h-full p-6 rounded-2xl glass-panel border border-border hover:border-primary/30 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(grant.type || '')}`}>
                    {grant.type || 'Program'}
                  </span>
                  <button type="button" className="p-2 rounded-lg hover:bg-secondary transition-colors" aria-label="Save">
                    <Bookmark className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                <h3 className="font-semibold text-foreground mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                  {grant.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{grant.organization}</p>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="font-orbitron text-2xl font-bold text-gradient shimmer">
                    {formatGrantAmount(Number(grant.amount))}
                  </span>
                  <span className="text-sm text-success font-medium">{grant.computedMatch}% match</span>
                </div>

                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{grant.description}</p>

                <div className="space-y-2 mb-4">
                  {grant.requirementsStatus.slice(0, 2).map((req, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      {req.met ? (
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-warning shrink-0" />
                      )}
                      <span className="line-clamp-1">{req.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-sm mb-4 py-3 border-t border-border">
                  <Clock className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-muted-foreground text-xs line-clamp-2">
                    {grant.deadline_label || `${grant.deadline_days} days`}
                  </span>
                </div>

                <Link
                  to={grantDetailPath(grant.id)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  View program
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 text-center"
      >
        <Link
          to="/grants"
          className="px-6 py-3 rounded-xl border border-primary/50 text-primary font-medium hover:bg-primary/10 transition-colors inline-flex items-center gap-2"
        >
          Browse all grants
          <ChevronRight className="w-4 h-4" />
        </Link>
      </motion.div>
    </motion.section>
  );
};

export default GrantDiscovery;
