import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
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
import { submitGrantChecklistLead } from "@/services/grantChecklist";

type Props = {
  triggerClassName?: string;
};

export default function GrantChecklistRequestDialog({ triggerClassName }: Props) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const reset = () => {
    setEmail("");
    setName("");
    setSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await submitGrantChecklistLead({ email, name: name || undefined });
      if (!result.success) {
        toast.error(result.error ?? "Could not submit your request. Please try again.");
        return;
      }
      setSubmitted(true);
      toast.success(
        result.emailsSent
          ? "Request received — check your inbox for a confirmation."
          : "Request received — our team will email you within two business days.",
      );
    } catch (err) {
      console.error(err);
      toast.error("Could not submit your request. Please email info@rtmbusinessdirectory.com.");
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
            "inline-flex items-center justify-center gap-2 rounded-xl border border-[#cc0000]/40 bg-red-50 px-6 py-3 font-semibold text-[#061f3a] transition-colors hover:bg-red-100"
          }
        >
          <Mail className="h-5 w-5 text-[#cc0000]" />
          Request checklist
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Free Grant Checklist</DialogTitle>
          <DialogDescription>
            Enter your email and an RTM advisor will send your eligibility checklist within two business
            days.
          </DialogDescription>
        </DialogHeader>
        {submitted ? (
          <div className="py-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Thank you!</p>
            <p className="mt-2">
              We saved your request. Watch for a message from RTM with next steps and links to our grants
              hub and membership options.
            </p>
            <Button type="button" className="mt-6 w-full" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="checklist-email">Email *</Label>
              <Input
                id="checklist-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="checklist-name">Name (optional)</Label>
              <Input
                id="checklist-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending…
                </>
              ) : (
                "Send my checklist request"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
