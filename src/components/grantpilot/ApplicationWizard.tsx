import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ChevronLeft, ChevronRight, Check, FileText, Sparkles, Eye, Send, 
  FileText, Building2, DollarSign, Target, AlertCircle, CheckCircle2,
  Wand2, RefreshCw, Copy, Loader2
} from 'lucide-react';
import ApplicationStrengthAnalyzer from './ApplicationStrengthAnalyzer';
import {
  generateGrantIntakeDraft,
  WIZARD_FIELD_TO_DRAFT_KEY,
} from '@/services/grantIntakeAssistant';
import { countRecentAiDrafts, MAX_DRAFTS_PER_HOUR } from '@/services/grantIntake';

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

type ApplicationMode = 'assisted' | 'guided' | 'fullservice';

interface ApplicationWizardProps {
  grant: Grant;
  mode: ApplicationMode;
  onClose: () => void;
  onBack: () => void;
  /** Real grant intake id from grant_intakes — enables OpenRouter drafts */
  intakeId?: string;
  grantDbId?: string;
}

interface FormSection {
  id: string;
  title: string;
  icon: React.ElementType;
  fields: FormField[];
}

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'file';
  placeholder?: string;
  required?: boolean;
  prefilled?: boolean;
  prefilledValue?: string;
  advisorDraft?: string;
  options?: string[];
  hint?: string;
}

const formSections: FormSection[] = [
  {
    id: 'organization',
    title: 'Organization Details',
    icon: Building2,
    fields: [
      { id: 'companyName', label: 'Legal Business Name', type: 'text', required: true, prefilled: true, prefilledValue: 'TechStart Solutions Inc.' },
      { id: 'businessNumber', label: 'Business Registration Number', type: 'text', required: true, prefilled: true, prefilledValue: 'BN123456789RC0001' },
      { id: 'address', label: 'Business Address', type: 'text', required: true, prefilled: true, prefilledValue: '123 Innovation Drive, Toronto, ON M5V 2K7' },
      { id: 'phone', label: 'Contact Phone', type: 'text', required: true, prefilled: true, prefilledValue: '(416) 555-0123' },
      { id: 'email', label: 'Contact Email', type: 'text', required: true, prefilled: true, prefilledValue: 'grants@techstart.ca' },
      { id: 'website', label: 'Website URL', type: 'text', prefilled: true, prefilledValue: 'https://techstart.ca' },
    ],
  },
  {
    id: 'project',
    title: 'Project Description',
    icon: Target,
    fields: [
      { 
        id: 'projectTitle', 
        label: 'Project Title', 
        type: 'text', 
        required: true,
        placeholder: 'Enter a compelling project title',
        advisorDraft: 'Digital Transformation Initiative for Canadian SMEs',
      },
      { 
        id: 'projectSummary', 
        label: 'Project Summary (250 words max)', 
        type: 'textarea', 
        required: true,
        placeholder: 'Describe your project...',
        advisorDraft: `Our project aims to develop an innovative platform that enables Canadian small and medium enterprises (SMEs) to accelerate their digital transformation journey. 

The platform will provide automated business process analysis, personalized technology recommendations, and guided implementation support. By leveraging machine learning algorithms trained on successful digital transformation case studies, we will help businesses identify the most impactful digital solutions for their specific needs.

Key objectives include:
• Reducing digital adoption barriers for 500+ Canadian SMEs
• Increasing operational efficiency by an average of 35%
• Creating 25 new high-skilled technology jobs
• Contributing to Canada's digital economy competitiveness

This initiative aligns directly with the government's commitment to supporting business innovation and digital adoption across the country.`,
      },
      { 
        id: 'objectives', 
        label: 'Project Objectives', 
        type: 'textarea', 
        required: true,
        placeholder: 'List your specific, measurable objectives...',
        advisorDraft: `1. Deploy a diagnostic tool to 500 Canadian SMEs within 18 months
2. Achieve 35% average improvement in operational efficiency for participating businesses
3. Create 25 new full-time technology positions
4. Develop partnerships with 10 technology vendors for integrated solutions
5. Publish research findings on SME digital transformation best practices`,
      },
    ],
  },
  {
    id: 'financials',
    title: 'Financial Information',
    icon: DollarSign,
    fields: [
      { id: 'totalBudget', label: 'Total Project Budget', type: 'number', required: true, prefilled: true, prefilledValue: '75000' },
      { id: 'requestedAmount', label: 'Grant Amount Requested', type: 'number', required: true, prefilled: true, prefilledValue: '15000' },
      { id: 'matchingFunds', label: 'Matching Funds Available', type: 'number', prefilled: true, prefilledValue: '60000' },
      { 
        id: 'budgetBreakdown', 
        label: 'Budget Breakdown', 
        type: 'textarea', 
        required: true,
        advisorDraft: `Personnel Costs: $35,000
• Lead Developer (0.5 FTE x 12 months): $25,000
• Project Manager (0.25 FTE x 12 months): $10,000

Technology & Software: $20,000
• Cloud Infrastructure: $8,000
• Platform licensing: $7,000
• Development Tools: $5,000

Marketing & Outreach: $10,000
• Digital Marketing: $6,000
• Industry Events: $4,000

Professional Services: $10,000
• Legal & Compliance: $5,000
• External Consultants: $5,000

Total: $75,000`,
      },
    ],
  },
  {
    id: 'documents',
    title: 'Supporting Documents',
    icon: FileText,
    fields: [
      { id: 'businessPlan', label: 'Business Plan', type: 'file', required: true, hint: 'PDF, max 10MB', prefilled: true, prefilledValue: 'business_plan_2024.pdf' },
      { id: 'financialStatements', label: 'Financial Statements', type: 'file', required: true, hint: 'Last 2 fiscal years', prefilled: true, prefilledValue: 'financial_statements.pdf' },
      { id: 'projectTimeline', label: 'Project Timeline', type: 'file', hint: 'Gantt chart or milestone document' },
      { id: 'lettersSupport', label: 'Letters of Support', type: 'file', hint: 'From partners or clients' },
    ],
  },
];

const ApplicationWizard = ({ grant, mode, onClose, onBack, intakeId, grantDbId }: ApplicationWizardProps) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [isApplyingDraft, setIsApplyingDraft] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [advisorPreparedFields, setAdvisorPreparedFields] = useState<Set<string>>(new Set());

  // Initialize with prefilled values
  useEffect(() => {
    const initialData: Record<string, string> = {};
    formSections.forEach(section => {
      section.fields.forEach(field => {
        if (field.prefilled && field.prefilledValue) {
          initialData[field.id] = field.prefilledValue;
        }
      });
    });
    setFormData(initialData);
  }, []);

  const currentFields = formSections[currentSection];
  const progress = ((currentSection + 1) / formSections.length) * 100;

  const updateField = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const applyAdvisorDraft = async (fieldId: string, draft: string) => {
    setIsApplyingDraft(fieldId);
    setDraftError(null);

    const draftFieldKey = WIZARD_FIELD_TO_DRAFT_KEY[fieldId];
    if (intakeId && draftFieldKey) {
      const used = await countRecentAiDrafts(intakeId);
      if (used >= MAX_DRAFTS_PER_HOUR) {
        setDraftError(`Draft limit reached (${MAX_DRAFTS_PER_HOUR}/hour).`);
        setIsApplyingDraft(null);
        return;
      }
      const { result, error } = await generateGrantIntakeDraft(
        intakeId,
        draftFieldKey,
        grantDbId ?? grant.id,
      );
      if (error) {
        setDraftError(error);
        setIsApplyingDraft(null);
        return;
      }
      updateField(fieldId, result?.draft ?? draft);
    } else {
      await new Promise((resolve) => setTimeout(resolve, 400));
      updateField(fieldId, draft);
    }

    setAdvisorPreparedFields((prev) => new Set([...prev, fieldId]));
    setIsApplyingDraft(null);
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'assisted': return { label: 'Assisted', color: 'text-success', bg: 'bg-success/10' };
      case 'guided': return { label: 'Guided', color: 'text-primary', bg: 'bg-primary/10' };
      case 'fullservice': return { label: 'Full Service', color: 'text-warning', bg: 'bg-warning/10' };
    }
  };

  const modeInfo = getModeLabel();

  const getFilledPercentage = () => {
    const allFields = formSections.flatMap(s => s.fields);
    const filledCount = allFields.filter(f => formData[f.id]).length;
    return Math.round((filledCount / allFields.length) * 100);
  };

  if (showPreview) {
    return (
      <ApplicationPreview 
        grant={grant}
        formData={formData}
        onBack={() => setShowPreview(false)}
        onSubmit={onClose}
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
        className="w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-3xl glass-panel border border-primary/20 flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-muted-foreground" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-orbitron font-bold text-lg text-foreground">
                    Application Wizard
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${modeInfo.color} ${modeInfo.bg}`}>
                    {modeInfo.label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{grant.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Step {currentSection + 1} of {formSections.length}: {currentFields.title}
              </span>
              <span className="text-primary font-medium">{getFilledPercentage()}% complete</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-primary to-success rounded-full"
              />
            </div>
            {/* Section Indicators */}
            <div className="flex gap-2 mt-3">
              {formSections.map((section, i) => {
                const Icon = section.icon;
                const isComplete = i < currentSection;
                const isCurrent = i === currentSection;
                return (
                  <button
                    key={section.id}
                    onClick={() => setCurrentSection(i)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isCurrent 
                        ? 'bg-primary text-primary-foreground' 
                        : isComplete 
                          ? 'bg-success/10 text-success'
                          : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                    }`}
                  >
                    {isComplete ? <Check className="w-3 h-3" /> : <Icon className="w-3 h-3" />}
                    <span className="hidden sm:inline">{section.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {draftError && (
            <p className="mb-4 text-sm text-destructive">{draftError}</p>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form Fields */}
            <div className="lg:col-span-2 space-y-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {currentFields.fields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                        {field.label}
                        {field.required && <span className="text-destructive">*</span>}
                        {field.prefilled && (
                          <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-xs">
                            Pre-filled
                          </span>
                        )}
                        {advisorPreparedFields.has(field.id) && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Advisor-prepared
                          </span>
                        )}
                      </label>

                      {field.type === 'textarea' ? (
                        <div className="relative">
                          <textarea
                            value={formData[field.id] || ''}
                            onChange={(e) => updateField(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            rows={6}
                            className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors resize-none"
                          />
                          {(mode === 'guided' || mode === 'fullservice') && field.advisorDraft && !formData[field.id] && (
                            <button
                              onClick={() => applyAdvisorDraft(field.id, field.advisorDraft!)}
                              disabled={isApplyingDraft === field.id}
                              className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium flex items-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                              {isApplyingDraft === field.id ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Applying draft…
                                </>
                              ) : (
                                <>
                                  <Wand2 className="w-3 h-3" />
                                  Use advisor draft
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      ) : field.type === 'file' ? (
                        <div className={`p-4 rounded-xl border-2 border-dashed transition-colors ${
                          formData[field.id] 
                            ? 'border-success/50 bg-success/5' 
                            : 'border-border hover:border-primary/50'
                        }`}>
                          {formData[field.id] ? (
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-success" />
                                <span className="text-sm text-foreground">{formData[field.id]}</span>
                              </div>
                              <button 
                                onClick={() => updateField(field.id, '')}
                                className="text-xs text-muted-foreground hover:text-destructive"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="text-center">
                              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">
                                Drag & drop or <span className="text-primary cursor-pointer">browse</span>
                              </p>
                              {field.hint && (
                                <p className="text-xs text-muted-foreground mt-1">{field.hint}</p>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          value={formData[field.id] || ''}
                          onChange={(e) => updateField(field.id, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full px-4 py-3 rounded-xl bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                        />
                      )}

                      {field.hint && field.type !== 'file' && (
                        <p className="text-xs text-muted-foreground">{field.hint}</p>
                      )}

                      {(mode === 'guided' || mode === 'fullservice') && field.advisorDraft && formData[field.id] && advisorPreparedFields.has(field.id) && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
                          <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                          <p className="text-xs text-muted-foreground flex-1">
                            Advisor-prepared draft. Review and edit before you submit.
                          </p>
                          <button 
                            onClick={() => applyAdvisorDraft(field.id, field.advisorDraft!)}
                            className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"
                            type="button"
                          >
                            <RefreshCw className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Strength Analyzer Sidebar */}
            <div className="hidden lg:block">
              <ApplicationStrengthAnalyzer 
                formData={formData}
                sections={formSections}
                mode={mode}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex-shrink-0 flex items-center justify-between">
          <button
            onClick={() => currentSection > 0 && setCurrentSection(prev => prev - 1)}
            disabled={currentSection === 0}
            className="px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPreview(true)}
              className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview
            </button>

            {currentSection < formSections.length - 1 ? (
              <button
                onClick={() => setCurrentSection(prev => prev + 1)}
                className="px-6 py-2 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowPreview(true)}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-success text-primary-foreground font-medium hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Review & Submit
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Application Preview Component
interface ApplicationPreviewProps {
  grant: Grant;
  formData: Record<string, string>;
  onBack: () => void;
  onSubmit: () => void;
}

const ApplicationPreview = ({ grant, formData, onBack, onSubmit }: ApplicationPreviewProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    onSubmit();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl glass-panel border border-primary/20 flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <div>
              <h2 className="font-orbitron font-bold text-lg text-foreground">Application Preview</h2>
              <p className="text-sm text-muted-foreground">Review your application before submitting</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/10 text-success text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Ready to Submit
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {formSections.map((section) => (
              <div key={section.id} className="p-6 rounded-2xl bg-secondary/50 border border-border">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <section.icon className="w-5 h-5 text-primary" />
                  {section.title}
                </h3>
                <div className="space-y-4">
                  {section.fields.map((field) => (
                    <div key={field.id} className="grid grid-cols-3 gap-4">
                      <span className="text-sm text-muted-foreground">{field.label}</span>
                      <span className="col-span-2 text-sm text-foreground whitespace-pre-wrap">
                        {formData[field.id] || <span className="text-muted-foreground italic">Not provided</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex items-center justify-between">
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Edit Application
          </button>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-success text-primary-foreground font-medium text-lg hover:shadow-lg hover:shadow-primary/25 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Application
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ApplicationWizard;
