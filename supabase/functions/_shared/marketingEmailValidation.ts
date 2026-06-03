const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "tempmail.com",
  "10minutemail.com",
  "yopmail.com",
  "throwaway.email",
  "getnada.com",
  "sharklasers.com",
  "trashmail.com",
]);

const ROLE_LOCAL_PARTS = new Set([
  "info",
  "sales",
  "admin",
  "support",
  "hello",
  "contact",
  "office",
  "noreply",
  "no-reply",
  "marketing",
  "billing",
]);

export type EmailValidationStatus =
  | "valid"
  | "invalid_syntax"
  | "disposable"
  | "no_mx"
  | "role_account";

export type EmailValidationResult = {
  status: EmailValidationStatus;
  detail: string;
  sendable: boolean;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmailSyntax(email: string): boolean {
  const e = normalizeEmail(email);
  if (e.length < 6 || e.length > 254) return false;
  return EMAIL_RE.test(e);
}

async function hasMxRecord(domain: string): Promise<boolean> {
  try {
    const mx = await Deno.resolveDns(domain, "MX");
    if (mx?.length) return true;
  } catch {
    /* fall through */
  }
  try {
    const a = await Deno.resolveDns(domain, "A");
    if (a?.length) return true;
  } catch {
    return false;
  }
  return false;
}

export async function validateMarketingEmail(
  email: string,
  options: { checkMx?: boolean } = { checkMx: true },
): Promise<EmailValidationResult> {
  const normalized = normalizeEmail(email);

  if (!isValidEmailSyntax(normalized)) {
    return {
      status: "invalid_syntax",
      detail: "Email format is invalid",
      sendable: false,
    };
  }

  const [local, domain] = normalized.split("@");
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      status: "disposable",
      detail: `Disposable domain: ${domain}`,
      sendable: false,
    };
  }

  if (ROLE_LOCAL_PARTS.has(local.split("+")[0])) {
    return {
      status: "role_account",
      detail: `Role-based inbox: ${local}@`,
      sendable: true,
    };
  }

  if (options.checkMx) {
    const mxOk = await hasMxRecord(domain);
    if (!mxOk) {
      return {
        status: "no_mx",
        detail: `No MX/A record for ${domain}`,
        sendable: false,
      };
    }
  }

  return {
    status: "valid",
    detail: "Syntax and domain checks passed",
    sendable: true,
  };
}

export const SENDABLE_STATUSES = new Set<EmailValidationStatus>([
  "valid",
  "role_account",
]);
