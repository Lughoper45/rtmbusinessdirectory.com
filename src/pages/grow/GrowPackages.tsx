import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import GrowNavbar from "@/components/grow/GrowNavbar";
import GrowPackageActions from "@/components/grow/GrowPackageActions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GROWTH_PACKAGES,
  GROWTH_DISCLAIMER,
  formatGrowthPrice,
  getGrowthMonthlyPrice,
  type GrowthPackageId,
} from "@/lib/growthPackages";
import { fetchPlatformMembership } from "@/services/membership";
import { supabase } from "@/integrations/supabase/client";
import { startGrowthPackageCheckout } from "@/services/growthPackageCheckout";
import { toast } from "sonner";

export default function GrowPackages() {
  const [searchParams] = useSearchParams();
  const [memberActive, setMemberActive] = useState(false);
  const startPackage = searchParams.get("start") as GrowthPackageId | null;

  useEffect(() => {
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const m = await fetchPlatformMembership(user.id, user.email ?? undefined);
      setMemberActive(m.active);
    })();
  }, []);

  useEffect(() => {
    if (!startPackage) return;
    const pkg = GROWTH_PACKAGES.find((p) => p.id === startPackage);
    if (!pkg?.subscription) return;

    void (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const result = await startGrowthPackageCheckout({ packageId: startPackage });
      if (result.url) window.location.href = result.url;
      else if (result.error) toast.error(result.error);
    })();
  }, [startPackage]);

  return (
    <>
      <Helmet>
        <title>Growth packages | RTM Growth Services</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <GrowNavbar />
        <main className="container mx-auto max-w-[1280px] px-6 py-12">
          <h1 className="text-3xl font-bold text-center">Choose your growth package</h1>
          <p className="text-center text-muted-foreground mt-2 max-w-2xl mx-auto">
            Monthly billing · RTM members save ~30% on all subscription packages
          </p>
          {memberActive && (
            <p className="text-center text-sm text-emerald-600 font-medium mt-2">
              Member pricing applied
            </p>
          )}
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6 mt-10">
            {GROWTH_PACKAGES.map((pkg) => {
              const price = getGrowthMonthlyPrice(pkg, memberActive);
              return (
                <Card
                  key={pkg.id}
                  className={`flex flex-col ${pkg.popular ? "border-[#cc0000] ring-2 ring-[#cc0000]/20" : ""}`}
                >
                  {pkg.popular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#cc0000]">
                      Most popular
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle>{pkg.name}</CardTitle>
                    <CardDescription className="text-[#cc0000] font-medium">{pkg.tagline}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    {price != null ? (
                      <p className="text-2xl font-bold">
                        {formatGrowthPrice(price)}
                        <span className="text-sm font-normal text-muted-foreground">/mo</span>
                      </p>
                    ) : (
                      <p className="text-lg font-bold">{pkg.priceNote}</p>
                    )}
                    {memberActive && pkg.monthlyPrice != null && pkg.monthlyPriceMember != null && (
                      <p className="text-xs text-muted-foreground line-through mt-1">
                        {formatGrowthPrice(pkg.monthlyPrice)}/mo list
                      </p>
                    )}
                    <ul className="mt-4 text-sm space-y-2">
                      {pkg.highlights.slice(0, 4).map((h) => (
                        <li key={h} className="flex gap-2">
                          <span className="text-emerald-500">✓</span>
                          {h}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <GrowPackageActions
                      packageId={pkg.id}
                      memberActive={memberActive}
                      className="w-full"
                    />
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          <p className="text-xs text-center text-muted-foreground mt-8 max-w-xl mx-auto">{GROWTH_DISCLAIMER}</p>
        </main>
      </div>
    </>
  );
}
