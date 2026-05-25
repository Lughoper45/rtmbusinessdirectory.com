import type { NavigateFunction } from "react-router-dom";
import type { LaunchBotAction } from "@/types/launchBot";
import { getOrCreateGrantIntake } from "@/services/grantIntake";
import { startGrantPackageCheckout } from "@/services/grantPackageCheckout";
import type { GrantPackageId } from "@/lib/grantPackages";
import { openMembershipJoin, SITE_CONTACT } from "@/lib/site";
import { supabase } from "@/integrations/supabase/client";

export type LaunchBotActionHandlers = {
  navigate: NavigateFunction;
  openProfileWizard: () => void;
  onError: (message: string) => void;
  onActionStart?: () => void;
  onActionEnd?: () => void;
};

async function ensureSignedIn(handlers: LaunchBotActionHandlers): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) return true;
  handlers.onError("Sign in to continue.");
  handlers.navigate("/auth");
  return false;
}

export async function executeLaunchBotAction(
  action: LaunchBotAction,
  handlers: LaunchBotActionHandlers,
): Promise<void> {
  handlers.onActionStart?.();
  try {
    switch (action.id) {
      case "auth_sign_in":
        handlers.navigate("/auth");
        break;

      case "auth_sign_up":
        handlers.navigate("/auth?mode=signup");
        break;

      case "membership_checkout":
        if (
          !window.confirm(
            "You'll be redirected to RTM membership checkout ($100/year). Continue?",
          )
        ) {
          return;
        }
        openMembershipJoin({ returnUrl: window.location.href });
        break;

      case "profile_wizard":
        handlers.openProfileWizard();
        break;

      case "open_grants":
        handlers.navigate("/grants");
        break;

      case "grant_intake_start": {
        if (!(await ensureSignedIn(handlers))) return;
        const grantId = action.payload?.grant_id;
        if (!grantId) {
          handlers.onError("Pick a grant from the catalog first.");
          handlers.navigate("/grants");
          return;
        }
        const { error } = await getOrCreateGrantIntake(grantId);
        if (error) {
          handlers.onError(error);
          return;
        }
        handlers.navigate(`/grants/${grantId}`);
        break;
      }

      case "grant_package_checkout": {
        if (!(await ensureSignedIn(handlers))) return;
        const packageId = action.payload?.package_id as GrantPackageId | undefined;
        const grantId = action.payload?.grant_id;
        if (!packageId || !grantId) {
          handlers.onError("Select a grant before choosing a package.");
          handlers.navigate("/grants");
          return;
        }
        if (!window.confirm("You'll be redirected to Stripe to complete payment. Continue?")) {
          return;
        }
        const result = await startGrantPackageCheckout({ packageId, grantId });
        if (result.error) {
          handlers.onError(result.error);
          return;
        }
        if (result.url) window.location.href = result.url;
        break;
      }

      case "list_business":
        handlers.navigate("/directory");
        break;

      case "contact_advisor":
        window.location.href = `mailto:${SITE_CONTACT.email}?subject=RTM%20advisor%20consultation`;
        break;

      case "open_url": {
        const href = action.payload?.href;
        if (href) window.open(href, "_blank", "noopener,noreferrer");
        break;
      }

      default:
        handlers.onError("This action is not available yet.");
    }
  } finally {
    handlers.onActionEnd?.();
  }
}
