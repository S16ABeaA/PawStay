import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import {
  HelpCircle,
  PawPrint,
  Building2,
  MessageCircle,
  Headphones,
} from "lucide-react";

/* ─── FAQ data ─── */

const generalFAQs = [
  {
    q: "What is PawStay?",
    a: "PawStay is an online platform that connects pet owners with trusted pet service providers including pet hotels, grooming services, daycare facilities, and veterinary clinics.",
  },
  {
    q: "Do I need an account to use PawStay?",
    a: "Yes. Creating an account allows you to manage bookings, track reservations, leave reviews, and receive confirmations.",
  },
  {
    q: "Is PawStay free to use?",
    a: "Yes. Browsing listings and creating an account is free. You only pay when you book a service with a provider.",
  },
  {
    q: "Is my payment secure?",
    a: "Yes. PawStay uses encrypted payment processing to ensure your payment information is safe and secure.",
  },
  {
    q: "How do I contact support?",
    a: "You can contact our support team through the Help Center by submitting a ticket and our team will assist you as soon as possible.",
  },
];

const petOwnerFAQs = [
  {
    q: "How do I book a pet hotel?",
    a: "Browse our pet hotels, select your preferred dates, choose the room type that fits your pet, and confirm your booking. You'll receive a confirmation email with all the details.",
  },
  {
    q: "What is the cancellation policy?",
    a: "Cancellations made at least 48 hours before check-in are fully refundable. Cancellations within 48 hours may be subject to a one-night charge.",
  },
  {
    q: "Can I book grooming and veterinary services together?",
    a: "Yes! You can bundle grooming and veterinary appointments with your hotel stay or book them individually.",
  },
  {
    q: "How are properties verified?",
    a: "Every property on PawStay goes through a verification process where we check licenses, facilities, and staff qualifications.",
  },
  {
    q: "What happens in case of a medical emergency?",
    a: "All listed hotels have emergency veterinary contacts on file. In case of emergency the facility will contact the nearest vet and notify you immediately.",
  },
  {
    q: "Can I visit before booking?",
    a: "Yes. Many properties allow visits or tours before booking. You can contact them directly through the listing page.",
  },
  {
    q: "How do reviews work?",
    a: "After your pet's stay, you can leave a review and rating to help other pet owners choose the best services.",
  },
];

const proprietorFAQs = [
  {
    q: "How do I list my property on PawStay?",
    a: 'Click "List Your Property", fill in your property details including photos, services, pricing and submit for review.',
  },
  {
    q: "What fees does PawStay charge?",
    a: "PawStay charges a small service fee on each completed booking. There are no upfront costs.",
  },
  {
    q: "How do I manage bookings?",
    a: "Once approved, you will have access to a dashboard where you can manage bookings, availability, and customer communication.",
  },
  {
    q: "Can I offer multiple services?",
    a: "Yes. You can offer services such as boarding, grooming, daycare, and veterinary care.",
  },
  {
    q: "How do I receive payments?",
    a: "Payments are transferred to your linked bank account after the guest's stay has been completed.",
  },
  {
    q: "What if a customer cancels?",
    a: "Late cancellations may still result in partial payment depending on the cancellation policy you set.",
  },
  {
    q: "How do I respond to reviews?",
    a: "You can reply to reviews directly from your dashboard to build trust with potential customers.",
  },
];

/* ─── Component ─── */

const FAQ = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    "general" | "owners" | "proprietors"
  >("general");

  const faqList =
    activeTab === "general"
      ? generalFAQs
      : activeTab === "owners"
      ? petOwnerFAQs
      : proprietorFAQs;

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/60 via-white to-white">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="container text-center max-w-3xl mx-auto px-4">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange-600 mb-6">
            <HelpCircle className="h-3.5 w-3.5" />
            Frequently Asked Questions
          </span>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Got Questions? We've Got Answers
          </h1>

          <p className="text-muted-foreground text-lg">
            Find answers about using PawStay whether you're a pet owner or a
            business proprietor.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <section className="container max-w-4xl mx-auto px-4 mb-10">
        <div className="flex justify-center">
          <div className="inline-flex rounded-xl bg-orange-50 p-1 gap-1">
            <button
              onClick={() => setActiveTab("general")}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium ${
                activeTab === "general"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              <HelpCircle className="h-4 w-4" />
              General
            </button>

            <button
              onClick={() => setActiveTab("owners")}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium ${
                activeTab === "owners"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              <PawPrint className="h-4 w-4" />
              Pet Owners
            </button>

            <button
              onClick={() => setActiveTab("proprietors")}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium ${
                activeTab === "proprietors"
                  ? "bg-white text-orange-600 shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              <Building2 className="h-4 w-4" />
              Proprietors
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container max-w-4xl mx-auto px-4 pb-10">
        <Card className="rounded-2xl border shadow-sm">
          <CardContent className="p-6 md:p-8">
            <Accordion type="single" collapsible>
              {faqList.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent>{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </section>

      {/* Contact Section */}
      <section className="container max-w-4xl mx-auto px-4 pb-20">
        <Card className="rounded-2xl border bg-orange-50 shadow-sm">
          <CardContent className="flex flex-col items-center text-center p-10">
            <div className="flex items-center justify-center h-14 w-14 rounded-full bg-orange-100 text-orange-500 mb-5">
              <Headphones className="h-7 w-7" />
            </div>

            <h3 className="text-2xl font-bold mb-2">Still need help?</h3>

            <p className="text-muted-foreground max-w-md mb-6">
              Can't find what you're looking for? Our support team is ready to
              assist you.
            </p>

            <Button
              onClick={() => navigate("/help-center?new=1")}
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-8 py-3 gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Contact Us
            </Button>
          </CardContent>
        </Card>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
