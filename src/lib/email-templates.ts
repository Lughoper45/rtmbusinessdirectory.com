// Professional branded email templates for RTM Directory

export const getSiteUrl = () => (typeof window !== 'undefined' ? window.location.origin : 'https://rtmbusinessdirectory.com');

export const baseTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
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
    
    <!-- Content -->
    <tr>
      <td style="padding: 40px 32px;">
        ${content}
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color: #f1f5f9; padding: 24px 32px; text-align: center;">
        <p style="color: #64748b; font-size: 13px; margin: 0 0 8px;">
          RTM Business Directory
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          Connecting Canadian businesses with customers nationwide<br>
          © ${new Date().getFullYear()} RTM Directory. All rights reserved.
        </p>
        <p style="color: #94a3b8; font-size: 11px; margin: 16px 0 0;">
          <a href="{{getSiteUrl()}}" style="color: #2563eb; text-decoration: none;">Visit Website</a>
          •
          <a href="{{getSiteUrl()}}/privacy" style="color: #2563eb; text-decoration: none;">Privacy Policy</a>
          •
          <a href="{{getSiteUrl()}}/terms" style="color: #2563eb; text-decoration: none;">Terms of Service</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

export const welcomeEmail = (fullName?: string) => {
  const siteUrl = getSiteUrl();
  return baseTemplate(`
    <h2 style="color: #1e293b; margin: 0 0 16px; font-size: 24px;">
      Welcome to RTM Directory${fullName ? `, ${fullName}` : ''}! 🎉
    </h2>
    
    <p style="color: #475569; line-height: 1.7; margin: 0 0 20px;">
      Your account has been successfully created. You can now start exploring thousands of verified Canadian businesses across all provinces.
    </p>
    
    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <h3 style="color: #1e293b; margin: 0 0 16px; font-size: 16px;">What you can do:</h3>
      <table role="presentation" width="100%">
        <tr>
          <td width="40" valign="top">🔍</td>
          <td style="padding-bottom: 12px;">
            <strong style="color: #1e293b;">Discover Businesses</strong><br>
            <span style="color: #64748b; font-size: 14px;">Search across 24,000+ verified Canadian businesses</span>
          </td>
        </tr>
        <tr>
          <td width="40" valign="top">❤️</td>
          <td style="padding-bottom: 12px;">
            <strong style="color: #1e293b;">Save Favorites</strong><br>
            <span style="color: #64748b; font-size: 14px;">Bookmark businesses you love for quick access</span>
          </td>
        </tr>
        <tr>
          <td width="40" valign="top">⭐</td>
          <td style="padding-bottom: 12px;">
            <strong style="color: #1e293b;">Leave Reviews</strong><br>
            <span style="color: #64748b; font-size: 14px;">Share your experiences with other users</span>
          </td>
        </tr>
        <tr>
          <td width="40" valign="top">📱</td>
          <td>
            <strong style="color: #1e293b;">Claim Your Business</strong><br>
            <span style="color: #64748b; font-size: 14px;">Manage your own business listing for free</span>
          </td>
        </tr>
      </table>
    </div>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${siteUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Explore Businesses →
      </a>
    </div>
    
    <p style="color: #64748b; font-size: 14px; margin: 24px 0 0;">
      If you have any questions, reply to this email or visit our <a href="${siteUrl}/help" style="color: #2563eb;">Help Center</a>.
    </p>
  `, "Welcome to RTM Directory!");
};

export const confirmEmail = (confirmationUrl: string) => {
  const siteUrl = getSiteUrl();
  return baseTemplate(`
    <h2 style="color: #1e293b; margin: 0 0 8px; font-size: 24px;">
      Confirm Your Email Address 📧
    </h2>
    
    <p style="color: #475569; line-height: 1.7; margin: 0 0 24px;">
      Thanks for signing up! Please confirm your email address by clicking the button below:
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${confirmationUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);">
        Confirm Email Address
      </a>
    </div>
    
    <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        ⚠️ This confirmation link will expire in 24 hours. If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
    
    <p style="color: #64748b; font-size: 13px; margin: 24px 0 0;">
      Or copy and paste this link: <br>
      <a href="${confirmationUrl}" style="color: #2563eb; word-break: break-all;">${confirmationUrl}</a>
    </p>
  `, "Confirm Your Email - RTM Directory");
};

export const passwordResetEmail = (resetUrl: string) => {
  const siteUrl = getSiteUrl();
  return baseTemplate(`
    <h2 style="color: #1e293b; margin: 0 0 16px; font-size: 24px;">
      Reset Your Password 🔐
    </h2>
    
    <p style="color: #475569; line-height: 1.7; margin: 0 0 24px;">
      We received a request to reset your password. Click the button below to create a new one:
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);">
        Reset Password
      </a>
    </div>
    
    <div style="background: #fef3c7; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        ⚠️ This link will expire in 1 hour. If you didn't request a password reset, please ignore this email or contact support.
      </p>
    </div>
    
    <p style="color: #64748b; font-size: 14px; margin: 24px 0 0;">
      Didn't request this? You can safely ignore this email.
    </p>
  `, "Reset Your Password - RTM Directory");
};

export const claimVerificationEmail = (businessName: string, verificationUrl: string) => {
  const siteUrl = getSiteUrl();
  return baseTemplate(`
    <h2 style="color: #1e293b; margin: 0 0 16px; font-size: 24px;">
      Verify Your Business Claim 🏢
    </h2>
    
    <p style="color: #475569; line-height: 1.7; margin: 0 0 24px;">
      You've requested to claim <strong>${businessName}</strong> on RTM Directory. Please verify your ownership:
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);">
        Verify Business Ownership
      </a>
    </div>
    
    <div style="background: #f1f5f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <h4 style="color: #1e293b; margin: 0 0 12px; font-size: 14px;">After verification, you'll be able to:</h4>
      <ul style="color: #475569; margin: 0; padding-left: 20px; font-size: 14px;">
        <li>Update your business information</li>
        <li>Add photos and descriptions</li>
        <li>Respond to customer reviews</li>
        <li>Access business analytics</li>
      </ul>
    </div>
    
    <p style="color: #64748b; font-size: 14px; margin: 24px 0 0;">
      This link expires in 24 hours.
    </p>
  `, `Verify Your Claim - ${businessName}`);
};

export const claimApprovedEmail = (businessName: string) => {
  const siteUrl = getSiteUrl();
  return baseTemplate(`
    <h2 style="color: #1e293b; margin: 0 0 16px; font-size: 24px;">
      🎉 Claim Approved!
    </h2>
    
    <p style="color: #475569; line-height: 1.7; margin: 0 0 24px;">
      Great news! Your claim on <strong>${businessName}</strong> has been approved. You now have full control of your business listing.
    </p>
    
    <div style="text-align: center; margin: 32px 0;">
      <a href="${siteUrl}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Manage Your Business →
      </a>
    </div>
    
    <p style="color: #64748b; font-size: 14px; margin: 24px 0 0;">
      Welcome to RTM Directory! If you have any questions, reply to this email.
    </p>
  `, `Claim Approved - ${businessName}`);
};

export const contactNotificationEmail = (
  businessName: string,
  customerName: string,
  customerEmail: string,
  message: string
) => {
  const siteUrl = getSiteUrl();
  return baseTemplate(`
    <h2 style="color: #1e293b; margin: 0 0 16px; font-size: 24px;">
      📬 New Customer Inquiry
    </h2>
    
    <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin: 24px 0;">
      <table role="presentation" width="100%">
        <tr>
          <td style="padding-bottom: 12px;"><strong style="color: #64748b;">From:</strong></td>
          <td style="padding-bottom: 12px; color: #1e293b;">${customerName}</td>
        </tr>
        <tr>
          <td style="padding-bottom: 12px;"><strong style="color: #64748b;">Email:</strong></td>
          <td style="padding-bottom: 12px;"><a href="mailto:${customerEmail}" style="color: #2563eb;">${customerEmail}</a></td>
        </tr>
        <tr>
          <td style="padding-bottom: 12px;"><strong style="color: #64748b;">Business:</strong></td>
          <td style="padding-bottom: 12px; color: #1e293b;">${businessName}</td>
        </tr>
      </table>
      
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;">
      
      <h4 style="color: #64748b; margin: 0 0 12px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Message:</h4>
      <div style="color: #1e293b; line-height: 1.7; white-space: pre-wrap;">${message}</div>
    </div>
    
    <p style="color: #64748b; font-size: 14px; margin: 24px 0 0;">
      Reply directly to this email to respond to ${customerName}.
    </p>
  `, `New Inquiry - ${businessName}`);
};