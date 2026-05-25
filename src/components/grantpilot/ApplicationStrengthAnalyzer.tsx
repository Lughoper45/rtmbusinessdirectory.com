import { motion } from 'framer-motion';
import { 
  TrendingUp, FileText, CheckCircle2, Target, AlertTriangle, 
  Sparkles, Trophy, Zap, Shield
} from 'lucide-react';

interface FormSection {
  id: string;
  title: string;
  icon: React.ElementType;
  fields: {
    id: string;
    label: string;
    type: string;
    required?: boolean;
    prefilled?: boolean;
    prefilledValue?: string;
  }[];
}

interface ApplicationStrengthAnalyzerProps {
  formData: Record<string, string>;
  sections: FormSection[];
  mode: 'assisted' | 'guided' | 'fullservice';
}

const ApplicationStrengthAnalyzer = ({ formData, sections, mode }: ApplicationStrengthAnalyzerProps) => {
  // Calculate scores
  const allFields = sections.flatMap(s => s.fields);
  const requiredFields = allFields.filter(f => f.required);
  const filledRequired = requiredFields.filter(f => formData[f.id]).length;
  const filledTotal = allFields.filter(f => formData[f.id]).length;

  const completenessScore = Math.round((filledTotal / allFields.length) * 100);
  const requiredCompleteness = Math.round((filledRequired / requiredFields.length) * 100);

  // Content quality based on text length for textareas
  const textareaFields = allFields.filter(f => f.type === 'textarea');
  const textareaQuality = textareaFields.reduce((acc, field) => {
    const value = formData[field.id] || '';
    if (value.length > 500) return acc + 100;
    if (value.length > 200) return acc + 75;
    if (value.length > 50) return acc + 50;
    return acc + (value.length > 0 ? 25 : 0);
  }, 0) / (textareaFields.length || 1);

  // Document score
  const fileFields = allFields.filter(f => f.type === 'file');
  const filledFiles = fileFields.filter(f => formData[f.id]).length;
  const documentScore = Math.round((filledFiles / (fileFields.length || 1)) * 100);

  // Competitiveness based on mode
  const modeBonus = mode === 'fullservice' ? 20 : mode === 'guided' ? 10 : 0;
  const competitivenessScore = Math.min(100, Math.round((completenessScore * 0.4 + textareaQuality * 0.4 + documentScore * 0.2) + modeBonus));

  // Overall score
  const overallScore = Math.round((completenessScore * 0.3 + textareaQuality * 0.3 + documentScore * 0.2 + competitivenessScore * 0.2));

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return 'from-success to-primary';
    if (score >= 60) return 'from-warning to-success';
    return 'from-destructive to-warning';
  };

  const getOverallLabel = (score: number) => {
    if (score >= 85) return { label: 'Excellent Application', color: 'text-success' };
    if (score >= 70) return { label: 'Strong Application', color: 'text-success' };
    if (score >= 50) return { label: 'Good Application', color: 'text-warning' };
    return { label: 'Needs Improvement', color: 'text-destructive' };
  };

  const metrics = [
    { label: 'Content Quality', score: Math.round(textareaQuality), icon: FileText },
    { label: 'Completeness', score: completenessScore, icon: CheckCircle2 },
    { label: 'Document Quality', score: documentScore, icon: Shield },
    { label: 'Competitiveness', score: competitivenessScore, icon: Trophy },
  ];

  const quickWins = [
    completenessScore < 100 && 'Complete all required fields',
    textareaQuality < 60 && 'Add more detail to narrative sections',
    documentScore < 80 && 'Upload all supporting documents',
    mode === 'assisted' && 'Upgrade to Guided mode for RTM advisor draft review',
  ].filter(Boolean);

  const overallInfo = getOverallLabel(overallScore);

  return (
    <div className="sticky top-6 space-y-4">
      {/* Overall Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl glass-panel border border-primary/20"
      >
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-3">
            <TrendingUp className="w-4 h-4" />
            Application Strength
          </div>
          <div className={`text-5xl font-orbitron font-bold ${getScoreColor(overallScore)}`}>
            {overallScore}
            <span className="text-2xl text-muted-foreground">/100</span>
          </div>
          <p className={`text-sm font-medium mt-1 ${overallInfo.color}`}>
            {overallInfo.label}
          </p>
        </div>

        {/* Circular Progress */}
        <div className="relative w-32 h-32 mx-auto mb-6">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-secondary"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDasharray: '0 352' }}
              animate={{ strokeDasharray: `${(overallScore / 100) * 352} 352` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--success))" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Target className={`w-8 h-8 ${getScoreColor(overallScore)}`} />
          </div>
        </div>

        {/* Individual Metrics */}
        <div className="space-y-4">
          {metrics.map((metric, i) => {
            const Icon = metric.icon;
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Icon className="w-4 h-4" />
                    {metric.label}
                  </div>
                  <span className={`font-medium ${getScoreColor(metric.score)}`}>
                    {metric.score}/100
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.score}%` }}
                    transition={{ delay: 0.2 * i, duration: 0.5 }}
                    className={`h-full rounded-full bg-gradient-to-r ${getScoreGradient(metric.score)}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-2xl bg-warning/5 border border-warning/20"
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-warning" />
            <span className="font-medium text-sm text-foreground">Quick Wins to Improve</span>
          </div>
          <ul className="space-y-2">
            {quickWins.map((win, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                {win}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Advisor tip */}
      {mode !== 'fullservice' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-2xl bg-primary/5 border border-primary/20"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <motion.div>
              <p className="text-sm font-medium text-foreground mb-1">Advisor tip</p>
              <p className="text-xs text-muted-foreground">
                Applications with detailed project descriptions and clear objectives have a 47% higher approval rate.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ApplicationStrengthAnalyzer;
