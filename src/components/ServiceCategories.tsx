import { Home, Scissors, Stethoscope, Car, Users, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const services = [
  {
    icon: Home,
    title: "Pet Boarding",
    description: "Comfortable stays with 24/7 care and supervision",
    color: "bg-primary/10 text-primary",
    path: "/hotels",
  },
  {
    icon: Scissors,
    title: "Grooming",
    description: "Professional spa and grooming services",
    color: "bg-accent/10 text-accent",
    path: "/grooming",
  },
  {
    icon: Stethoscope,
    title: "Veterinary",
    description: "On-site health checkups and medical care",
    color: "bg-success/10 text-success",
    path: "/veterinary",
  },
  {
    icon: Car,
    title: "Pet Taxi",
    description: "Safe pickup and drop-off for your fur babies",
    color: "bg-rating/10 text-rating",
    comingSoon: true,
  },
  {
    icon: Users,
    title: "Animal Shelter",
    description: "Rescue, adoption, and shelter resources",
    color: "bg-success/10 text-success",
    comingSoon: true,
  },
  {
    icon: Heart,
    title: "Cremation Services",
    description: "Respectful aftercare and cremation options",
    color: "bg-destructive/10 text-destructive",
    comingSoon: true,
  },
];

const ServiceCategories = () => {
  return (
    <section className="py-16 md:py-20">
      <div className="container">
        <div className="text-center mb-10 md:mb-12">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
            All-in-One Pet Care
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Everything your fur baby needs under one roof — from cozy stays to expert care
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {services.map((service, index) => {
            const isComing = !!service.comingSoon;

            const card = (
              <div
                className={`group relative block bg-card rounded-2xl p-6 shadow-soft transition-all duration-300 ${isComing ? 'opacity-95 cursor-not-allowed border border-destructive/10 shadow-md' : 'hover:shadow-card cursor-pointer hover:-translate-y-1'}`}
                role={isComing ? 'button' : undefined}
                aria-disabled={isComing ? 'true' : undefined}
                tabIndex={isComing ? 0 : undefined}
              >
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${service.color} mb-4 ${isComing ? '' : 'group-hover:scale-110 transition-transform'}`}>
                  <service.icon className="h-7 w-7" />
                </div>
                <h3 className="font-semibold text-lg text-foreground mb-1">
                  <span>{service.title}</span>
                </h3>

                {isComing && (
                  <div className="absolute top-3 right-3">
                    <div className="inline-flex items-center rounded-full bg-destructive text-destructive-foreground px-3 py-1 text-sm font-semibold animate-pulse shadow-md">
                      Coming Soon
                    </div>
                  </div>
                )}

                <p className="text-sm text-muted-foreground">
                  {service.description}
                </p>
              </div>
            );

            if (isComing) {
              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    {card}
                  </TooltipTrigger>
                  <TooltipContent>Coming soon — stay tuned!</TooltipContent>
                </Tooltip>
              );
            }

            return (
              <Link key={index} to={service.path} aria-label={`Go to ${service.title}`}>
                {card}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServiceCategories;
