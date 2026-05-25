import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Crown, Check, ChevronRight, Sparkles, Shield, Clock, Users, Star, ArrowRight, FileText } from 'lucide-react';
import ApplicationWizard from './ApplicationWizard';
import { getPackageCheckoutUrl, getPackageRequestMailto } from '@/lib/grantPackages';
import { supabase } from '@/integrations/supabase/client';

interface Grant {
  id: string;
  name: string;
  organization: string;
  amount: number;
  matchScore: number;
  deadline: number;
  readyPercentage: number;
  approvalRate: number;
  type: 'federal' | 'provincial' | 'municipal';
  requirements: { label: string; met: boolean; }[];
  timeToComplete: string;
}

interface ApplyForMeModalProps {
  grant: Grant;
  onClose: () => void;
}

type ApplicationMode = 'assisted' | 'guided' | 'fullservice';

const modes = [
  {
    id: 'assisted' as ApplicationMode,
    name: 'Assisted Mode',
    icon: Zap,
    price: 'FREE',
    priceNote: 'First 3 applications',
    color: 'success',
    popular: false,
    features: [
      'Pre-fills basic information',
      'Provides templates for complex questions',
      'Checks for errors before submission',
      'You review and submit manually',
    ],
    cta: 'Start Application',
  },
  {
    id: 'guided' as ApplicationMode,
    name: 'Guided Mode',
    icon: FileText,
    price: 'From $1,000',
    priceNote: 'member package',
    color: 'primary',
    popular: true,
    features: [
      'Everything in Assisted mode',
      'RTM advisor draft review for narratives',
      'Expert review before submission',
      'Priority support',
      'You approve final version',
    ],
    cta: 'Request True North package',
  },
  {
    id: 'fullservice' as ApplicationMode,
    name: 'Full Service',
    icon: Crown,
    price: 'From $3,250',
    priceNote: 'member package',
    color: 'warning',
    popular: false,
    features: [
      'RTM advisor coordination',
      'Professional grant writer review',
      'Clear scope and review process',
      'Follow-up with grantor if needed',
    ],
    cta: 'Request Northern Star package',
  },
];

const ApplyForMeModal = ({ grant, onClose }: ApplyForMeModalProps) => {
  const [selectedMode, setSelectedMode] = useState<ApplicationMode | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  const getColorClasses = (color: string, isSelected: boolean) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      success: {
        bg: isSelected ? 'bg-success/20' : 'bg-success/5',
        border: isSelected ? 'border-success' : 'border-success/30',
        text: 'text-success',
      },
      primary: {
        bg: isSelected ? 'bg-primary/20' : 'bg-primary/5',
        border: isSelected ? 'border-primary' : 'border-primary/30',
        text: 'text-primary',
      },
      warning: {
        bg: isSelected ? 'bg-warning/20' : 'bg-warning/5',
        border: isSelected ? 'border-warning' : 'border-warning/30',
        text: 'text-warning',
      },
    };
    return colors[color] || colors.primary;
  };

  const handleContinue = async () => {
    if (!selectedMode) return;
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    const handoff =
      session?.access_token && session.refresh_token
        ? { access_token: session.access_token, refresh_token: session.refresh_token }
        : null;
    if (selectedMode === 'fullservice') {
      window.location.href = getPackageCheckoutUrl('northern-star', handoff);
      return;
    }
    if (selectedMode === 'guided') {
      window.location.href = getPackageCheckoutUrl('true-north-standard', handoff);
      return;
    }
    setShowWizard(true);
  };

  if (showWizard && selectedMode) {
    return (
      <ApplicationWizard 
        grant={grant} 
        mode={selectedMode} 
        onClose={onClose}
        onBack={() => setShowWizard(false)}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl glass-panel border border-primary/20"
      >
        <div className="sticky top-0 z-10 p-6 border-b border-border glass-panel rounded-t-3xl">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-6 h-6 text-primary" />
                <h2 className="font-orbitron font-bold text-xl text-foreground">Apply with RTM support</h2>
              </div>
              <p className="text-muted-foreground text-sm">
                Choose how you want to apply for <span className="text-foreground font-medium">{grant.name}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="flex items-center gap-4 mt-4 p-3 rounded-xl bg-secondary/50">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-orbitron font-bold text-gradient">
                ${grant.amount.toLocaleString()}
              </span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{grant.deadline} days left</span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-2 text-sm">
              <Star className="w-4 h-4 text-warning" />
              <span className="text-muted-foreground">{grant.matchScore}% profile match</span>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4 text-success" />
              <span className="text-muted-foreground">{grant.approvalRate}% approval rate</span>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {modes.map((mode) => {
              const isSelected = selectedMode === mode.id;
              const colors = getColorClasses(mode.color, isSelected);
              const Icon = mode.icon;

              return (
                <motion.button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-6 rounded-2xl border-2 text-left transition-all ${colors.bg} ${colors.border} ${
                    isSelected ? 'ring-2 ring-offset-2 ring-offset-background' : ''
                  } ${isSelected ? `ring-${mode.color}` : ''}`}
                >
                  {mode.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      Most Popular
                    </div>
                  )}

                  <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected ? `${colors.border} ${colors.bg}` : 'border-border'
                  }`}>
                    {isSelected && <Check className={`w-4 h-4 ${colors.text}`} />}
                  </div>

                  <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${colors.text}`} />
                  </div>

                  <h3 className="font-semibold text-foreground mb-1">{mode.name}</h3>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className={`text-2xl font-bold ${colors.text}`}>{mode.price}</span>
                    <span className="text-xs text-muted-foreground">{mode.priceNote}</span>
                  </div>

                  <ul className="space-y-2">
                    {mode.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className={`w-4 h-4 ${colors.text} flex-shrink-0 mt-0.5`} />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </motion.button>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: selectedMode ? 1 : 0.5, y: 0 }}
            className="mt-6"
          >
            <button
              onClick={handleContinue}
              disabled={!selectedMode}
              className={`w-full py-4 rounded-2xl font-medium text-lg flex items-center justify-center gap-3 transition-all ${
                selectedMode
                  ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:shadow-lg hover:shadow-primary/25'
                  : 'bg-secondary text-muted-foreground cursor-not-allowed'
              }`}
            >
              {selectedMode ? (
                <>
                  <Sparkles className="w-5 h-5" />
                  {modes.find(m => m.id === selectedMode)?.cta}
                  <ArrowRight className="w-5 h-5" />
                </>
              ) : (
                'Select a mode to continue'
              )}
            </button>
          </motion.div>

          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Secure & Encrypted</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Advisor-supported applications</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span>Verified Canadian programs</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ApplyForMeModal;
