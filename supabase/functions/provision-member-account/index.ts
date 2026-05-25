import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@3.1.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-platform-service-key",
};

type ProvisionBody = {
  email?: string;
  userId?: string;
  source?: string;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function randomPassword(length = 16): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => chars[b % chars.length]).join("");
}

const welcomeTemplate = (loginUrl: string, grantsUrl: string) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>RTM Membership Active</title></head>
<body style="font-family: system-ui, sans-serif; background: #f8fafc; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 32px;">
    <h1 style="color: #1e293b; font-size: 22px;">Your RTM membership is active</h1>
    <p style="color: #475569; line-height: 1.6;">
      Payment received. Use the temporary password below to sign in, then change it in your account settings.
    </p>
    <p style="background: #f1f5f9; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 15px;">
      <strong>Temporary password:</strong> {{PASSWORD}}
    </p>
    <p style="margin: 24px 0;">
      <a href="${loginUrl}" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
        Sign in to membership
      </a>
    </p>
    <p style="color: #64748b; font-size: 14px;">
      Open your grant workspace: <a href="${grantsUrl}">${grantsUrl}</a><br>
      (Sign in on grants with the same email and password.)
    </p>
    <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
      If you did not purchase membership, contact support immediately.
    </p>
  </div>
</body>
</html>
`;

async function findAuthUserIdByEmail(
  admin: ReturnType<typeof createClient>,
  email: string,
): Promise<string | null> {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) {
    console.error("[provision-member-account] listUsers:", error.message);
    return null;
  }
  const match = data.users.find((u) => u.email?.toLowerCase() === email);
  return match?.id ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const platformServiceKey = Deno.env.get("PLATFORM_SERVICE_KEY");
    const resendKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !serviceKey) {
      return json({ ok: false, error: "Server configuration incomplete." }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    const serviceHeader = req.headers.get("x-platform-service-key");
    const authorized =
      authHeader === `Bearer ${serviceKey}` ||
      (!!platformServiceKey && serviceHeader === platformServiceKey);

    if (!authorized) {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }

    const body: ProvisionBody =
      req.method === "POST" ? await req.json().catch(() => ({})) : {};

    let email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    let userId = typeof body.userId === "string" ? body.userId : null;

    const membershipLoginUrl =
      Deno.env.get("MEMBERSHIP_LOGIN_URL") || "https://membership.rtmbusinessdirectory.com/auth";
    const grantsLoginUrl =
      Deno.env.get("GRANTS_LOGIN_URL") || "https://grants.rtmbusinessdirectory.com/auth";

    const admin = createClient(supabaseUrl, serviceKey);
    let createdUser = false;
    let tempPassword: string | null = null;

    if (userId && !email) {
      const { data: userData } = await admin.auth.admin.getUserById(userId);
      email = userData.user?.email?.toLowerCase() ?? "";
    }

    if (!email && !userId) {
      return json({ ok: false, error: "email or userId is required" }, 400);
    }

    if (!userId && email) {
      userId = await findAuthUserIdByEmail(admin, email);
    }

    if (!userId) {
      tempPassword = randomPassword();
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { provisioned_by: body.source ?? "provision-member-account" },
      });

      if (createError) {
        if (createError.message.toLowerCase().includes("already")) {
          userId = await findAuthUserIdByEmail(admin, email);
          tempPassword = null;
        } else {
          throw createError;
        }
      } else {
        userId = created.user?.id ?? null;
        createdUser = true;
      }
    }

    if (!userId) {
      return json({ ok: false, error: "Could not resolve user for email" }, 500);
    }

    const { data: existingProfile } = await admin
      .from("profiles")
      .select("id")
      .or(`id.eq.${userId},user_id.eq.${userId}`)
      .maybeSingle();

    if (existingProfile?.id) {
      await admin
        .from("profiles")
        .update({ membership_status: "active", email })
        .eq("id", existingProfile.id);
    } else {
      await admin.from("profiles").upsert(
        {
          id: userId,
          user_id: userId,
          email,
          membership_status: "active",
          role: "member",
        },
        { onConflict: "id" },
      );
    }

    let emailSent = false;
    if (tempPassword && resendKey) {
      const resend = new Resend(resendKey);
      const html = welcomeTemplate(membershipLoginUrl, grantsLoginUrl).replace(
        "{{PASSWORD}}",
        tempPassword,
      );
      await resend.emails.send({
        from: Deno.env.get("RESEND_FROM") || "RTM Membership <noreply@rtmbusinessdirectory.com>",
        to: email,
        subject: "Your RTM membership — sign-in details",
        html,
      });
      emailSent = true;
      tempPassword = null;
    } else if (tempPassword) {
      console.warn("[provision-member-account] RESEND_API_KEY not set — credentials email skipped");
    }

    return json({
      ok: true,
      userId,
      createdUser,
      membershipActivated: true,
      emailSent,
      loginUrl: membershipLoginUrl,
      grantsLoginUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Provision failed";
    console.error("[provision-member-account]", message);
    return json({ ok: false, error: message }, 500);
  }
});
