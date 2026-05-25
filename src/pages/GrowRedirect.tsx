import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { getGrowPortalUrl } from "@/lib/site";
import { isGrowSurface } from "@/lib/appSurface";

/** On main directory host, send /grow traffic to grow subdomain. */
export default function GrowRedirect() {
  useEffect(() => {
    if (isGrowSurface()) return;
    const path = window.location.pathname.replace(/^\/grow\/?/, "/") || "/";
    const search = window.location.search;
    window.location.replace(getGrowPortalUrl(`${path}${search}`));
  }, []);

  if (isGrowSurface()) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
