import { motion } from 'framer-motion';
import { Target, FileCheck, Clock, Trophy, Building2, Lightbulb, TrendingUp, Handshake } from 'lucide-react';

interface GrantCategory {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  examples: string;
}

const GrantPipeline = () => {
  const categories: GrantCategory[] = [
    {
      id: 'federal',
      label: 'Federal Grants',
      description: 'Nationwide programs from federal departments and agencies',
      icon: <Building2 className="w-5 h-5" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
      examples: 'CDAP, NRC-IRAP, SR&ED',
    },
    {
      id: 'provincial',
      label: 'Provincial Grants',
      description: 'Region-specific funding from your province',
      icon: <Lightbulb className="w-5 h-5" />,
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/30',
      examples: 'Ontario Innovation Tax Credit, BC Tech Fund',
    },
    {
      id: 'municipal',
      label: 'Municipal Grants',
      description: 'Local business improvement programs',
      icon: <Handshake className="w-5 h-5" />,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/30',
      examples: 'Toronto Business Improvement, Vancouver Grants',
    },
    {
      id: 'industry',
      label: 'Industry-Specific',
      description: 'Sector-targeted funding opportunities',
      icon: <TrendingUp className="w-5 h-5" />,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/30',
      examples: 'CleanTech, Women Entrepreneurship, Agri-Food',
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-orbitron text-xl font-bold text-foreground flex items-center gap-3">
          <span className="text-2xl">📊</span>
          Grants by Level
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat, index) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.02, y: -4 }}
            className="relative p-6 rounded-2xl glass-panel border border-border hover:border-primary/30 cursor-pointer group overflow-hidden"
          >
            <div className={`absolute inset-0 ${cat.bgColor} opacity-0 group-hover:opacity-100 transition-opacity`} />

            <div className="relative z-10">
              <div className={`w-12 h-12 rounded-xl ${cat.bgColor} flex items-center justify-center mb-4 ${cat.color} group-hover:scale-110 transition-transform`}>
                {cat.icon}
              </div>

              <h3 className={`font-orbitron text-lg font-bold ${cat.color} mb-2`}>
                {cat.label}
              </h3>

              <p className="text-sm text-muted-foreground mb-3">
                {cat.description}
              </p>

              <p className="text-xs text-muted-foreground/60 italic">
                {cat.examples}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default GrantPipeline;
