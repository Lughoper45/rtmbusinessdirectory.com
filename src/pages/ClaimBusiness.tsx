import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { claimBusiness } from "@/services/businesses";
import { invokeListingPublic } from "@/services/listingAdmin";
import { businessProfilePath } from "@/lib/slug";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Building2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type InviteBusiness = {
  business_id: string;
  name: string;
  city: string;
  province: string;
  category: string;
  claim_status: string;
};

const ClaimBusiness = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const businessIdParam = searchParams.get("businessId");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [business, setBusiness] = useState<InviteBusiness | null>(null);
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setSessionEmail(session.user.email);
        setEmail(session.user.email);
      }

      if (token) {
        try {
          const res = await invokeListingPublic<{
            valid: boolean;
            business?: InviteBusiness;
          }>("verify-invite", { token });
          if (res.valid && res.business) {
            setBusiness(res.business);
          }
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Invalid invite link");
        }
      } else if (businessIdParam) {
        const { data } = await (supabase as any)
          .from("businesses")
          .select("business_id, name, city, province, category, claim_status")
          .eq("business_id", businessIdParam)
          .maybeSingle();
        if (data) setBusiness(data as InviteBusiness);
      }

      setLoading(false);
    })();
  }, [token, businessIdParam]);

  const handleClaim = async () => {
    if (!business) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      const returnPath = token
        ? `/claim?token=${encodeURIComponent(token)}`
        : `/claim?businessId=${encodeURIComponent(business.business_id)}`;
      navigate(`/auth?redirectTo=${encodeURIComponent(returnPath)}`);
      return;
    }

    const claimEmail = email.trim() || session.user.email;
    if (!claimEmail) {
      toast.error("Enter your business email");
      return;
    }

    setSubmitting(true);
    try {
      const result = await claimBusiness(business.business_id, claimEmail, session.user.id);
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setDone(true);
      toast.success(result.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Claim failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Claim your business — RTM Directory</title>
      </Helmet>
      <Navbar />
      <main className="container max-w-lg py-16 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-6 w-6 text-primary" />
              Claim your listing
            </CardTitle>
            <CardDescription>
              Verify ownership to manage your RTM Business Directory profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!business ? (
              <p className="text-muted-foreground text-sm">
                Invalid or expired link.{" "}
                <Link to="/directory" className="text-primary underline">
                  Browse directory
                </Link>
              </p>
            ) : done ? (
              <div className="text-center space-y-4 py-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                <p className="font-medium">Claim submitted</p>
                <p className="text-sm text-muted-foreground">
                  Check <strong>{email}</strong> to verify ownership. An RTM admin will approve
                  within two business days.
                </p>
                <Button asChild variant="outline">
                  <Link
                    to={businessProfilePath({
                      id: business.business_id,
                      name: business.name,
                      category: business.category,
                      city: business.city,
                    })}
                  >
                    View public profile
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-lg bg-muted p-4">
                  <p className="font-semibold">{business.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {business.city}, {business.province}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="claim-email">Business email</Label>
                  <Input
                    id="claim-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@yourbusiness.com"
                    disabled={!!sessionEmail}
                  />
                </div>
                <Button className="w-full" onClick={() => void handleClaim()} disabled={submitting}>
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Submit claim
                </Button>
                {!sessionEmail && (
                  <p className="text-xs text-center text-muted-foreground">
                    <Link to={`/auth?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`} className="text-primary underline">
                      Sign in
                    </Link>{" "}
                    to continue with your RTM account.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
};

export default ClaimBusiness;
