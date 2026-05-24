import { supabase } from "@/integrations/supabase/client";
import type { GrantPackageId } from "@/lib/grantPackages";

export type GrantPackageCheckoutResponse = {
  url?: string;
  sessionId?: string;
  orderId?: string;
  amountCents?: number;
  memberActive?: boolean;
  error?: string;
};

export async function startGrantPackageCheckout(params: {
  packageId: GrantPackageId;
  grantId: string;
}): Promise<GrantPackageCheckoutResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { error: "Sign in to continue to payment." };
  }

  const { data, error } = await supabase.functions.invoke<GrantPackageCheckoutResponse>(
    "grant-package-checkout",
    {
      body: {
        package_id: params.packageId,
        grant_id: params.grantId,
      },
      headers: { Authorization: `Bearer ${session.access_token}` },
    },
  );

  if (error) return { error: error.message };
  if (data?.error) return { error: data.error };
  if (!data?.url) return { error: "Checkout URL was not returned." };
  return data;
}
