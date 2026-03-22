import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Check, Building2, Users, Briefcase, DollarSign, FileText, Sparkles, Upload, AlertCircle } from 'lucide-react';

interface MasterProfileWizardProps {
  onClose: () => void;
  onComplete: (completion: number) => void;
}

interface StepData {
  companyName?: string;
  registrationNumber?: string;
  industry?: string;
  revenueRange?: string;
  employeeCount?: string;
  location?: string;
  founderName?: string;
  founderGender?: string;
  founderAge?: string;
  teamSize?: string;
  description?: string;
  targetMarket?: string;
  growthStage?: string;
  fundingNeeds?: string;
  useOfFunds?: string;
}

const steps = [
  { id: 'basics', title: 'Business Basics', icon: Building2, time: '2 min' },
  { id: 'founders', title: 'Founders & Team', icon: Users, time: '3 min' },
  { id: 'details', title: 'Business Details', icon: Briefcase, time: '4 min' },
  { id: 'financial', title: 'Financial Snapshot', icon: DollarSign, time: '3 min' },
  { id: 'documents', title: 'Documents Vault', icon: FileText, time: '5 min' },
];

const industries = [
  'Technology / Software',
  'Healthcare / Medical',
  'Manufacturing',
  'Retail / E-commerce',
  'Professional Services',
  'Food & Beverage',
  'Construction',
  'Clean Technology',
  'Creative / Media',
  'Education / Training',
  'Other',
];

const revenueRanges = [
  'Pre-revenue',
  '$1 - $50,000',
  '$50,001 - $250,000',
  '$250,001 - $500,000',
  '$500,001 - $1M',
  '$1M - $5M',
  '$5M+',
];

const employeeCounts = ['Just me', '2-5', '6-10', '11-25', '26-50', '50+'];

const growthStages = ['Idea Stage', 'MVP / Prototype', 'Early Revenue', 'Growth / Scaling', 'Established'];

const MasterProfileWizard = ({ onClose, onComplete }: MasterProfileWizardProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<StepData>({});
  const [direction, setDirection] = useState(1);

  const updateData = (key: keyof StepData, value: string) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setDirection(1);
      setCurrentStep(prev => prev + 1);
    } else {
      // Calculate completion percentage
      const filledFields = Object.values(data).filter(v => v).length;
      const completion = Math.min(95, Math.round((filledFields / 12) * 100) + 40);
      onComplete(completion);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(prev => prev - 1);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Business Basics
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Company Name</label>
              <input
                type="text"
                value={data.companyName || ''}
                onChange={(e) => updateData('companyName', e.target.value)}
                placeholder="Enter your company name"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Business Registration Number</label>
              <input
                type="text"
                value={data.registrationNumber || ''}
                onChange={(e) => updateData('registrationNumber', e.target.value)}
                placeholder="e.g., BN123456789"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Industry / Sector</label>
              <select
                value={data.industry || ''}
                onChange={(e) => updateData('industry', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              >
                <option value="">Select your industry</option>
                {industries.map(ind => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Location (City, Province)</label>
              <input
                type="text"
                value={data.location || ''}
                onChange={(e) => updateData('location', e.target.value)}
                placeholder="e.g., Toronto, Ontario"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>
          </div>
        );

      case 1: // Founders & Team
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Founder Name</label>
              <input
                type="text"
                value={data.founderName || ''}
                onChange={(e) => updateData('founderName', e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Gender (Optional)</label>
                <select
                  value={data.founderGender || ''}
                  onChange={(e) => updateData('founderGender', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                >
                  <option value="">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Age Range</label>
                <select
                  value={data.founderAge || ''}
                  onChange={(e) => updateData('founderAge', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                >
                  <option value="">Select age range</option>
                  <option value="18-25">18-25</option>
                  <option value="26-35">26-35</option>
                  <option value="36-45">36-45</option>
                  <option value="46-55">46-55</option>
                  <option value="55+">55+</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Team Size</label>
              <div className="grid grid-cols-3 gap-3">
                {employeeCounts.map(count => (
                  <button
                    key={count}
                    onClick={() => updateData('teamSize', count)}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                      data.teamSize === count
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary border-border text-foreground hover:border-primary/50'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2: // Business Details
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Business Description</label>
              <textarea
                value={data.description || ''}
                onChange={(e) => updateData('description', e.target.value)}
                placeholder="Describe what your business does..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI will help optimize this for grant applications
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Target Market</label>
              <input
                type="text"
                value={data.targetMarket || ''}
                onChange={(e) => updateData('targetMarket', e.target.value)}
                placeholder="e.g., Small businesses in Canada"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Growth Stage</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {growthStages.map(stage => (
                  <button
                    key={stage}
                    onClick={() => updateData('growthStage', stage)}
                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all ${
                      data.growthStage === stage
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-secondary border-border text-foreground hover:border-primary/50'
                    }`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 3: // Financial Snapshot
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Annual Revenue Range</label>
              <select
                value={data.revenueRange || ''}
                onChange={(e) => updateData('revenueRange', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              >
                <option value="">Select revenue range</option>
                {revenueRanges.map(range => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Funding Needs</label>
              <input
                type="text"
                value={data.fundingNeeds || ''}
                onChange={(e) => updateData('fundingNeeds', e.target.value)}
                placeholder="e.g., $25,000 - $100,000"
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">How Will Funds Be Used?</label>
              <textarea
                value={data.useOfFunds || ''}
                onChange={(e) => updateData('useOfFunds', e.target.value)}
                placeholder="e.g., Hiring, equipment, marketing..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
              />
            </div>
            <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
              <p className="text-sm text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Tip: Upload bank statements to increase your match rate by up to 20%</span>
              </p>
            </div>
          </div>
        );

      case 4: // Documents Vault
        return (
          <div className="space-y-4">
            {[
              { name: 'Business Registration Certificate', required: true },
              { name: 'Financial Statements', required: true },
              { name: 'Business Plan', required: false, hint: 'AI can generate one if missing' },
              { name: 'Pitch Deck', required: false },
              { name: 'Letters of Support', required: false },
            ].map((doc, i) => (
              <div
                key={i}
                className="p-4 rounded-xl bg-secondary border border-border hover:border-primary/30 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground flex items-center gap-2">
                      {doc.name}
                      {doc.required && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
                          Required
                        </span>
                      )}
                    </p>
                    {doc.hint && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-primary" />
                        {doc.hint}
                      </p>
                    )}
                  </div>
                  <button className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Upload className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <div className="p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer text-center">
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Drag & drop files here or <span className="text-primary">browse</span>
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl glass-panel border border-primary/20"
      >
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-orbitron font-bold text-lg text-foreground">Master Profile</h2>
                <p className="text-sm text-muted-foreground">One-time setup, unlock all grants</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2">
            {steps.map((step, i) => (
              <div key={step.id} className="flex-1 flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    i < currentStep
                      ? 'bg-success text-success-foreground'
                      : i === currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {i < currentStep ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded-full ${
                      i < currentStep ? 'bg-success' : 'bg-secondary'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              {(() => {
                const StepIcon = steps[currentStep].icon;
                return <StepIcon className="w-5 h-5 text-primary" />;
              })()}
              <h3 className="font-orbitron font-bold text-foreground">
                {steps[currentStep].title}
              </h3>
              <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                ~{steps[currentStep].time}
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'tween', duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex items-center justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Skip for now</span>
          </div>

          <button
            onClick={nextStep}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            {currentStep === steps.length - 1 ? 'Complete' : 'Continue'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MasterProfileWizard;
