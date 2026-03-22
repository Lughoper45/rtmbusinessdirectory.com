import { motion } from 'framer-motion';
import { Target, FileCheck, Clock, Trophy, ChevronRight } from 'lucide-react';

interface PipelineStage {
  id: string;
  label: string;
  count: number;
  value?: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const GrantPipeline = () => {
  const stages: PipelineStage[] = [
    {
      id: 'matched',
      label: 'Matched',
      count: 23,
      icon: <Target className="w-5 h-5" />,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/30',
    },
    {
      id: 'ready',
      label: 'Ready to Apply',
      count: 3,
      icon: <FileCheck className="w-5 h-5" />,
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/30',
    },
    {
      id: 'pending',
      label: 'Pending Review',
      count: 5,
      icon: <Clock className="w-5 h-5" />,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/30',
    },
    {
      id: 'won',
      label: 'Won',
      count: 2,
      value: '$31,500',
      icon: <Trophy className="w-5 h-5" />,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/30',
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
          Grant Pipeline
        </h2>
        <button className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
          View Details
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map((stage, index) => (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            whileHover={{ scale: 1.02, y: -4 }}
            className={`relative p-6 rounded-2xl glass-panel border ${stage.borderColor} cursor-pointer group overflow-hidden`}
          >
            {/* Background Glow on Hover */}
            <div className={`absolute inset-0 ${stage.bgColor} opacity-0 group-hover:opacity-100 transition-opacity`} />

            <div className="relative z-10">
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl ${stage.bgColor} flex items-center justify-center mb-4 ${stage.color} group-hover:scale-110 transition-transform`}>
                {stage.icon}
              </div>

              {/* Count */}
              <div className="flex items-baseline gap-2 mb-1">
                <span className={`font-orbitron text-4xl font-bold ${stage.color}`}>
                  {stage.value || stage.count}
                </span>
                {!stage.value && (
                  <span className="text-sm text-muted-foreground">grants</span>
                )}
              </div>

              {/* Label */}
              <p className="text-sm text-muted-foreground">{stage.label}</p>
            </div>

            {/* Arrow Connector (except last) */}
            {index < stages.length - 1 && (
              <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20">
                <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center">
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 flex flex-wrap gap-3"
      >
        <button className="px-4 py-2 rounded-xl bg-success/10 border border-success/30 text-success text-sm font-medium hover:bg-success/20 transition-colors flex items-center gap-2">
          <FileCheck className="w-4 h-4" />
          Apply to 3 Ready Grants
        </button>
        <button className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/30 text-primary text-sm font-medium hover:bg-primary/20 transition-colors flex items-center gap-2">
          <Target className="w-4 h-4" />
          View All Matches
        </button>
      </motion.div>
    </motion.section>
  );
};

export default GrantPipeline;
