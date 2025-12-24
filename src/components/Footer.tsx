import { Rocket, Linkedin, Twitter, Facebook, Instagram, Youtube } from "lucide-react";

const Footer = () => {
  const productLinks = [
    "Find Businesses",
    "Access Grants",
    "Business Support",
    "AI Search",
    "World Cup Hub",
    "Marketplace",
    "Pricing",
  ];

  const companyLinks = [
    "About Us",
    "Careers",
    "Blog",
    "Press Kit",
    "Partners",
    "Contact",
  ];

  const legalLinks = [
    "Terms of Service",
    "Privacy Policy",
    "Cookie Policy",
    "Accessibility",
  ];

  const socialLinks = [
    { icon: Linkedin, href: "#", label: "LinkedIn" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Youtube, href: "#", label: "YouTube" },
  ];

  return (
    <footer className="bg-navy pt-16 pb-8">
      <div className="container mx-auto max-w-[1280px] px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand column */}
          <div>
            <a href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Rocket className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-primary-foreground">
                LaunchPad <span className="font-medium text-primary-foreground/70">Canada</span>
              </span>
            </a>
            <p className="text-primary-foreground/60 mb-6 leading-relaxed">
              Where Canadian Businesses Take Off
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="text-primary-foreground/60 hover:text-accent transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-primary-foreground font-bold mb-4">Product</h4>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-primary-foreground font-bold mb-4">Company</h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h4 className="text-primary-foreground font-bold mb-4">Legal</h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-primary-foreground/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/50 text-sm">
            © 2025 LaunchPad Canada. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm">
            <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
              English
            </a>
            <span className="text-primary-foreground/30">|</span>
            <a href="#" className="text-primary-foreground/60 hover:text-primary-foreground transition-colors">
              Français
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
