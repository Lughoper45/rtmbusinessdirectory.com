import { createClient } from "npm:@supabase/supabase-js@2.34.0";
import { Resend } from "https://esm.sh/resend@3.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { claimId, businessId, email, businessName, verificationToken, action } = await req.json();

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    let subject = "";
    let html = "";

    if (action === "verification") {
      const verificationLink = `${Deno.env.get("SITE_URL") || "https://rtmbusinessdirectory.com"}/claim/verify?id=${claimId}&token=${verificationToken}`;
      subject = `Verify your claim on ${businessName}`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Business Claim</h2>
          <p>You've requested to claim <strong>${businessName}</strong> on RTM Directory.</p>
          <p>Click the button below to verify your ownership:</p>
          <a href="${verificationLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Verify Claim
          </a>
          <p>If the button doesn't work, copy and paste this link: ${verificationLink}</p>
          <p>This link expires in 24 hours.</p>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">RTM Business Directory</p>
        </div>
      `;
    } else if (action === "approved") {
      subject = `Your claim on ${businessName} has been approved!`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Claim Approved!</h2>
          <p>Great news! Your claim on <strong>${businessName}</strong> has been approved.</p>
          <p>You can now manage your business listing on RTM Directory.</p>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">RTM Business Directory</p>
        </div>
      `;
    } else if (action === "rejected") {
      subject = `Your claim on ${businessName} was not approved`;
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Claim Update</h2>
          <p>Your claim on <strong>${businessName}</strong> was reviewed but could not be approved at this time.</p>
          <p>Please contact us if you have questions.</p>
          <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">RTM Business Directory</p>
        </div>
      `;
    }

    const result = await resend.emails.send({
      from: "RTM Directory <noreply@rtmbusinessdirectory.com>",
      to: email,
      subject,
      html,
    });

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Email error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});