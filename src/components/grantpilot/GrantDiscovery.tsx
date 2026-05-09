import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle2, AlertCircle, Bookmark, Share2, ChevronRight, Sparkles, DollarSign, ExternalLink } from 'lucide-react';

export interface Grant {
  id: string;
  name: string;
  organization: string;
  amount: number;
  deadline: string;
  type: 'federal' | 'provincial' | 'municipal' | 'industry';
  description: string;
  website: string;
}

const GrantDiscovery = () => {
  const grants: Grant[] = [
    {
      id: '1',
      name: 'Canada Digital Adoption Program (CDAP)',
      organization: 'Innovation Canada',
      amount: 15000,
      deadline: 'Rolling application',
      type: 'federal',
      description: 'Grants up to $15K to help small businesses adopt digital technologies and e-commerce.',
      website: 'https://innovation.isc.ca/',
    },
    {
      id: '2',
      name: 'Ontario Innovation Tax Credit',
      organization: 'Ontario Ministry of Finance',
      amount: 50000,
      deadline: 'Annual filing',
      type: 'provincial',
      description: 'Tax credit for Ontario businesses conducting SR&ED eligible research and development.',
      website: 'https://www.ontario.ca/',
    },
    {
      id: '3',
      name: 'Toronto Business Improvement Grant',
      organization: 'City of Toronto',
      amount: 10000,
      deadline: 'Quarterly',
      type: 'municipal',
      description: 'Funding for Toronto businesses undertaking physical improvements to their premises.',
      website: 'https://www.toronto.ca/',
    },
    {
      id: '4',
      name: 'NRC-IRAP Funding',
      organization: 'National Research Council',
      amount: 75000,
      deadline: 'Ongoing',
      type: 'federal',
      description: 'R&D funding for innovative SMEs developing new technologies and processes.',
      website: 'https://nrc.canada.ca/',
    },
    {
      id: '5',
      name: 'Women Entrepreneurship Fund',
      organization: 'Women Entrepreneurship Strategy',
      amount: 100000,
      deadline: 'Annual intake',
      type: 'industry',
      description: 'Funding for women-owned and women-led businesses across Canada.',
      website: 'https://www.ic.gc.ca/',
    },
    {
      id: '6',
      name: 'Clean Technology Fund',
      organization: 'Natural Resources Canada',
      amount: 75000,
      deadline: 'Multiple intakes',
      type: 'industry',
      description: 'Support for clean technology development and commercialization.',
      website: 'https://www.nrcan.gc.ca/',
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
      case 'industry':
        return 'bg-accent/10 text-accent border-accent/30';
      default:
        return 'bg-secondary text-foreground border-border';
    }
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
            {grants.length} programs
          </span>
        </h2>
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
            <div className="h-full p-6 rounded-2xl glass-panel border border-border hover:border-primary/30 transition-all group">
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

              {/* Description */}
              <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                {grant.description}
              </p>

              {/* Deadline */}
              <div className="flex items-center gap-2 text-sm mb-4 py-3 border-t border-border">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">{grant.deadline}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <a
                  href={grant.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Learn More
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View All */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 text-center"
      >
        <button className="px-6 py-3 rounded-xl border border-primary/50 text-primary font-medium hover:bg-primary/10 transition-colors inline-flex items-center gap-2">
          View All Grants
          <ChevronRight className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.section>
  );
};

export default GrantDiscovery;
