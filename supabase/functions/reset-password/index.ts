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

const resetPasswordTemplate = (resetUrl: string) => baseTemplate(`
  <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 24px;">
    Reset Your Password 🔐
  </h2>
  <p style="color: #475569; line-height: 1.7; margin: 0 0 24px;">
    We received a request to reset your password. Click the button below to create a new one:
  </p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.3);">
      Reset Password
    </a>
  </div>
  <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <p style="color: #92400e; margin: 0; font-size: 14px;">
      ⚠️ This link will expire in <strong>1 hour</strong>. If you didn't request a password reset, please ignore this email or contact support immediately.
    </p>
  </div>
  <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <h4 style="color: #1e293b; margin: 0 0 12px; font-size: 14px;">Why did you receive this email?</h4>
    <p style="color: #64748b; margin: 0; font-size: 14px; line-height: 1.6;">
      Someone may have entered your email address when trying to reset their password. If it wasn't you, your account is still secure and no action is needed.
    </p>
  </div>
  <p style="color: #64748b; font-size: 13px; margin: 24px 0 0;">
    If the button doesn't work, copy and paste this link:<br>
    <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
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

    // Generate proper reset link using Supabase admin API
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: email,
    });

    if (error) {
      console.error("Generate link error:", error);
      // Still return success to prevent email enumeration
      return new Response(JSON.stringify({ 
        success: true, 
        message: "If an account exists, a password reset link has been sent" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // The token is in the hash portion of redirectTo
    const redirectTo = data?.properties?.action?.redirectTo || `${siteUrl}/auth`;
    
    // Parse the hash to get token
    let resetUrl = redirectTo;
    if (data?.properties?.action?.hash) {
      const hashParams = new URLSearchParams(data.properties.action.hash.replace('#', ''));
      const tokenFromHash = hashParams.get('token');
      if (tokenFromHash) {
        resetUrl = `${siteUrl}/auth?type=recovery&token=${tokenFromHash}&email=${encodeURIComponent(email)}`;
      }
    } else {
      resetUrl = `${siteUrl}/reset-password?token=fallback&email=${encodeURIComponent(email)}`;
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
      success: true, 
      message: "If an account exists, a password reset link has been sent" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});