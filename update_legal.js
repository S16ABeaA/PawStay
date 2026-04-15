const fs = require('fs');

const termsCode = `import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertTriangle, BookOpenText, CalendarClock, CreditCard,
  Gavel, MessagesSquare, ShieldCheck, Users, ArrowRight, CheckCircle2
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const termsSections = [
  {
    id: "eligibility",
    title: "Eligibility and Account Responsibility",
    icon: ShieldCheck,
    content: "You must provide accurate and complete information when creating an account. You are responsible for safeguarding your credentials and for activity that happens under your account."
  },
  {
    id: "booking",
    title: "Booking and Payment Terms",
    icon: CreditCard,
    content: "Booking prices, service inclusions, and availability are shown in the app and may change over time. Payments are processed through supported channels and must be completed before a booking is confirmed."
  },
  {
    id: "cancellations",
    title: "Cancellations and Refunds",
    icon: CalendarClock,
    content: "Cancellation and refund policies may differ per provider. PawStay displays policy details before checkout. Approved refunds are returned using the original payment method, subject to payment processor timelines."
  },
  {
    id: "conduct",
    title: "User Conduct",
    icon: Users,
    content: "You agree not to misuse the platform. Prohibited conduct includes submitting false information, attempting unauthorized access, or using PawStay for unlawful and harmful activities.",
    bullets: [
      "Submitting false listings, reviews, or booking details",
      "Attempting unauthorized access to accounts, systems, or data",
      "Using PawStay to engage in unlawful, abusive, or harmful activity"
    ]
  },
  {
    id: "content",
    title: "Reviews and Content",
    icon: MessagesSquare,
    content: "You retain ownership of your content, but you grant PawStay permission to display and distribute it in connection with platform operations. We may remove content that violates our rules or applicable law."
  },
  {
    id: "availability",
    title: "Service Availability and Changes",
    icon: BookOpenText,
    content: "We work to keep PawStay available and accurate, but we cannot guarantee uninterrupted access. We may update, modify, or discontinue features at any time to improve service quality or security."
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    icon: AlertTriangle,
    content: "To the extent permitted by law, PawStay is not liable for indirect, incidental, or consequential damages resulting from your use of the platform, provider actions, or third-party services."
  },
  {
    id: "updates",
    title: "Updates to These Terms",
    icon: Gavel,
    content: "We may revise these Terms from time to time. Updated versions will be posted on this page with a revised effective date. Continued use of PawStay after an update means you accept the revised Terms."
  }
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.1 } }
};

const Terms = () => {
  const [activeSection, setActiveSection] = useState(termsSections[0].id);

  useEffect(() => {
    const handleScroll = () => {
      const sections = termsSections.map(s => document.getElementById(s.id));
      const scrollY = window.scrollY + 250;
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollY) {
          setActiveSection(termsSections[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      <Header />
      
      <main className="relative pb-24 overflow-hidden">
        {/* Background Effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-[10%] left-[20%] h-[600px] w-[600px] rounded-full bg-primary/5 blur-[120px] animate-float" />
          <div className="absolute top-[20%] right-[10%] h-[500px] w-[500px] rounded-full bg-orange-500/5 blur-[100px] animate-float animation-delay-500" />
        </div>

        <section className="container relative z-10 pt-20 md:pt-32 pb-16 max-w-6xl px-4">
          <motion.div 
            initial="hidden" animate="visible" variants={staggerContainer}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-sm font-medium text-primary backdrop-blur-md">
              <Gavel className="h-4 w-4" />
              <span>Legal Documentation</span>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                Terms of <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-orange-500">Service</span>
              </h1>
            </motion.div>
            <motion.p variants={fadeInUp} className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
              These terms explain how PawStay works, what you can expect from us, and what we expect from users and service providers to ensure a safe, trusted community.
            </motion.p>
            <motion.div variants={fadeInUp} className="mt-8 flex flex-wrap justify-center items-center gap-4">
              <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-2 text-sm font-medium shadow-sm border border-border/50">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Effective: April 15, 2026
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-2 text-sm font-medium shadow-sm border border-border/50">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Applies to all users
              </div>
            </motion.div>
          </motion.div>
        </section>

        <section className="container relative z-10 max-w-6xl px-4">
          <div className="grid gap-12 lg:grid-cols-[280px,1fr] items-start">
            
            {/* Sticky Sidebar */}
            <aside className="hidden lg:block sticky top-28">
              <div className="relative rounded-3xl border border-border/50 bg-card/30 p-6 backdrop-blur-xl shadow-lg">
                <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                  <BookOpenText className="h-5 w-5 text-primary" />
                  Navigation
                </h3>
                <nav className="relative space-y-1">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border/50 rounded-full" />
                  
                  {termsSections.map((section, idx) => {
                    const isActive = activeSection === section.id;
                    return (
                      <a
                        key={section.id}
                        href={\`#\${section.id}\`}
                        className={\`relative flex items-center py-2.5 pl-4 pr-3 text-sm font-medium transition-all duration-300 rounded-lg \${
                          isActive ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }\`}
                      >
                        {isActive && (
                          <motion.div 
                            layoutId="activeTOC"
                            className="absolute left-[-1px] w-0.5 max-h-8 bottom-1 top-1 bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.6)]" 
                          />
                        )}
                        <span className="mr-2 opacity-50">{idx + 1}.</span>
                        <span className="truncate">{section.title}</span>
                      </a>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Content Area */}
            <div className="space-y-8 md:space-y-12">
              {termsSections.map((section, idx) => {
                const Icon = section.icon;
                return (
                  <motion.section
                    key={section.id}
                    id={section.id}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={fadeInUp}
                    className="scroll-mt-32 group relative rounded-3xl border border-border/50 bg-card/40 p-6 md:p-10 backdrop-blur-md transition-all hover:bg-card hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20"
                  >
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
                    
                    <div className="relative z-10">
                      <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary shadow-inner ring-1 ring-primary/20 group-hover:scale-110 transition-transform duration-500">
                          <Icon className="h-6 w-6" />
                        </div>
                        <h2 className="font-display text-2xl md:text-3xl font-bold">
                          <span className="text-primary/40 mr-2">{idx + 1}.</span>
                          {section.title}
                        </h2>
                      </div>
                      
                      <div className="prose prose-orange dark:prose-invert max-w-none text-muted-foreground leading-relaxed md:text-lg">
                        <p>{section.content}</p>
                        
                        {section.bullets && (
                          <ul className="mt-6 space-y-3 pl-2">
                            {section.bullets.map((item) => (
                              <li key={item} className="flex items-start gap-3">
                                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-500" />
                                <span className="text-foreground/90">{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </motion.section>
                );
              })}

              {/* Contact CTA */}
              <motion.section 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="relative overflow-hidden rounded-3xl bg-foreground px-6 py-12 md:px-12 md:py-16 text-background shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-50" />
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="max-w-xl">
                    <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Have questions about these terms?</h2>
                    <p className="text-background/80 text-lg">
                      Our support team is here to help you understand our policies and how they apply to your specific situation.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto shrink-0">
                    <Button asChild size="lg" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 text-base border-0">
                      <Link to="/help-center?new=1">
                        Contact Support
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.section>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
export default Terms;
\`;

const privacyCode = \`import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BellRing, Clock3, Cookie, Database, Lock, RefreshCw, Share2, SlidersHorizontal, CheckCircle2, ArrowRight, Shield
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const privacySections = [
  {
    id: "collection",
    title: "Information We Collect",
    icon: Database,
    content: "We may collect account details, booking and pet information, payment-related metadata from partners, and usage data such as browser and device details.",
    bullets: [
      "Account details such as name, email, and profile data",
      "Booking details, pet information, and service preferences",
      "Payment-related metadata from payment partners",
      "Usage data such as pages visited and device details"
    ]
  },
  {
    id: "usage",
    title: "How We Use Information",
    icon: BellRing,
    content: "We use personal data to deliver and improve PawStay features, send important updates, prevent fraud, enforce platform rules, and comply with legal obligations.",
    bullets: [
      "Provide and improve booking, support, and account features",
      "Send confirmations, updates, and security notifications",
      "Prevent fraud and maintain platform safety",
      "Comply with legal and regulatory obligations"
    ]
  },
  {
    id: "sharing",
    title: "Sharing of Information",
    icon: Share2,
    content: "We share necessary information with booked providers, payment processors, and technical partners that support operations. We may also disclose information when required by law or to protect users and the platform."
  },
  {
    id: "cookies",
    title: "Cookies and Similar Technologies",
    icon: Cookie,
    content: "PawStay uses cookies for authentication, analytics, and performance. You can manage cookie preferences in your browser settings, though disabling some cookies may affect functionality."
  },
  {
    id: "retention",
    title: "Data Retention",
    icon: Clock3,
    content: "We retain data only as long as necessary for the purposes in this policy, including legal, accounting, dispute resolution, and security requirements."
  },
  {
    id: "security",
    title: "Data Security",
    icon: Lock,
    content: "We implement reasonable technical and organizational safeguards to protect personal data. Because no online method is fully secure, we encourage users to protect account credentials and device access."
  },
  {
    id: "choices",
    title: "Your Privacy Choices",
    icon: SlidersHorizontal,
    content: "Depending on your location, you may have rights to access, correct, or delete personal data and object to certain processing activities. You can submit requests through support."
  },
  {
    id: "changes",
    title: "Changes to This Policy",
    icon: RefreshCw,
    content: "We may update this Privacy Policy from time to time. Material updates are posted on this page with an updated effective date."
  }
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { transition: { staggerChildren: 0.1 } }
};

const Privacy = () => {
  const [activeSection, setActiveSection] = useState(privacySections[0].id);

  useEffect(() => {
    const handleScroll = () => {
      const sections = privacySections.map(s => document.getElementById(s.id));
      const scrollY = window.scrollY + 250;
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollY) {
          setActiveSection(privacySections[i].id);
          break;
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background selection:bg-accent/30">
      <Header />
      
      <main className="relative pb-24 overflow-hidden">
        {/* Background Effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-[10%] right-[20%] h-[600px] w-[600px] rounded-full bg-accent/5 blur-[120px] animate-float" />
          <div className="absolute top-[20%] left-[10%] h-[500px] w-[500px] rounded-full bg-teal-500/5 blur-[100px] animate-float animation-delay-500" />
        </div>

        <section className="container relative z-10 pt-20 md:pt-32 pb-16 max-w-6xl px-4">
          <motion.div 
            initial="hidden" animate="visible" variants={staggerContainer}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-5 py-2 text-sm font-medium text-accent backdrop-blur-md">
              <Shield className="h-4 w-4" />
              <span>Data Protection</span>
            </motion.div>
            <motion.div variants={fadeInUp}>
              <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-teal-500">Policy</span>
              </h1>
            </motion.div>
            <motion.p variants={fadeInUp} className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
              This policy describes what information we collect, why we collect it, and how we protect your data while you explore and use PawStay.
            </motion.p>
            <motion.div variants={fadeInUp} className="mt-8 flex flex-wrap justify-center items-center gap-4">
              <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-2 text-sm font-medium shadow-sm border border-border/50">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Effective: April 15, 2026
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-card px-4 py-2 text-sm font-medium shadow-sm border border-border/50">
                <Lock className="h-4 w-4 text-accent" />
                Full Privacy Controls
              </div>
            </motion.div>
          </motion.div>
        </section>

        <section className="container relative z-10 max-w-6xl px-4">
          <div className="grid gap-12 lg:grid-cols-[280px,1fr] items-start">
            
            {/* Sticky Sidebar */}
            <aside className="hidden lg:block sticky top-28">
              <div className="relative rounded-3xl border border-border/50 bg-card/30 p-6 backdrop-blur-xl shadow-lg">
                <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                  <Database className="h-5 w-5 text-accent" />
                  Navigation
                </h3>
                <nav className="relative space-y-1">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-border/50 rounded-full" />
                  
                  {privacySections.map((section, idx) => {
                    const isActive = activeSection === section.id;
                    return (
                      <a
                        key={section.id}
                        href={\`#\${section.id}\`}
                        className={\`relative flex items-center py-2.5 pl-4 pr-3 text-sm font-medium transition-all duration-300 rounded-lg \${
                          isActive ? "text-accent bg-accent/5" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        }\`}
                      >
                        {isActive && (
                          <motion.div 
                            layoutId="activePrivacyTOC"
                            className="absolute left-[-1px] w-0.5 max-h-8 bottom-1 top-1 bg-accent rounded-full shadow-[0_0_8px_rgba(var(--accent),0.6)]" 
                          />
                        )}
                        <span className="mr-2 opacity-50">{idx + 1}.</span>
                        <span className="truncate">{section.title}</span>
                      </a>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Content Area */}
            <div className="space-y-8 md:space-y-12">
              {privacySections.map((section, idx) => {
                const Icon = section.icon;
                return (
                  <motion.section
                    key={section.id}
                    id={section.id}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    variants={fadeInUp}
                    className="scroll-mt-32 group relative rounded-3xl border border-border/50 bg-card/40 p-6 md:p-10 backdrop-blur-md transition-all hover:bg-card hover:shadow-xl hover:shadow-accent/5 hover:border-accent/20"
                  >
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/40 to-transparent dark:from-white/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
                    
                    <div className="relative z-10">
                      <div className="mb-6 flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 text-accent shadow-inner ring-1 ring-accent/20 group-hover:scale-110 transition-transform duration-500">
                          <Icon className="h-6 w-6" />
                        </div>
                        <h2 className="font-display text-2xl md:text-3xl font-bold">
                          <span className="text-accent/40 mr-2">{idx + 1}.</span>
                          {section.title}
                        </h2>
                      </div>
                      
                      <div className="prose prose-teal dark:prose-invert max-w-none text-muted-foreground leading-relaxed md:text-lg">
                        <p>{section.content}</p>
                        
                        {section.bullets && (
                          <ul className="mt-6 space-y-3 pl-2">
                            {section.bullets.map((item) => (
                              <li key={item} className="flex items-start gap-3">
                                <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-500" />
                                <span className="text-foreground/90">{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </motion.section>
                );
              })}

              {/* Contact CTA */}
              <motion.section 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                className="relative overflow-hidden rounded-3xl bg-accent px-6 py-12 md:px-12 md:py-16 text-accent-foreground shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-tl from-black/20 via-transparent to-transparent opacity-50" />
                <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="max-w-xl">
                    <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">Need help with your data?</h2>
                    <p className="text-white/90 text-lg">
                      Submit a privacy request or contact our Data Protection Officer for any inquiries.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto shrink-0">
                    <Button asChild size="lg" className="rounded-full bg-white text-accent hover:bg-white/90 h-14 px-8 text-base border-0">
                      <Link to="/help-center?new=1">
                        Open Privacy Request
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.section>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};
export default Privacy;
\`;

fs.writeFileSync('src/pages/legal/Terms.tsx', termsCode);
fs.writeFileSync('src/pages/legal/Privacy.tsx', privacyCode);
console.log('Successfully wrote new amazing UI for Terms and Privacy');
