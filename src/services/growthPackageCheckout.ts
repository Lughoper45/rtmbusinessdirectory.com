import { supabase } from "@/integrations/supabase/client";
import type { GrowthPackageId } from "@/lib/growthPackages";

export type GrowthPackageCheckoutResponse = {
  url?: string;
  sessionId?: string;
  orderId?: string;
  engagementId?: string;
  memberActive?: boolean;
  error?: string;
};

export async function startGrowthPackageCheckout(params: {
  packageId: GrowthPackageId;
  auditLeadId?: string;
  businessName?: string;
}): Promise<GrowthPackageCheckoutResponse> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { error: "Sign in required." };
  }

  const { data, error } = await supabase.functions.invoke<GrowthPackageCheckoutResponse>(
    "growth-package-checkout",
    {
      body: {
        package_id: params.packageId,
        audit_lead_id: params.auditLeadId,
        business_name: params.businessName,
      },
    },
  );

  if (error) return { error: error.message };
  if (data?.error) return { error: String(data.error) };
  if (!data?.url) return { error: "Checkout URL was not returned." };

  return data;
}
