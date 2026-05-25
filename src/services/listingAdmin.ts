import { supabase } from "@/integrations/supabase/client";
import { getEdgeFunctionErrorMessage } from "@/lib/edgeFunctionErrors";

export async function invokeListingAdmin<T = unknown>(
  action: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const { data: payload, error } = await supabase.functions.invoke("listing-admin-bff", {
    body: { action, ...body },
  });
  if (payload?.error) throw new Error(payload.error);
  if (error) throw new Error(await getEdgeFunctionErrorMessage(error, payload));
  return payload as T;
}

export async function invokeListingPublic<T = unknown>(
  action: string,
  body: Record<string, unknown> = {},
): Promise<T> {
  const { data: payload, error } = await supabase.functions.invoke("listing-public", {
    body: { action, ...body },
  });
  if (payload?.error) throw new Error(payload.error);
  if (error) throw new Error(await getEdgeFunctionErrorMessage(error, payload));
  return payload as T;
}

export type UnclaimedBusiness = {
  business_id: string;
  name: string;
  city: string;
  province: string;
  category: string;
  website: string | null;
  phone: string | null;
  owner_email: string | null;
  claim_status: string;
  last_outreach_at: string | null;
};

export type ListingContact = {
  id: string;
  business_id: string;
  email: string | null;
  phone: string | null;
  name: string | null;
  confidence: number;
  casl_basis: string | null;
  source: string;
  verified_at: string | null;
  is_primary: boolean;
  businesses?: { name: string; city: string };
};

export type OutreachRow = {
  id: string;
  business_id: string;
  status: string;
  step: number;
  sent_at: string | null;
  businesses?: { name: string; city: string };
  listing_contacts?: { email: string; name: string | null };
};

export type SocialPost = {
  id: string;
  business_id: string | null;
  product_type: string;
  payload: Record<string, string>;
  channels: string[];
  status: string;
  published_urls: Record<string, string> | null;
  businesses?: { name: string; city: string; category: string };
};
