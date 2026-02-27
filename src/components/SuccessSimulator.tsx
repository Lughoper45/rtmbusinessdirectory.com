import { useState, useEffect } from "react";
import { X, Building2, TrendingUp, DollarSign, Users, Award, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SuccessSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
}

type BusinessType = "restaurant" | "ecommerce" | "consulting" | "trades" | "retail" | null;

const businessData: Record<string, {
  avgGrant: number;
  successRate: number;
  avgRevenue: string;
  timeToLaunch: string;
  topGrants: string[];
}> = {
  restaurant: {
    avgGrant: 45000,
    successRate: 94,
    avgRevenue: "$320K",
    timeToLaunch: "4-6 weeks",
    topGrants: ["Canada Small Business Financing", "Regional Tourism Fund", "Hospitality Recovery Grant"],
  },
  ecommerce: {
    avgGrant: 35000,
    successRate: 97,
    avgRevenue: "$180K",
    timeToLaunch: "2-3 weeks",
    topGrants: ["Digital Adoption Program", "E-Commerce Growth Fund", "Export Development Grant"],
  },
  consulting: {
    avgGrant: 25000,
    successRate: 98,
    avgRevenue: "$220K",
    timeToLaunch: "1-2 weeks",
    topGrants: ["Professional Services Grant", "Innovation Assistance Program", "Skills Development Fund"],
  },
  trades: {
    avgGrant: 55000,
    successRate: 92,
    avgRevenue: "$280K",
    timeToLaunch: "3-5 weeks",
    topGrants: ["Skilled Trades Equipment Grant", "Apprenticeship Program", "Green Building Incentive"],
  },
  retail: {
    avgGrant: 40000,
    successRate: 91,
    avgRevenue: "$250K",
    timeToLaunch: "3-4 weeks",
    topGrants: ["Main Street Grant", "Retail Modernization Fund", "Community Economic Development"],
  },
};

const SuccessSimulator = ({ isOpen, onClose }: SuccessSimulatorProps) => {
  const [selectedType, setSelectedType] = useState<BusinessType>(null);
  const [showResults, setShowResults] = useState(false);
  const [animatedGrant, setAnimatedGrant] = useState(0);

  useEffect(() => {
    if (showResults && selectedType) {
      const target = businessData[selectedType].avgGrant;
      const duration = 1500;
      const steps = 60;
      const increment = target / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setAnimatedGrant(target);
          clearInterval(timer);
        } else {
          setAnimatedGrant(Math.floor(current));
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    }
  }, [showResults, selectedType]);

  const handleSelect = (type: BusinessType) => {
    setSelectedType(type);
    setTimeout(() => setShowResults(true), 500);
  };

  const handleClose = () => {
    setSelectedType(null);
    setShowResults(false);
    setAnimatedGrant(0);
    onClose();
  };

  if (!isOpen) return null;

  const businessTypes = [
    { id: "restaurant", label: "Restaurant / Café", icon: "🍽️" },
    { id: "ecommerce", label: "E-Commerce", icon: "🛒" },
    { id: "consulting", label: "Consulting", icon: "💼" },
    { id: "trades", label: "Trades / Services", icon: "🔧" },
    { id: "retail", label: "Retail Store", icon: "🏪" },
  ];

  const data = selectedType ? businessData[selectedType] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-navy/80 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-background rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-up">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors z-10"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="p-8">
          {!showResults ? (
            <>
              {/* Selection Phase */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-4">
                  <Sparkles className="w-4 h-4" />
                  Success Simulator
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  What type of business are you starting?
                </h2>
                <p className="text-muted-foreground">
                  We'll show you real data from similar Canadian businesses
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {businessTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleSelect(type.id as BusinessType)}
                    className={`p-6 rounded-xl border-2 text-left transition-all duration-300 hover:border-primary hover:shadow-lg hover:-translate-y-1 ${
                      selectedType === type.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-background"
                    }`}
                  >
                    <span className="text-3xl mb-3 block">{type.icon}</span>
                    <span className="font-semibold text-foreground">{type.label}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Results Phase */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-green-500/10 text-green-600 px-3 py-1 rounded-full text-sm font-medium mb-4">
                  <CheckCircle2 className="w-4 h-4" />
                  Your Potential Results
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
                  Here's what businesses like yours achieve
                </h2>
                <p className="text-muted-foreground">
                  Based on {data?.successRate}% of similar businesses on RTM Directory
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 text-center">
                  <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-3xl font-bold text-primary mb-1">
                    ${animatedGrant.toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg. Grant Received</div>
                </div>
                <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-xl p-6 text-center">
                  <TrendingUp className="w-8 h-8 text-accent mx-auto mb-2" />
                  <div className="text-3xl font-bold text-accent mb-1">{data?.avgRevenue}</div>
                  <div className="text-sm text-muted-foreground">Avg. First Year Revenue</div>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl p-6 text-center">
                  <Award className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-green-600 mb-1">{data?.successRate}%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl p-6 text-center">
                  <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-blue-600 mb-1">{data?.timeToLaunch}</div>
                  <div className="text-sm text-muted-foreground">Time to Launch</div>
                </div>
              </div>

              {/* Top Grants */}
              <div className="bg-muted/50 rounded-xl p-6 mb-8">
                <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  Top Grants Available For You
                </h3>
                <ul className="space-y-3">
                  {data?.topGrants.map((grant, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                      <span className="text-foreground">{grant}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="hero" size="lg" className="flex-1 group">
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => { setShowResults(false); setSelectedType(null); }}>
                  Try Another Business Type
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuccessSimulator;
