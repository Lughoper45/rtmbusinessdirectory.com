import { supabase } from "@/integrations/supabase/client";

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailOptions) => {
  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: { to, subject, html },
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
};

export const sendClaimVerificationEmail = async (
  email: string,
  businessName: string,
  verificationLink: string
) => {
  return sendEmail({
    to: email,
    subject: `Verify your claim on ${businessName}`,
    html: `
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
    `,
  });
};

export const sendClaimApprovedEmail = async (
  email: string,
  businessName: string
) => {
  return sendEmail({
    to: email,
    subject: `Your claim on ${businessName} has been approved!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Claim Approved!</h2>
        <p>Great news! Your claim on <strong>${businessName}</strong> has been approved.</p>
        <p>You can now manage your business listing on RTM Directory.</p>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">RTM Business Directory</p>
      </div>
    `,
  });
};

export const sendWelcomeEmail = async (
  email: string,
  name: string
) => {
  return sendEmail({
    to: email,
    subject: "Welcome to RTM Business Directory!",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome, ${name}!</h2>
        <p>Thank you for joining RTM Business Directory.</p>
        <p>You can now:</p>
        <ul>
          <li>Save your favorite businesses</li>
          <li>Leave reviews</li>
          <li>Claim your own business</li>
          <li>Get discovered by thousands of customers</li>
        </ul>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">RTM Business Directory</p>
      </div>
    `,
  });
};

export const sendContactNotification = async (
  businessEmail: string,
  customerName: string,
  customerEmail: string,
  message: string,
  businessName: string
) => {
  return sendEmail({
    to: businessEmail,
    subject: `New inquiry about ${businessName} from RTM Directory`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Customer Inquiry</h2>
        <p><strong>From:</strong> ${customerName} (${customerEmail})</p>
        <p><strong>Business:</strong> ${businessName}</p>
        <div style="background: #f9f9f9; padding: 16px; border-radius: 8px; margin: 16px 0;">
          ${message}
        </div>
        <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">RTM Business Directory</p>
      </div>
    `,
  });
};
