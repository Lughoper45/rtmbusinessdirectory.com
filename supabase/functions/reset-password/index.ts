import { createClient } from "npm:@supabase/supabase-js@2.34.0";
import { Resend } from "https://esm.sh/resend@3.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const baseTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
          🇨🇦 RTM Directory
        </h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">
          Discover Canada's Best Businesses
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 32px;">
        ${content}
      </td>
    </tr>
    <tr>
      <td style="background-color: #f1f5f9; padding: 24px 32px; text-align: center;">
        <p style="color: #64748b; font-size: 13px; margin: 0 0 8px;">
          RTM Business Directory
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          © ${new Date().getFullYear()} RTM Directory. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const resetPasswordTemplate = (resetUrl: string) => baseTemplate(`
  <h2 style="color: #1e293b; margin: 0 0 16px; font-size: 24px;">
    Reset Your Password
  </h2>
  <p style="color: #475569; line-height: 1.7; margin: 0 0 24px;">
    We received a request to reset your password. Click the button below to create a new password:
  </p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="${resetUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
      Reset Password
    </a>
  </div>
  <p style="color: #64748b; font-size: 14px; margin: 24px 0 0;">
    This link expires in 1 hour. If you didn't request this, ignore this email.
  </p>
`, "Reset Your Password - RTM Directory");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const siteUrl = Deno.env.get("SITE_URL") || "https://rtmbusinessdirectory.com";

    // Generate a magic link using Supabase
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: email,
    });

    if (error) {
      console.error("Generate link error:", error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: error.message 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build the reset URL pointing to our page
    // The magic link contains the token in the hash
    const magicLink = data?.properties?.action?.redirectTo as string || "";
    
    // Extract token from the magic link and build our own URL
    let resetUrl = `${siteUrl}/reset-password`;
    if (magicLink.includes("access_token=")) {
      const url = new URL(magicLink);
      const accessToken = url.hash.split("access_token=")[1]?.split("&")[0];
      if (accessToken) {
        // Use search params instead of hash for cleaner URL
        resetUrl = `${siteUrl}/reset-password?token=${encodeURIComponent(accessToken)}`;
      }
    } else {
      // Fallback - use the magic link as-is
      resetUrl = magicLink.replace("#", "/?");
    }

    // Send branded reset email
    await resend.emails.send({
      from: "RTM Directory <noreply@rtmbusinessdirectory.com>",
      to: email,
      subject: "Reset Your Password - RTM Directory",
      html: resetPasswordTemplate(resetUrl),
    });

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Password reset link sent" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});