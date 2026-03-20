import { Facebook, Instagram, Mail } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    company: [
      { label: "About Us", href: "/about" },
      { label: "List Your Property", href: "/list-property" },
    ],
    services: [
      { label: "Pet Hotels", href: "/hotels" },
      { label: "Grooming", href: "/grooming" },
      { label: "Veterinary", href: "/veterinary" },
    ],
    support: [
      { label: "Help Center", href: "/faq" },
      { label: "Contact Us", href: "/help-center" },
    ],
    legal: [
      { label: "Terms", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Cookies", href: "#" },
    ],
  };

  return (
    <footer className="bg-foreground text-background">
      {/* Main Footer */}
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">

          {/* Brand */}
          <div className="col-span-2">
            <a href="/" className="flex items-center gap-3 mb-4">
              <img
                src="/PawStay%20Logo.jpg"
                alt="PawStay"
                className="h-10 w-10 rounded-xl object-cover shadow-sm"
              />
              <span className="font-display text-xl font-bold">PawStay</span>
            </a>

            <p className="text-background/70 text-sm mb-6 max-w-xs">
              The smart way to book pet care, one tap away.
            </p>

            {/* Social Icons */}
            <div className="flex gap-3">
              {[
                { Icon: Facebook, href: "https://www.facebook.com/profile.php?id=61587235174522" },
                { Icon: Instagram, href: "https://www.instagram.com/pawstay.ph/" },
                { Icon: Mail, href: "mailto:pawstayph@gmail.com" },
              ].map(({ Icon, href }, index) => (
                <a
                  key={index}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
                >
                  <Icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-background/70 hover:text-background transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">Services</h4>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-background/70 hover:text-background transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-background/70 hover:text-background transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-background/70 hover:text-background transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-background/10">
        <div className="container py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/50">
            © 2025 PawStay. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;