import { useState } from "react";
import { Menu, X, ChevronRight, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import BusinessListingWizard from "./BusinessListingWizard";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const navLinks = [
    { label: "Discover", href: "#discover" },
    { label: "Support", href: "#support" },
    { label: "Grants", href: "#grants" },
    { label: "About", href: "#about" },
  ];

  return (
    <>
      <nav className="sticky top-0 z-50 h-[72px] bg-background/95 backdrop-blur-md shadow-soft">
        <div className="container mx-auto h-full max-w-[1440px] px-6 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform">
              <Rocket className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              LaunchPad <span className="font-medium text-muted-foreground">Canada</span>
            </span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-base font-medium text-foreground hover:text-primary transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-primary after:transition-all hover:after:w-full"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <a href="#login" className="text-base font-medium text-foreground hover:text-primary transition-colors">
              Login
            </a>
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
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-lg font-medium text-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <hr className="border-border" />
              <a href="#login" className="text-lg font-medium text-foreground py-2">
                Login
              </a>
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
