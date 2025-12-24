import { useState, useEffect } from "react";
import { X, ChevronRight, ChevronLeft, Check, Building2, MapPin, Globe, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BusinessListingWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

const steps = [
  { id: 1, title: "Business Type", description: "What kind of business?" },
  { id: 2, title: "Details", description: "Basic information" },
  { id: 3, title: "Location", description: "Where are you located?" },
  { id: 4, title: "Review", description: "Confirm & submit" },
];

const businessTypes = [
  { id: "restaurant", label: "Restaurant / Food", icon: "🍽️" },
  { id: "retail", label: "Retail Store", icon: "🛍️" },
  { id: "service", label: "Professional Service", icon: "💼" },
  { id: "tech", label: "Tech / Software", icon: "💻" },
  { id: "health", label: "Health & Wellness", icon: "🏥" },
  { id: "construction", label: "Construction / Trade", icon: "🔧" },
];

const provinces = ["Ontario", "British Columbia", "Alberta", "Quebec", "Manitoba", "Saskatchewan", "Nova Scotia", "New Brunswick"];

const BusinessListingWizard = ({ isOpen, onClose }: BusinessListingWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [formData, setFormData] = useState({
    businessType: "",
    businessName: "",
    website: "",
    description: "",
    city: "",
    province: "",
    phone: "",
    email: "",
  });

  // Auto-save progress to localStorage
  useEffect(() => {
    const saved = localStorage.getItem("listingWizardProgress");
    if (saved) {
      const parsed = JSON.parse(saved);
      setFormData(parsed.formData);
      setCurrentStep(parsed.currentStep);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      localStorage.setItem("listingWizardProgress", JSON.stringify({ formData, currentStep }));
    }
  }, [formData, currentStep, isOpen]);

  const handleAutoFill = async () => {
    if (!formData.website) return;
    setIsAutoFilling(true);
    
    // Simulate AI auto-fill (would connect to real AI service)
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        businessName: prev.businessName || "Your Business Name",
        description: prev.description || "AI-generated description based on website analysis...",
      }));
      setIsAutoFilling(false);
    }, 1500);
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = () => {
    // Submit logic
    localStorage.removeItem("listingWizardProgress");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-navy/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Wizard Container */}
      <div className="relative w-full max-w-2xl bg-background rounded-2xl shadow-heavy overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              <h2 className="text-xl font-bold">List Your Business</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex flex-col items-center ${index !== steps.length - 1 ? "flex-1" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    currentStep >= step.id 
                      ? "bg-white text-primary" 
                      : "bg-white/30 text-white/70"
                  }`}>
                    {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                  </div>
                  <span className="text-xs mt-1 hidden sm:block">{step.title}</span>
                </div>
                {index !== steps.length - 1 && (
                  <div className={`h-1 flex-1 mx-2 rounded transition-all ${
                    currentStep > step.id ? "bg-white" : "bg-white/30"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Business Type */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-foreground">What type of business are you listing?</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {businessTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setFormData(prev => ({ ...prev, businessType: type.id }))}
                    className={`p-4 rounded-xl border-2 text-center transition-all hover:scale-105 ${
                      formData.businessType === type.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <span className="text-3xl">{type.icon}</span>
                    <p className="text-sm font-medium mt-2 text-foreground">{type.label}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-foreground">Tell us about your business</h3>
              
              {/* AI Auto-fill */}
              <div className="bg-surface-light rounded-xl p-4 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  <span className="font-medium text-foreground">AI Auto-Fill</span>
                </div>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="url"
                      placeholder="Enter your website URL"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <Button 
                    variant="hero" 
                    size="sm" 
                    onClick={handleAutoFill}
                    disabled={isAutoFilling || !formData.website}
                  >
                    {isAutoFilling ? <Loader2 className="w-4 h-4 animate-spin" /> : "Auto-Fill"}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Business Name *"
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
                <textarea
                  placeholder="Business Description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 3: Location */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-foreground">Where is your business located?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="City *"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>
                <select
                  value={formData.province}
                  onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="">Select Province *</option>
                  {provinces.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-foreground">Review your listing</h3>
              <div className="bg-surface-light rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">
                    {businessTypes.find(t => t.id === formData.businessType)?.icon || "🏢"}
                  </span>
                  <div>
                    <h4 className="font-bold text-foreground">{formData.businessName || "Your Business"}</h4>
                    <p className="text-sm text-muted-foreground">
                      {formData.city}, {formData.province}
                    </p>
                  </div>
                </div>
                {formData.description && (
                  <p className="text-sm text-muted-foreground">{formData.description}</p>
                )}
                <div className="pt-2 border-t border-border text-sm text-muted-foreground space-y-1">
                  {formData.phone && <p>📞 {formData.phone}</p>}
                  {formData.email && <p>✉️ {formData.email}</p>}
                  {formData.website && <p>🌐 {formData.website}</p>}
                </div>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
                <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">
                  By submitting, you agree to our terms of service. Your listing will be reviewed within 24 hours.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          
          {currentStep < 4 ? (
            <Button
              variant="hero"
              onClick={handleNext}
              disabled={currentStep === 1 && !formData.businessType}
              className="gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="hero"
              onClick={handleSubmit}
              className="gap-2"
            >
              Submit Listing
              <Check className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Auto-save indicator */}
        <div className="absolute bottom-20 left-6 text-xs text-muted-foreground flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Progress saved automatically
        </div>
      </div>
    </div>
  );
};

export default BusinessListingWizard;
