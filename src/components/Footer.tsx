import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Twitter, Youtube } from "lucide-react";
import { getGrantsPortalUrl, getGrowPortalUrl, getWorldCupPortalUrl, SITE_CONTACT } from "@/lib/site";

const Footer = () => {
  const productLinks = [
    { label: "Find Businesses", to: "/directory" },
    { label: "Access Grants", href: getGrantsPortalUrl("/grants") },
    { label: "Growth Services", href: getGrowPortalUrl("/") },
    { label: "AI Search", to: "/ai-search" },
    { label: "World Cup Ready", href: getWorldCupPortalUrl() },
    { label: "Marketplace", to: "/marketplace" },
    { label: "Pricing", to: "/pricing" },
  ];

  const companyLinks = [
    { label: "About Us", to: "/about" },
    { label: "Careers", to: "/careers" },
    { label: "Blog", to: "/blog" },
    { label: "Press Kit", to: "/press-kit" },
    { label: "Partners", to: "/partners" },
    { label: "Contact", to: "/contact" },
  ];

  const legalLinks = [
    { label: "Terms of Service", to: "/terms" },
    { label: "Privacy Policy", to: "/privacy" },
    { label: "Cookie Policy", to: "/cookies" },
    { label: "Accessibility", to: "/accessibility" },
  ];

  const socialLinks = [
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Youtube, href: "#", label: "YouTube" },
  ];

  return (
    <footer className="bg-navy pb-8 pt-16">
      <div className="container mx-auto max-w-[1280px] px-6">
        <div className="mb-12 grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="mb-4 flex items-center gap-3">
              <img src="/rtm-logo.png" alt="RTM Business Directory" className="h-10 w-auto" />
            </Link>
            <div className="text-lg font-semibold text-primary-foreground">RTM Business Directory</div>
            <p className="mb-6 mt-2 leading-relaxed text-primary-foreground/60">Your Trusted Business Directory</p>
            <p className="mb-6 max-w-sm text-sm leading-relaxed text-primary-foreground/50">
              {SITE_CONTACT.officeLabel}: {SITE_CONTACT.officeAddress}
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="text-primary-foreground/60 transition-colors hover:text-accent"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-primary-foreground">Product</h4>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  {"href" in link && link.href ? (
                    <a
                      href={link.href}
                      className="text-primary-foreground/60 transition-colors hover:text-primary-foreground"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      to={"to" in link ? link.to : "/"}
                      className="text-primary-foreground/60 transition-colors hover:text-primary-foreground"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-primary-foreground">Company</h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-primary-foreground/60 transition-colors hover:text-primary-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-primary-foreground">Legal</h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-primary-foreground/60 transition-colors hover:text-primary-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-primary-foreground/10 pt-8 sm:flex-row">
          <p className="text-sm text-primary-foreground/50">© 2025 RTM Business Directory. All rights reserved.</p>
          <div className="flex gap-4 text-sm">
            <button type="button" className="text-primary-foreground/60 transition-colors hover:text-primary-foreground">
              English
            </button>
            <span className="text-primary-foreground/30">|</span>
            <button type="button" className="text-primary-foreground/60 transition-colors hover:text-primary-foreground">
              Francais
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
