import { Link } from "react-router-dom";
import {
  AlertTriangle,
  BookOpenText,
  CalendarClock,
  CreditCard,
  Gavel,
  MessagesSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const termsSections = [
  {
    id: "eligibility",
    title: "Eligibility and Account Responsibility",
    icon: ShieldCheck,
    content:
      "You must provide accurate and complete information when creating an account. You are responsible for safeguarding your credentials and for activity that happens under your account.",
  },
  {
    id: "booking",
    title: "Booking and Payment Terms",
    icon: CreditCard,
    content:
      "Booking prices, service inclusions, and availability are shown in the app and may change over time. Payments are processed through supported channels and must be completed before a booking is confirmed.",
  },
  {
    id: "cancellations",
    title: "Cancellations and Refunds",
    icon: CalendarClock,
    content:
      "Cancellation and refund policies may differ per provider. PawStay displays policy details before checkout. Approved refunds are returned using the original payment method, subject to payment processor timelines.",
  },
  {
    id: "conduct",
    title: "User Conduct",
    icon: Users,
    content:
      "You agree not to misuse the platform. Prohibited conduct includes submitting false information, attempting unauthorized access, or using PawStay for unlawful and harmful activities.",
    bullets: [
      "Submitting false listings, reviews, or booking details",
      "Attempting unauthorized access to accounts, systems, or data",
      "Using PawStay to engage in unlawful, abusive, or harmful activity",
    ],
  },
  {
    id: "content",
    title: "Reviews and Content",
    icon: MessagesSquare,
    content:
      "You retain ownership of your content, but you grant PawStay permission to display and distribute it in connection with platform operations. We may remove content that violates our rules or applicable law.",
  },
  {
    id: "availability",
    title: "Service Availability and Changes",
    icon: BookOpenText,
    content:
      "We work to keep PawStay available and accurate, but we cannot guarantee uninterrupted access. We may update, modify, or discontinue features at any time to improve service quality or security.",
  },
  {
    id: "liability",
    title: "Limitation of Liability",
    icon: AlertTriangle,
    content:
      "To the extent permitted by law, PawStay is not liable for indirect, incidental, or consequential damages resulting from your use of the platform, provider actions, or third-party services.",
  },
  {
    id: "updates",
    title: "Updates to These Terms",
    icon: Gavel,
    content:
      "We may revise these Terms from time to time. Updated versions will be posted on this page with a revised effective date. Continued use of PawStay after an update means you accept the revised Terms.",
  },
];

const Terms = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/80 via-background to-background">
      <Header />

      <main className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-8 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

        <section className="container max-w-6xl px-4 pt-12 md:pt-16">
          <div className="rounded-3xl border border-primary/10 bg-gradient-to-br from-white via-orange-50/70 to-white p-6 shadow-card md:p-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
              <Gavel className="h-3.5 w-3.5" />
              Legal
            </div>

            <h1 className="text-3xl font-bold leading-tight md:text-5xl">Terms of Service</h1>

            <p className="mt-4 max-w-3xl text-muted-foreground md:text-lg">
              These terms explain how PawStay works, what you can expect from us, and what we expect from
              users and service providers.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full bg-background px-3 py-1 text-muted-foreground border">Effective date: April 15, 2026</span>
              <span className="rounded-full bg-background px-3 py-1 text-muted-foreground border">Applies to all PawStay users</span>
            </div>
          </div>
        </section>

        <section className="container max-w-6xl px-4 py-10 md:py-12">
          <div className="grid gap-8 lg:grid-cols-[260px,1fr]">
            <aside className="lg:sticky lg:top-24 self-start">
              <div className="rounded-2xl border bg-card/90 p-5 shadow-soft backdrop-blur-sm">
                <h2 className="text-base font-semibold">On this page</h2>
                <nav className="mt-4 space-y-2">
                  {termsSections.map((section, index) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground"
                    >
                      <span className="text-xs text-primary/70">{index + 1}.</span>
                      {section.title}
                    </a>
                  ))}
                  <a
                    href="#contact"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground"
                  >
                    <span className="text-xs text-primary/70">9.</span>
                    Contact
                  </a>
                </nav>
              </div>
            </aside>

            <div className="space-y-4 md:space-y-5">
              {termsSections.map((section, index) => {
                const Icon = section.icon;

                return (
                  <section
                    key={section.id}
                    id={section.id}
                    className="scroll-mt-28 rounded-2xl border bg-card/95 p-5 shadow-soft transition-transform duration-300 hover:-translate-y-0.5 md:p-6"
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
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
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}

              <section id="contact" className="scroll-mt-28 rounded-2xl border bg-gradient-card p-6 shadow-soft md:p-7">
                <h2 className="text-xl font-semibold">9. Contact Us</h2>
                <p className="mt-3 text-muted-foreground">
                  Questions about these Terms can be sent to <a href="mailto:pawstayph@gmail.com" className="text-primary hover:underline">pawstayph@gmail.com</a>.
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

export default Terms;
