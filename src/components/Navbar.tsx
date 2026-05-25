import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Globe,
  HandCoins,
  LogOut,
  Menu,
  MapPin,
  Newspaper,
  Phone,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import BusinessListingWizard from "./BusinessListingWizard";
import { getGrantsPortalUrl, getWorldCupPortalUrl, openMembershipJoin, SITE_CONTACT } from "@/lib/site";
import { toast } from "sonner";

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [mobileResourcesOpen, setMobileResourcesOpen] = useState(false);
  const [mobileEarnOpen, setMobileEarnOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    setIsOpen(false);
  };

  const openComingSoon = (label: string) => {
    toast.message(`${label} content is being prepared by the RTM team.`);
    setIsOpen(false);
  };

  const handleJoinMembership = () => {
    setIsOpen(false);
    openMembershipJoin();
  };

  const resourcesItems = [
    { label: "Grants & Funding", icon: HandCoins, href: getGrantsPortalUrl("/grants"), description: "GrantPilot workspace on grants.rtmbusinessdirectory.com" },
    { label: "World Cup Ready", icon: Globe, href: getWorldCupPortalUrl(), description: "FIFA 2026 business portal" },
    { label: "Magazine", icon: Newspaper, action: () => openComingSoon("Magazine"), description: "Editorial and business stories" },
    { label: "Bookstore", icon: BookOpen, action: () => openComingSoon("Bookstore"), description: "Reading and learning resources" },
    { label: "Support Center", icon: CircleHelp, href: "/#support", description: "Help, contact, and onboarding" },
  ];

  const earnItems = [
    { label: "Affiliate Program", icon: HandCoins, to: "/affiliate", description: "Track referrals and commissions", badge: "30%" },
    { label: "List Your Business", icon: BriefcaseBusiness, action: () => setIsWizardOpen(true), description: "Add your business to RTM" },
  ];

  const renderDropdownAction = (item: (typeof resourcesItems)[number] | (typeof earnItems)[number]) => {
    const Icon = item.icon;

    if ("to" in item && item.to) {
      return (
        <DropdownMenuItem asChild className="cursor-pointer">
          <Link to={item.to} className="flex min-w-[260px] items-start gap-3">
            <Icon className="mt-0.5 h-4 w-4 text-primary" />
            <div className="flex-1">
              <div className="flex items-center gap-2 font-medium">
                <span>{item.label}</span>
                {"badge" in item && item.badge ? <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{item.badge}</Badge> : null}
              </div>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          </Link>
        </DropdownMenuItem>
      );
    }

    if ("href" in item && item.href) {
      return (
        <DropdownMenuItem asChild className="cursor-pointer">
          <a href={item.href} className="flex min-w-[260px] items-start gap-3">
            <Icon className="mt-0.5 h-4 w-4 text-primary" />
            <div>
              <div className="font-medium">{item.label}</div>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
          </a>
        </DropdownMenuItem>
      );
    }

    return (
      <DropdownMenuItem
        className="flex min-w-[260px] cursor-pointer items-start gap-3"
        onClick={() => {
          item.action?.();
          setIsOpen(false);
        }}
      >
        <Icon className="mt-0.5 h-4 w-4 text-primary" />
        <div className="flex-1">
          <div className="font-medium">{item.label}</div>
          <p className="text-xs text-muted-foreground">{item.description}</p>
        </div>
        {"badge" in item && item.badge ? <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{item.badge}</Badge> : null}
      </DropdownMenuItem>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/95 backdrop-blur-md">
        <div className="hidden border-b border-white/10 bg-slate-950 text-slate-100 md:block">
          <div className="container mx-auto flex max-w-[1440px] items-center justify-between px-6 py-2 text-sm">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="inline-flex items-center gap-2 text-slate-300 transition-colors hover:text-white"
                onClick={() => toast.message("English and French language switching is being prepared by the RTM team.")}
              >
                <Globe className="h-4 w-4" />
                EN / FR
              </button>
              <a href={SITE_CONTACT.phoneHref} className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
                <Phone className="h-4 w-4" />
                {SITE_CONTACT.phoneDisplay}
              </a>
              <span className="text-slate-600">|</span>
              <div className="inline-flex items-center gap-1.5 text-slate-300">
                <MapPin className="h-4 w-4" />
                {SITE_CONTACT.officeAddressCompact}
              </div>
            </div>

            <div className="flex items-center gap-5">
              <a href="/#support" className="text-slate-300 transition-colors hover:text-white">
                Support
              </a>
              {user ? (
                <Link to="/profile" className="text-slate-300 transition-colors hover:text-white">
                  Account
                </Link>
              ) : (
                <Link to="/auth" className="text-slate-300 transition-colors hover:text-white">
                  Login
                </Link>
              )}
              <Button size="sm" className="h-8 rounded-full px-4 text-sm shadow-glow" onClick={handleJoinMembership}>
                Join RTM
              </Button>
            </div>
          </div>
        </div>

        <nav className="bg-background/95">
          <div className="container mx-auto flex h-[76px] max-w-[1440px] items-center justify-between px-6">
            <Link to="/" className="flex items-center gap-3">
              <img src="/rtm-logo.png" alt="RTM Global Canada" className="h-10 w-auto" />
              <div className="hidden lg:block">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">RTM Global Canada</div>
                  <span className="text-lg" title="Proudly Canadian">🍁</span>
                </div>
                <div className="text-xs text-muted-foreground">Deals, directory, and growth tools</div>
              </div>
            </Link>

            <div className="hidden items-center gap-8 lg:flex">
              <Link to="/deals" className="inline-flex items-center gap-2 font-semibold text-primary transition-colors hover:text-primary/80">
                <span>Deals</span>
                <Badge className="rounded-full bg-primary text-primary-foreground hover:bg-primary">New</Badge>
              </Link>

              <Link to="/directory" className="font-medium text-foreground transition-colors hover:text-primary">
                Directory
              </Link>

              <Link to="/membership" className="font-medium text-foreground transition-colors hover:text-primary">
                Membership
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center gap-1 font-medium text-foreground transition-colors hover:text-primary">
                  Resources
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[310px] rounded-2xl p-2">
                  <DropdownMenuLabel>Consumer & Business Resources</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {resourcesItems.map((item) => (
                    <div key={item.label}>{renderDropdownAction(item)}</div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <a
                href={getGrantsPortalUrl("/grants")}
                className="font-medium text-foreground transition-colors hover:text-primary"
              >
                Grants
              </a>

              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center gap-1 font-medium text-foreground transition-colors hover:text-primary">
                  Earn
                  <ChevronDown className="h-4 w-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[310px] rounded-2xl p-2">
                  <DropdownMenuLabel>Revenue Opportunities</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {earnItems.map((item) => (
                    <div key={item.label}>{renderDropdownAction(item)}</div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="hidden items-center gap-4 md:flex lg:hidden">
              <Link to="/deals" className="font-medium text-primary">
                Deals
              </Link>
              <Button variant="nav" size="default" onClick={() => setIsWizardOpen(true)}>
                List Your Business
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="hidden items-center gap-4 lg:flex">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <User className="h-4 w-4" />
                    {user.email?.split("@")[0]}
                  </Link>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="mr-1.5 h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Link to="/auth" className="text-base font-medium text-foreground transition-colors hover:text-primary">
                  Login
                </Link>
              )}

              <Button variant="nav" size="default" onClick={() => setIsWizardOpen(true)}>
                List Your Business
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <button
              className="p-2 text-foreground md:hidden"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {isOpen && (
            <div className="fixed left-0 right-0 top-[76px] z-[60] bg-white md:hidden h-screen overflow-y-auto">
              <div className="flex flex-col gap-3 px-6 py-6">
                <div className="rounded-2xl bg-slate-950 px-4 py-4 text-slate-100">
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-sm text-slate-300"
                      onClick={() => toast.message("English and French language switching is being prepared by the RTM team.")}
                    >
                      <Globe className="h-4 w-4" />
                      EN / FR
                    </button>
                    <a href="/#support" className="text-sm text-slate-300">
                      Support
                    </a>
                  </div>
                  <Button className="w-full rounded-full" onClick={handleJoinMembership}>
                    Join RTM
                  </Button>
                </div>

                <Link to="/deals" className="rounded-xl border px-4 py-3 font-semibold text-primary" onClick={() => setIsOpen(false)}>
                  Deals
                </Link>
                <Link to="/directory" className="rounded-xl border px-4 py-3 font-medium" onClick={() => setIsOpen(false)}>
                  Directory
                </Link>
                <Link to="/membership" className="rounded-xl border px-4 py-3 font-medium" onClick={() => setIsOpen(false)}>
                  Membership
                </Link>

                <div className="rounded-xl border">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 font-medium"
                    onClick={() => setMobileResourcesOpen((open) => !open)}
                  >
                    <span>Resources</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${mobileResourcesOpen ? "rotate-180" : ""}`} />
                  </button>
                  {mobileResourcesOpen ? (
                    <div className="space-y-1 border-t bg-muted/30 p-2">
                      {resourcesItems.map((item) => {
                        const Icon = item.icon;

                        if ("to" in item && item.to) {
                          return (
                            <Link
                              key={item.label}
                              to={item.to}
                              className="flex items-start gap-3 rounded-lg px-3 py-2"
                              onClick={() => setIsOpen(false)}
                            >
                              <Icon className="mt-0.5 h-4 w-4 text-primary" />
                              <div>
                                <div className="font-medium">{item.label}</div>
                                <div className="text-xs text-muted-foreground">{item.description}</div>
                              </div>
                            </Link>
                          );
                        }

                        if ("href" in item && item.href) {
                          return (
                            <a key={item.label} href={item.href} className="flex items-start gap-3 rounded-lg px-3 py-2" onClick={() => setIsOpen(false)}>
                              <Icon className="mt-0.5 h-4 w-4 text-primary" />
                              <div>
                                <div className="font-medium">{item.label}</div>
                                <div className="text-xs text-muted-foreground">{item.description}</div>
                              </div>
                            </a>
                          );
                        }

                        return (
                          <button
                            key={item.label}
                            type="button"
                            className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left"
                            onClick={() => item.action?.()}
                          >
                            <Icon className="mt-0.5 h-4 w-4 text-primary" />
                            <div>
                              <div className="font-medium">{item.label}</div>
                              <div className="text-xs text-muted-foreground">{item.description}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <a
                  href={getGrantsPortalUrl("/grants")}
                  className="rounded-xl border px-4 py-3 font-medium block"
                  onClick={() => setIsOpen(false)}
                >
                  Grants
                </a>
                <a
                  href={getWorldCupPortalUrl()}
                  className="rounded-xl border px-4 py-3 font-medium block"
                  onClick={() => setIsOpen(false)}
                >
                  World Cup Ready
                </a>

                <div className="rounded-xl border">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 font-medium"
                    onClick={() => setMobileEarnOpen((open) => !open)}
                  >
                    <span>Earn</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${mobileEarnOpen ? "rotate-180" : ""}`} />
                  </button>
                  {mobileEarnOpen ? (
                    <div className="space-y-1 border-t bg-muted/30 p-2">
                      {earnItems.map((item) => {
                        const Icon = item.icon;

                        if ("to" in item && item.to) {
                          return (
                            <Link
                              key={item.label}
                              to={item.to}
                              className="flex items-start gap-3 rounded-lg px-3 py-2"
                              onClick={() => setIsOpen(false)}
                            >
                              <Icon className="mt-0.5 h-4 w-4 text-primary" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 font-medium">
                                  <span>{item.label}</span>
                                  {"badge" in item && item.badge ? (
                                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{item.badge}</Badge>
                                  ) : null}
                                </div>
                                <div className="text-xs text-muted-foreground">{item.description}</div>
                              </div>
                            </Link>
                          );
                        }

                        return (
                          <button
                            key={item.label}
                            type="button"
                            className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left"
                            onClick={() => {
                              item.action?.();
                              setIsOpen(false);
                            }}
                          >
                            <Icon className="mt-0.5 h-4 w-4 text-primary" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 font-medium">
                                <span>{item.label}</span>
                                {"badge" in item && item.badge ? (
                                  <Badge className="bg-primary/10 text-primary hover:bg-primary/10">{item.badge}</Badge>
                                ) : null}
                              </div>
                              <div className="text-xs text-muted-foreground">{item.description}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 flex flex-col gap-3 border-t pt-4">
                  {user ? (
                    <>
                      <Link to="/profile" className="rounded-xl border px-4 py-3 font-medium" onClick={() => setIsOpen(false)}>
                        Account
                      </Link>
                      <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <Link to="/auth" className="rounded-xl border px-4 py-3 font-medium" onClick={() => setIsOpen(false)}>
                      Login
                    </Link>
                  )}

                  <Button variant="nav" size="lg" className="w-full" onClick={() => { setIsOpen(false); setIsWizardOpen(true); }}>
                    List Your Business
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      <BusinessListingWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
    </>
  );
};

export default Navbar;
