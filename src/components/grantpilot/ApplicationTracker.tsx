import { motion } from "framer-motion";
import { 
  FileText, Search, ClipboardCheck, Send, Clock, 
  CheckCircle, AlertCircle, ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface Step {
  phase: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  tips: string[];
  duration: string;
}

const steps: Step[] = [
  {
    phase: "Phase 1",
    icon: <Search className="w-6 h-6" />,
    title: "Find Matching Grants",
    description: "Identify grant programs that align with your business type, industry, and growth stage.",
    tips: [
      "Check federal, provincial, and municipal levels",
      "Look for industry-specific programs",
      "Note eligibility criteria carefully",
    ],
    duration: "1-2 weeks",
  },
  {
    phase: "Phase 2",
    icon: <ClipboardCheck className="w-6 h-6" />,
    title: "Prepare Documentation",
    description: "Gather the required documents — most grants need business plans, financials, and project details.",
    tips: [
      "Prepare a current business plan",
      "Have 2-3 years of financial statements ready",
      "Draft a clear project proposal",
    ],
    duration: "2-4 weeks",
  },
  {
    phase: "Phase 3",
    icon: <Send className="w-6 h-6" />,
    title: "Submit Application",
    description: "Complete the application forms and submit before the deadline.",
    tips: [
      "Review requirements multiple times",
      "Get a second set of eyes on your application",
      "Submit early to avoid last-minute issues",
    ],
    duration: "1-2 weeks",
  },
  {
    phase: "Phase 4",
    icon: <Clock className="w-6 h-6" />,
    title: "Follow Up",
    description: "Track your application status and respond promptly to any requests for more information.",
    tips: [
      "Keep copies of everything you submit",
      "Note expected decision dates",
      "Respond quickly to follow-up requests",
    ],
    duration: "4-12 weeks",
  },
];

export const ApplicationTracker = () => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-orbitron font-bold text-foreground flex items-center gap-3">
            <FileText className="w-7 h-7 text-primary" />
            How to Apply for Grants
          </h2>
          <p className="text-muted-foreground mt-1">
            A step-by-step guide to navigating the Canadian grant application process
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-4 rounded-xl border border-green-500/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">3</p>
              <p className="text-xs text-muted-foreground">Government Levels</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-4 rounded-xl border border-primary/20"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">50+</p>
              <p className="text-xs text-muted-foreground">Grant Programs</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-panel p-4 rounded-xl border border-border/30"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">Rules</p>
              <p className="text-xs text-muted-foreground">Vary by Program</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-panel p-4 rounded-xl border border-border/30"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">4</p>
              <p className="text-xs text-muted-foreground">Simple Steps</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Process Steps */}
      <div className="grid md:grid-cols-2 gap-6">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-panel rounded-xl border border-border/30 p-6 hover:border-primary/30 transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <div className="text-primary">{step.icon}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-primary uppercase tracking-wider">
                    {step.phase}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ~{step.duration}
                  </span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                <ul className="space-y-1">
                  {step.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <ArrowRight className="w-3 h-3 text-primary mt-1 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center p-8 rounded-2xl glass-panel border border-primary/20"
      >
        <h3 className="font-orbitron text-xl font-bold text-foreground mb-3">
          Ready to Find Grants for Your Business?
        </h3>
        <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
          RTM Business Directory members get access to personalized grant matching, 
          application support, and exclusive funding alerts.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            to="/membership"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-primary/80 text-primary-foreground font-semibold hover:shadow-lg hover:shadow-primary/25 transition-all"
          >
            Join RTM Today
          </Link>
        </div>
      </motion.div>
    </div>
  );
};
