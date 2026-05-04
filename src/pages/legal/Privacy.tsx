import { Link } from "react-router-dom";
import {
  BellRing,
  Clock3,
  Cookie,
  Database,
  Lock,
  RefreshCw,
  Share2,
  SlidersHorizontal,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const privacySections = [
  {
    id: "collection",
    title: "Information We Collect",
    icon: Database,
    content:
      "We may collect account details, booking and pet information, payment-related metadata from partners, and usage data such as browser and device details.",
    bullets: [
      "Account details such as name, email, and profile data",
      "Booking details, pet information, and service preferences",
      "Payment-related metadata from payment partners",
      "Usage data such as pages visited and device details",
    ],
  },
  {
    id: "usage",
    title: "How We Use Information",
    icon: BellRing,
    content:
      "We use personal data to deliver and improve PawStay features, send important updates, prevent fraud, enforce platform rules, and comply with legal obligations.",
    bullets: [
      "Provide and improve booking, support, and account features",
      "Send confirmations, updates, and security notifications",
      "Prevent fraud and maintain platform safety",
      "Comply with legal and regulatory obligations",
    ],
  },
  {
    id: "sharing",
    title: "Sharing of Information",
    icon: Share2,
    content:
      "We share necessary information with booked providers, payment processors, and technical partners that support operations. We may also disclose information when required by law or to protect users and the platform.",
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
    content:
      "We retain data only as long as necessary for the purposes in this policy, including legal, accounting, dispute resolution, and security requirements.",
  },
  {
    id: "security",
    title: "Data Security",
    icon: Lock,
    content:
      "We implement reasonable technical and organizational safeguards to protect personal data. Because no online method is fully secure, we encourage users to protect account credentials and device access.",
  },
  {
    id: "choices",
    title: "Your Privacy Choices",
    icon: SlidersHorizontal,
    content:
      "Depending on your location, you may have rights to access, correct, or delete personal data and object to certain processing activities. You can submit requests through support.",
  },
  {
    id: "changes",
    title: "Changes to This Policy",
    icon: RefreshCw,
    content:
      "We may update this Privacy Policy from time to time. Material updates are posted on this page with an updated effective date.",
  },
];

const Privacy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50/70 via-background to-background">
      <Header />

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-8 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

        <section className="container max-w-6xl px-4 pt-12 md:pt-16">
          <div className="rounded-3xl border border-accent/15 bg-gradient-to-br from-white via-teal-50/60 to-white p-6 shadow-card md:p-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
              <Lock className="h-3.5 w-3.5" />
              Legal
            </div>

            <h1 className="text-3xl font-bold leading-tight md:text-5xl">Privacy Policy</h1>

            <p className="mt-4 max-w-3xl text-muted-foreground md:text-lg">
              This policy describes what information we collect, why we collect it, and how we protect your
              data while you use PawStay.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full bg-background px-3 py-1 text-muted-foreground border">Effective date: April 15, 2026</span>
              <span className="rounded-full bg-background px-3 py-1 text-muted-foreground border">Cookies and privacy controls available</span>
            </div>
          </div>
        </section>

        <section className="container max-w-6xl px-4 py-10 md:py-12">
          <div className="grid gap-8 lg:grid-cols-[260px,1fr]">
            <aside className="lg:sticky lg:top-24 self-start">
              <div className="rounded-2xl border bg-card/90 p-5 shadow-soft backdrop-blur-sm">
                <h2 className="text-base font-semibold">On this page</h2>
                <nav className="mt-4 space-y-2">
                  {privacySections.map((section, index) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/5 hover:text-foreground"
                    >
                      <span className="text-xs text-accent/80">{index + 1}.</span>
                      {section.title}
                    </a>
                  ))}
                  <a
                    href="#contact"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/5 hover:text-foreground"
                  >
                    <span className="text-xs text-accent/80">9.</span>
                    Contact
                  </a>
                </nav>
              </div>
            </aside>

            <div className="space-y-4 md:space-y-5">
              {privacySections.map((section, index) => {
                const Icon = section.icon;

                return (
                  <section
                    key={section.id}
                    id={section.id}
                    className="scroll-mt-28 rounded-2xl border bg-card/95 p-5 shadow-soft transition-transform duration-300 hover:-translate-y-0.5 md:p-6"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h2 className="text-lg font-semibold md:text-xl">
                        {index + 1}. {section.title}
                      </h2>
                    </div>

                    <p className="text-muted-foreground">{section.content}</p>

                    {section.bullets && (
                      <ul className="mt-4 space-y-2 text-muted-foreground">
                        {section.bullets.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}

              <section id="contact" className="scroll-mt-28 rounded-2xl border bg-gradient-card p-6 shadow-soft md:p-7">
                <h2 className="text-xl font-semibold">9. Contact</h2>
                <p className="mt-3 text-muted-foreground">
                  For privacy-related concerns, contact our support team at <a href="mailto:pawstayph@gmail.com" className="text-accent hover:underline">pawstayph@gmail.com</a>.
                </p>
              </section>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Privacy;
