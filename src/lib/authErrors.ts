import type { AuthError } from "@supabase/supabase-js";

/** User-facing messages for Supabase Auth API errors. */
export function getAuthErrorMessage(error: AuthError | null | undefined): string {
  if (!error) return "Something went wrong. Please try again.";

  const msg = error.message ?? "";
  const code = error.code ?? "";
  const lower = msg.toLowerCase();

  if (
    code === "email_not_confirmed" ||
    lower.includes("email not confirmed") ||
    lower.includes("email_not_confirmed")
  ) {
    return "Please confirm your email before signing in. Check your inbox for the confirmation link, or sign up again to resend it.";
  }

  if (
    code === "invalid_credentials" ||
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials")
  ) {
    return "Incorrect email or password. If you just signed up, confirm your email first.";
  }

  if (
    lower.includes("user already registered") ||
    lower.includes("already been registered") ||
    lower.includes("already exists")
  ) {
    return "This email is already registered. Sign in instead, or use Forgot password.";
  }

  if (lower.includes("database error saving new user")) {
    return "We could not finish creating your account (server setup). Please try again in a few minutes or contact support.";
  }

  if (lower.includes("signup is disabled") || lower.includes("signups not allowed")) {
    return "New signups are temporarily disabled. Please try again later.";
  }

  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Too many attempts. Please wait a minute and try again.";
  }

  if (lower.includes("password") && (lower.includes("weak") || lower.includes("at least"))) {
    return msg;
  }

  return msg || "Something went wrong. Please try again.";
}
