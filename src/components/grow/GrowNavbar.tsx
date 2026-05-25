import { Link } from "react-router-dom";
import { TrendingUp, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DIRECTORY_APP_URL,
  getGrantsPortalUrl,
  getMembershipJoinUrl,
  SITE_CONTACT,
} from "@/lib/site";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

const GrowNavbar = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const navLinks = [
    { label: "Packages", to: "/packages" },
    { label: "Free audit", to: "/#growth-audit-cta" },
    { label: "Workspace", to: "/workspace" },
  ];

  const NavItems = ({ onNavigate }: { onNavigate?: () => void }) => (
    <>
      {navLinks.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          onClick={onNavigate}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          {l.label}
        </Link>
      ))}
      <a
        href={getGrantsPortalUrl("/grants")}
        className="text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        Grants
      </a>
      <a
        href={DIRECTORY_APP_URL}
        className="text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        Directory
      </a>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 max-w-[1280px] items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 font-bold">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#cc0000] text-white">
            <TrendingUp className="h-5 w-5" />
          </div>
          <span>RTM Growth</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavItems />
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <Button variant="outline" size="sm" asChild>
              <Link to="/workspace">My workspace</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link to="/auth?returnUrl=/workspace">Sign in</Link>
            </Button>
          )}
          <Button size="sm" className="bg-[#cc0000] hover:bg-[#b30000]" asChild>
            <Link to="/#growth-audit-cta">Free audit</Link>
          </Button>
        </div>

        <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex flex-col gap-4 pt-10">
            <NavItems />
            <a href={`mailto:${SITE_CONTACT.email}`} className="text-sm text-muted-foreground">
              {SITE_CONTACT.email}
            </a>
            {!user && (
              <Button asChild>
                <a href={getMembershipJoinUrl({ returnUrl: window.location.href })}>RTM membership</a>
              </Button>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default GrowNavbar;
