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
          Connecting Canadian businesses with customers nationwide<br>
          © ${new Date().getFullYear()} RTM Directory. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const confirmEmailTemplate = (confirmationUrl: string) => baseTemplate(`
  <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 24px;">
    Confirm Your Email Address 📧
  </h2>
  <p style="color: #475569; line-height: 1.7; margin: 0 0 24px;">
    Thanks for signing up! Please confirm your email address by clicking the button below:
  </p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);">
      ✓ Confirm Email Address
    </a>
  </div>
  <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <p style="color: #92400e; margin: 0; font-size: 14px;">
      ⚠️ This confirmation link will expire in <strong>24 hours</strong>.
    </p>
  </div>
  <p style="color: #64748b; font-size: 14px; margin: 24px 0 0;">
    If you didn't create an account, you can safely ignore this email.
  </p>
`, "Confirm Your Email - RTM Directory");

const confirmedTemplate = () => baseTemplate(`
  <div style="text-align: center;">
    <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 24px;">
      <span style="font-size: 40px;">✓</span>
    </div>
    <h2 style="color: #1e293b; margin: 0 0 16px; font-size: 28px;">
      Email Confirmed! 🎉
    </h2>
    <p style="color: #475569; line-height: 1.7; margin: 0 0 32px; font-size: 16px;">
      Your email has been successfully confirmed. You can now sign in to your account and start exploring Canadian businesses.
    </p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${"https://rtmbusinessdirectory.com/auth"}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Sign In →
      </a>
    </div>
  </div>
`, "Email Confirmed - RTM Directory");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, type } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const siteUrl = Deno.env.get("SITE_URL") || "https://rtmbusinessdirectory.com";

    if (type === "confirm") {
      // Generate confirmation link
      const { data, error } = await supabase.auth.admin.generateLink({
        type: "signup",
        email: email,
      });

      if (error) throw error;

      const confirmationUrl = data?.properties?.action?.redirectTo || `${siteUrl}/auth?confirmed=true`;

      await resend.emails.send({
        from: "RTM Directory <noreply@rtmbusinessdirectory.com>",
        to: email,
        subject: "Confirm Your Email - RTM Directory",
        html: confirmEmailTemplate(confirmationUrl),
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === "confirmed") {
      return new Response(JSON.stringify({ 
        success: true,
        html: confirmedTemplate()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid type");

  } catch (error) {
    console.error("Email error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});