import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, CheckCircle, XCircle, AlertCircle, Eye, 
  FileText, Calendar, DollarSign, ChevronDown, ChevronUp,
  MessageSquare, Download, RefreshCw, Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface Application {
  id: string;
  grantName: string;
  grantProvider: string;
  amount: number;
  submittedDate: string;
  expectedDecision: string;
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'more_info_needed';
  progress: number;
  lastUpdate: string;
  notes: string[];
  documents: string[];
}

const mockApplications: Application[] = [
  {
    id: "1",
    grantName: "Canada Digital Adoption Program (CDAP)",
    grantProvider: "Innovation Canada",
    amount: 15000,
    submittedDate: "2024-01-15",
    expectedDecision: "2024-02-15",
    status: "under_review",
    progress: 60,
    lastUpdate: "Application under review by assessment team",
    notes: ["Initial screening passed", "Documents verified", "Awaiting committee review"],
    documents: ["Business Plan", "Financial Statements", "Technology Roadmap"]
  },
  {
    id: "2",
    grantName: "Ontario Small Business Support Grant",
    grantProvider: "Ontario Ministry of Economic Development",
    amount: 25000,
    submittedDate: "2024-01-10",
    expectedDecision: "2024-02-28",
    status: "approved",
    progress: 100,
    lastUpdate: "Congratulations! Your application has been approved",
    notes: ["Application received", "Review completed", "Approved - funds disbursing"],
    documents: ["Business Registration", "Tax Returns", "Employee Records"]
  },
  {
    id: "3",
    grantName: "SR&ED Tax Credit",
    grantProvider: "Canada Revenue Agency",
    amount: 50000,
    submittedDate: "2024-01-20",
    expectedDecision: "2024-03-20",
    status: "pending",
    progress: 25,
    lastUpdate: "Application received and queued for review",
    notes: ["Submission confirmed"],
    documents: ["R&D Documentation", "Project Reports", "Financial Records"]
  },
  {
    id: "4",
    grantName: "Women Entrepreneurship Fund",
    grantProvider: "Women Entrepreneurship Strategy",
    amount: 100000,
    submittedDate: "2024-01-05",
    expectedDecision: "2024-02-05",
    status: "more_info_needed",
    progress: 45,
    lastUpdate: "Additional documentation requested",
    notes: ["Initial review complete", "Need: Updated financial projections", "Need: Market analysis report"],
    documents: ["Business Plan", "Founder Bio", "Impact Statement"]
  },
  {
    id: "5",
    grantName: "Clean Technology Fund",
    grantProvider: "Natural Resources Canada",
    amount: 75000,
    submittedDate: "2023-12-20",
    expectedDecision: "2024-01-20",
    status: "rejected",
    progress: 100,
    lastUpdate: "Application did not meet eligibility criteria",
    notes: ["Reviewed", "Rejected - revenue threshold exceeded", "Appeal option available"],
    documents: ["Environmental Assessment", "Technology Specs", "Business Case"]
  }
];

const statusConfig = {
  pending: {
    label: "Pending Review",
    color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    icon: Clock,
    glow: "shadow-yellow-500/20"
  },
  under_review: {
    label: "Under Review",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: Eye,
    glow: "shadow-blue-500/20"
  },
  approved: {
    label: "Approved",
    color: "bg-green-500/20 text-green-400 border-green-500/30",
    icon: CheckCircle,
    glow: "shadow-green-500/20"
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: XCircle,
    glow: "shadow-red-500/20"
  },
  more_info_needed: {
    label: "More Info Needed",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    icon: AlertCircle,
    glow: "shadow-orange-500/20"
  }
};

export const ApplicationTracker = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const filteredApplications = filter === "all" 
    ? mockApplications 
    : mockApplications.filter(app => app.status === filter);

  const stats = {
    total: mockApplications.length,
    pending: mockApplications.filter(a => a.status === "pending").length,
    underReview: mockApplications.filter(a => a.status === "under_review").length,
    approved: mockApplications.filter(a => a.status === "approved").length,
    rejected: mockApplications.filter(a => a.status === "rejected").length,
    moreInfo: mockApplications.filter(a => a.status === "more_info_needed").length,
    totalAwarded: mockApplications.filter(a => a.status === "approved").reduce((sum, a) => sum + a.amount, 0),
    totalPending: mockApplications.filter(a => a.status !== "approved" && a.status !== "rejected").reduce((sum, a) => sum + a.amount, 0)
  };

  const getDaysUntilDecision = (date: string) => {
    const diff = new Date(date).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-orbitron font-bold text-foreground flex items-center gap-3">
            <FileText className="w-7 h-7 text-primary" />
            Application Tracker
          </h2>
          <p className="text-muted-foreground mt-1">Monitor your submitted grant applications</p>
        </div>
        <Button variant="outline" className="gap-2 border-border/50 hover:border-primary/50">
          <RefreshCw className="w-4 h-4" />
          Refresh Status
        </Button>
      </div>

      {/* Stats Overview */}
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
              <p className="text-2xl font-bold text-green-400">${stats.totalAwarded.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Awarded</p>
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
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">${stats.totalPending.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Pending Decision</p>
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
              <FileText className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Applications</p>
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
              <Eye className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.underReview}</p>
              <p className="text-xs text-muted-foreground">Under Review</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className="gap-2"
        >
          <Filter className="w-4 h-4" />
          All ({stats.total})
        </Button>
        {Object.entries(statusConfig).map(([key, config]) => {
          const count = mockApplications.filter(a => a.status === key).length;
          const Icon = config.icon;
          return (
            <Button
              key={key}
              variant={filter === key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(key)}
              className="gap-2"
            >
              <Icon className="w-4 h-4" />
              {config.label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredApplications.map((app, index) => {
            const config = statusConfig[app.status];
            const StatusIcon = config.icon;
            const isExpanded = expandedId === app.id;
            const daysUntil = getDaysUntilDecision(app.expectedDecision);

            return (
              <motion.div
                key={app.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`glass-panel rounded-xl border border-border/30 overflow-hidden hover:border-primary/30 transition-all duration-300 ${config.glow}`}
              >
                {/* Main Row */}
                <div 
                  className="p-4 md:p-6 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : app.id)}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Grant Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-lg ${config.color} flex items-center justify-center flex-shrink-0`}>
                          <StatusIcon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{app.grantName}</h3>
                          <p className="text-sm text-muted-foreground">{app.grantProvider}</p>
                        </div>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center gap-2 md:w-32">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="font-bold text-green-400">${app.amount.toLocaleString()}</span>
                    </div>

                    {/* Status Badge */}
                    <Badge className={`${config.color} border whitespace-nowrap`}>
                      {config.label}
                    </Badge>

                    {/* Days Until Decision */}
                    {app.status !== "approved" && app.status !== "rejected" && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground md:w-32">
                        <Calendar className="w-4 h-4" />
                        <span>{daysUntil > 0 ? `${daysUntil} days` : "Due soon"}</span>
                      </div>
                    )}

                    {/* Expand Button */}
                    <Button variant="ghost" size="icon" className="flex-shrink-0">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Application Progress</span>
                      <span>{app.progress}%</span>
                    </div>
                    <Progress value={app.progress} className="h-2" />
                  </div>

                  {/* Last Update */}
                  <p className="text-sm text-muted-foreground mt-3 italic">
                    "{app.lastUpdate}"
                  </p>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-border/30"
                    >
                      <div className="p-4 md:p-6 space-y-6">
                        {/* Timeline */}
                        <div>
                          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            Application Timeline
                          </h4>
                          <div className="space-y-3 pl-4 border-l-2 border-primary/30">
                            {app.notes.map((note, i) => (
                              <div key={i} className="relative">
                                <div className="absolute -left-[21px] w-3 h-3 rounded-full bg-primary/50 border-2 border-background" />
                                <p className="text-sm text-muted-foreground">{note}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Documents */}
                        <div>
                          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            Submitted Documents
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {app.documents.map((doc, i) => (
                              <Badge key={i} variant="outline" className="gap-2 cursor-pointer hover:bg-secondary/50">
                                <Download className="w-3 h-3" />
                                {doc}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Submitted</p>
                            <p className="font-medium text-foreground">{new Date(app.submittedDate).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Expected Decision</p>
                            <p className="font-medium text-foreground">{new Date(app.expectedDecision).toLocaleDateString()}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3">
                          {app.status === "more_info_needed" && (
                            <Button className="gap-2 bg-orange-500 hover:bg-orange-600">
                              <AlertCircle className="w-4 h-4" />
                              Provide Information
                            </Button>
                          )}
                          {app.status === "rejected" && (
                            <Button variant="outline" className="gap-2">
                              <RefreshCw className="w-4 h-4" />
                              File Appeal
                            </Button>
                          )}
                          <Button variant="outline" className="gap-2">
                            <Eye className="w-4 h-4" />
                            View Full Application
                          </Button>
                          <Button variant="outline" className="gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Contact Support
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredApplications.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No applications found with this filter</p>
        </div>
      )}
    </div>
  );
};
