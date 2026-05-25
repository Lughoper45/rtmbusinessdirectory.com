import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  getGrowthPackageById,
  getGrowthPackageMailto,
  type GrowthPackageId,
} from "@/lib/growthPackages";
import { startGrowthPackageCheckout } from "@/services/growthPackageCheckout";
import { supabase } from "@/integrations/supabase/client";
import { getGrowWorkspaceUrl } from "@/lib/platformAuthHandoff";

type Props = {
  packageId: GrowthPackageId;
  memberActive: boolean;
  className?: string;
};

export default function GrowPackageActions({ packageId, memberActive, className }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const pkg = getGrowthPackageById(packageId);

  const handleSubscribe = async () => {
    if (!pkg?.subscription) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const returnPath = `/packages?start=${packageId}`;
        window.location.href = getGrowWorkspaceUrl(null, `/auth?returnUrl=${encodeURIComponent(returnPath)}`);
        return;
      }

      const result = await startGrowthPackageCheckout({ packageId });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.url) {
        window.location.href = result.url;
      }
    } catch {
      toast.error("Checkout failed. Contact info@rtmbusinessdirectory.com.");
    } finally {
      setLoading(false);
    }
  };

  if (!pkg?.subscription) {
    return (
      <Button className={className} asChild>
        <a href={getGrowthPackageMailto(packageId)}>Request custom quote</a>
      </Button>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`}>
      <Button className="w-full" disabled={loading} onClick={() => void handleSubscribe()}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : `Subscribe — ${memberActive ? "member" : "standard"} rate`}
      </Button>
      <Button variant="ghost" size="sm" className="w-full" asChild>
        <Link to="/#growth-audit-cta" onClick={() => navigate("/#growth-audit-cta")}>
          Free audit first
        </Link>
      </Button>
    </div>
  );
}
