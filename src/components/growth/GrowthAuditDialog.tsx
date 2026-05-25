import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { submitGrowthAuditLead } from "@/services/growthAudit";
import { GROWTH_PACKAGES } from "@/lib/growthPackages";

const BUSINESS_TYPES = [
  "Home care / health services",
  "Food & catering",
  "Cleaning / trades",
  "Retail",
  "Professional services",
  "Non-profit / community",
  "Other",
];

const YEARS_OPTIONS = ["Less than 1 year", "1–3 years", "3–10 years", "10+ years"];

const ONLINE_OPTIONS = [
  { id: "no_website", label: "No website" },
  { id: "no_google", label: "No Google Business Profile" },
  { id: "no_social", label: "No social media" },
  { id: "weak_directory", label: "Not on directories / hard to find" },
  { id: "have_website", label: "Have a website (needs improvement)" },
  { id: "have_social", label: "Have social (inconsistent)" },
];

const CHALLENGES = [
  "Customers can't find us online",
  "We get leads but don't follow up",
  "No time for marketing",
  "Need more sales / revenue",
  "Want to automate with AI / WhatsApp",
  "Exploring grants to fund digital tools",
];

type Props = {
  triggerClassName?: string;
  defaultPackage?: string;
};

export default function GrowthAuditDialog({ triggerClassName, defaultPackage }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [yearsOperating, setYearsOperating] = useState("");
  const [onlinePresence, setOnlinePresence] = useState<string[]>([]);
  const [challenge, setChallenge] = useState("");
  const [interestedPackage, setInterestedPackage] = useState(defaultPackage ?? "");

  const reset = () => {
    setStep(0);
    setDone(false);
    setEmail("");
    setName("");
    setBusinessName("");
    setPhone("");
    setCity("");
    setBusinessType("");
    setYearsOperating("");
    setOnlinePresence([]);
    setChallenge("");
    setInterestedPackage(defaultPackage ?? "");
  };

  const toggleOnline = (id: string, checked: boolean) => {
    setOnlinePresence((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id),
    );
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await submitGrowthAuditLead({
        email,
        name: name || undefined,
        business_name: businessName || undefined,
        phone: phone || undefined,
        city: city || undefined,
        business_type: businessType || undefined,
        years_operating: yearsOperating || undefined,
        online_presence: onlinePresence,
        biggest_challenge: challenge || undefined,
        interested_package: interestedPackage || undefined,
        source: "grow_page",
      });
      if (!result.success) {
        toast.error(result.error ?? "Could not submit. Please try again.");
        return;
      }
      setDone(true);
      toast.success(
        result.emailsSent
          ? "Audit requested — check your inbox for confirmation."
          : "Request saved — an advisor will contact you within two business days.",
      );
    } catch {
      toast.error("Could not submit. Email info@rtmbusinessdirectory.com.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className={
            triggerClassName ??
            "inline-flex items-center justify-center gap-2 rounded-xl bg-[#cc0000] px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-[#b30000]"
          }
        >
          <Sparkles className="h-5 w-5" />
          Get a free growth audit
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Free Digital Growth Audit</DialogTitle>
          <DialogDescription>
            Eight quick questions so an RTM advisor can review your online presence and recommend
            the right package. No obligation.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="py-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Thank you!</p>
            <p className="mt-2">
              We will follow up within two business days with audit findings and next steps.
            </p>
            <Button className="mt-6 w-full" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {step === 0 && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Business name *</Label>
                    <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Your name</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Toronto" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>
                <Button className="w-full" onClick={() => setStep(1)} disabled={!email || !businessName}>
                  Next
                </Button>
              </>
            )}

            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label>Business type</Label>
                  <Select value={businessType} onValueChange={setBusinessType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Years operating</Label>
                  <Select value={yearsOperating} onValueChange={setYearsOperating}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS_OPTIONS.map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button className="w-full" onClick={() => setStep(2)}>
                  Next
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <Label>Current online presence (select all that apply)</Label>
                <div className="space-y-2 rounded-lg border p-3">
                  {ONLINE_OPTIONS.map((opt) => (
                    <label key={opt.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={onlinePresence.includes(opt.id)}
                        onCheckedChange={(c) => toggleOnline(opt.id, c === true)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
                <Button variant="outline" className="w-full" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button className="w-full" onClick={() => setStep(3)}>
                  Next
                </Button>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-2">
                  <Label>Biggest challenge right now</Label>
                  <Select value={challenge} onValueChange={setChallenge}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select challenge" />
                    </SelectTrigger>
                    <SelectContent>
                      {CHALLENGES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Interested package (optional)</Label>
                  <Select value={interestedPackage} onValueChange={setInterestedPackage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Not sure yet" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unsure">Not sure — advise me</SelectItem>
                      {GROWTH_PACKAGES.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button className="flex-1" disabled={submitting} onClick={() => void handleSubmit()}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit audit request"}
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
