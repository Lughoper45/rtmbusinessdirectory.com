import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { X, ChevronRight, ChevronLeft, Check, Building2, MapPin, Globe, Sparkles, Loader2, Palette, AlertCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

const websiteDesignPackages = [
  { 
    id: "starter", 
    name: "Starter Website", 
    price: "$499", 
    features: ["5-page responsive website", "Mobile optimized", "Contact form", "SEO basics"],
    popular: false
  },
  { 
    id: "professional", 
    name: "Professional Website", 
    price: "$999", 
    features: ["10-page website", "E-commerce ready", "Blog integration", "Advanced SEO", "Social media integration"],
    popular: true
  },
  { 
    id: "enterprise", 
    name: "Enterprise Solution", 
    price: "$2,499", 
    features: ["Unlimited pages", "Custom functionality", "API integrations", "Priority support", "Analytics dashboard"],
    popular: false
  },
];

const BusinessListingWizard = ({ isOpen, onClose }: BusinessListingWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [hasWebsite, setHasWebsite] = useState<boolean | null>(null);
  const [autoFillSuccess, setAutoFillSuccess] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const { toast } = useToast();
  
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

  // Auto-trigger AI fill when website URL changes
  useEffect(() => {
    const url = formData.website.trim();
    if (url.length > 5 && (url.includes('.') || url.includes('http'))) {
      const debounceTimer = setTimeout(() => {
        handleAutoFill();
      }, 1000);
      return () => clearTimeout(debounceTimer);
    }
  }, [formData.website]);

  const handleAutoFill = async () => {
    if (!formData.website || isAutoFilling) return;
    setIsAutoFilling(true);
    setAutoFillSuccess(false);

    try {
      // Check if user is authenticated before calling the edge function
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: "Sign in required",
          description: (
            <span>
              Please <Link to="/auth" className="underline font-medium text-primary">sign in</Link> to use AI auto-fill.
            </span>
          ) as unknown as string,
          variant: "destructive",
        });
        setIsAutoFilling(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("analyze-website", {
        body: { websiteUrl: formData.website },
      });

      if (error) throw error;

      if (data?.success && data?.data) {
        const businessInfo = data.data;
        setFormData((prev) => ({
          ...prev,
          businessName: businessInfo.businessName || prev.businessName,
          description: businessInfo.description || prev.description,
          businessType: businessInfo.businessType || prev.businessType,
          city: businessInfo.city || prev.city,
          province: businessInfo.province || prev.province,
        }));
        setAutoFillSuccess(true);
        toast({
          title: "✨ AI Auto-Fill Complete!",
          description: "We've analyzed your website and filled in the details.",
        });
      }
    } catch (error) {
      console.error("Error auto-filling:", error);
      toast({
        title: "Auto-fill unavailable",
        description: "Please fill in the details manually.",
        variant: "destructive",
      });
    } finally {
      setIsAutoFilling(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 4) setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = () => {
    localStorage.removeItem("listingWizardProgress");
    toast({
      title: "🎉 Listing Submitted!",
      description: "Your business listing will be reviewed within 24 hours.",
    });
    onClose();
  };

  const handleWebsiteChoice = (hasOne: boolean) => {
    setHasWebsite(hasOne);
    if (hasOne) {
      // Focus will be on URL input
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-navy/80 backdrop-blur-sm" onClick={onClose} />
      
      {/* Wizard Container */}
      <div className="relative w-full max-w-2xl bg-background rounded-2xl shadow-heavy overflow-hidden animate-scale-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent p-6 text-white sticky top-0 z-10">
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

          {/* Step 2: Details with AI Auto-Fill */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-foreground">Tell us about your business</h3>
              
              {/* Website Question */}
              {hasWebsite === null && (
                <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-6 border border-primary/20">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-6 h-6 text-primary" />
                    <span className="font-semibold text-foreground text-lg">Do you have a website?</span>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="hero" 
                      onClick={() => handleWebsiteChoice(true)}
                      className="flex-1"
                    >
                      Yes, I have one
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleWebsiteChoice(false)}
                      className="flex-1"
                    >
                      No, not yet
                    </Button>
                  </div>
                </div>
              )}

              {/* Has Website - AI Auto-Fill */}
              {hasWebsite === true && (
                <div className="bg-surface-light rounded-xl p-4 border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                    <span className="font-medium text-foreground">AI Magic Auto-Fill</span>
                    {autoFillSuccess && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        ✓ Filled!
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Enter your website URL and watch the magic happen! We'll automatically extract your business details.
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="url"
                        placeholder="www.yourbusiness.com"
                        value={formData.website}
                        onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                        className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    {isAutoFilling && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-sm text-primary font-medium">Analyzing...</span>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => setHasWebsite(null)}
                    className="text-xs text-muted-foreground hover:text-foreground mt-2 underline"
                  >
                    ← Change answer
                  </button>
                </div>
              )}

              {/* No Website - Upsell Packages */}
              {hasWebsite === false && (
                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-accent/10 to-primary/10 rounded-xl p-4 border border-accent/20">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-accent/20 rounded-lg shrink-0">
                        <Palette className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">🚀 Boost Your Business with a Professional Website!</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Businesses with websites get <span className="font-bold text-accent">73% more leads</span>. Let us build yours!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {websiteDesignPackages.map(pkg => (
                      <button
                        key={pkg.id}
                        onClick={() => setSelectedPackage(pkg.id)}
                        className={`relative p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] ${
                          selectedPackage === pkg.id
                            ? "border-accent bg-accent/5"
                            : "border-border hover:border-accent/50"
                        }`}
                      >
                        {pkg.popular && (
                          <span className="absolute -top-2 right-4 bg-accent text-white text-xs px-2 py-0.5 rounded-full font-medium">
                            Most Popular
                          </span>
                        )}
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-semibold text-foreground">{pkg.name}</h5>
                            <ul className="mt-2 space-y-1">
                              {pkg.features.map((feature, i) => (
                                <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Check className="w-3 h-3 text-accent" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-foreground">{pkg.price}</span>
                            <p className="text-xs text-muted-foreground">one-time</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Select a package to add website design to your listing. Our team will contact you within 24 hours.
                    </p>
                  </div>

                  <button 
                    onClick={() => setHasWebsite(null)}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    ← I actually have a website
                  </button>
                </div>
              )}

              {/* Form Fields - Show after website decision */}
              {hasWebsite !== null && (
                <div className="space-y-3 pt-4 border-t border-border">
                  <input
                    type="text"
                    placeholder="Business Name *"
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    className={`w-full px-4 py-3 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-all ${
                      autoFillSuccess && formData.businessName ? 'border-green-400 bg-green-50/50' : 'border-border'
                    }`}
                  />
                  <textarea
                    placeholder="Business Description"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className={`w-full px-4 py-3 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none transition-all ${
                      autoFillSuccess && formData.description ? 'border-green-400 bg-green-50/50' : 'border-border'
                    }`}
                  />
                </div>
              )}
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
                    className={`w-full pl-10 pr-4 py-3 bg-background border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary ${
                      autoFillSuccess && formData.city ? 'border-green-400 bg-green-50/50' : 'border-border'
                    }`}
                  />
                </div>
                <select
                  value={formData.province}
                  onChange={(e) => setFormData(prev => ({ ...prev, province: e.target.value }))}
                  className={`w-full px-4 py-3 bg-background border rounded-lg text-foreground focus:outline-none focus:border-primary ${
                    autoFillSuccess && formData.province ? 'border-green-400 bg-green-50/50' : 'border-border'
                  }`}
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
                
                {/* Website Design Package */}
                {selectedPackage && (
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-accent">
                      <Palette className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Website Design: {websiteDesignPackages.find(p => p.id === selectedPackage)?.name}
                      </span>
                      <span className="text-sm font-bold">
                        {websiteDesignPackages.find(p => p.id === selectedPackage)?.price}
                      </span>
                    </div>
                  </div>
                )}
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
        <div className="p-6 border-t border-border flex items-center justify-between sticky bottom-0 bg-background">
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
              disabled={
                (currentStep === 1 && !formData.businessType) ||
                (currentStep === 2 && hasWebsite === null)
              }
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
