import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ChevronRight, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { User as SupabaseUser } from "@supabase/supabase-js";
import BusinessListingWizard from "./BusinessListingWizard";
import { toast } from "sonner";

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
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
  };

const navLinks = [
    { label: "Discover", href: "#discover" },
    { label: "Directory", to: "/directory" },
    { label: "Dashboard", to: "/dashboard" },
    { label: "Grants", to: "/grants" },
    { label: "Support", href: "#support" },
    { label: "About", href: "#about" },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 h-[72px] bg-background/95 backdrop-blur-md shadow-soft">
        <div className="container mx-auto h-full max-w-[1440px] px-6 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img src="/rtm logo.png" alt="RTM Business Directory" className="h-10 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.to ? (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-base font-medium text-foreground hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full"
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-base font-medium text-foreground hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full"
                >
                  {link.label}
                </a>
              )
            )}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link 
                  to="/profile" 
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                >
                  <User className="w-4 h-4" />
                  {user.email?.split("@")[0]}
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Sign Out
                </Button>
              </>
            ) : (
              <Link to="/auth" className="text-base font-medium text-foreground hover:text-primary transition-colors">
                Login
              </Link>
            )}
            <Button variant="nav" size="default" onClick={() => setIsWizardOpen(true)}>
              List Your Business
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden fixed inset-0 top-[72px] bg-background z-40 animate-fade-in">
            <div className="container mx-auto px-6 py-8 flex flex-col gap-6">
              {navLinks.map((link) =>
                link.to ? (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    key={link.label}
                    href={link.href}
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </a>
                )
              )}
              <hr className="border-border" />
              {user ? (
                <>
                  <Link 
                    to="/profile" 
                    className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
                    onClick={() => setIsOpen(false)}
                  >
                    My Profile
                  </Link>
                  <Button variant="outline" onClick={() => { handleLogout(); setIsOpen(false); }}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Link to="/auth" className="text-lg font-medium text-foreground py-2" onClick={() => setIsOpen(false)}>
                  Login
                </Link>
              )}
              <Button variant="nav" size="lg" className="w-full mt-4" onClick={() => { setIsOpen(false); setIsWizardOpen(true); }}>
                List Your Business
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Business Listing Wizard */}
      <BusinessListingWizard isOpen={isWizardOpen} onClose={() => setIsWizardOpen(false)} />
    </>
  );
};

export default Navbar;
