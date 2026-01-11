import { Home, Scissors, Stethoscope, Car } from "lucide-react";

const services = [
  {
    icon: Home,
    title: "Pet Boarding",
    description: "Comfortable stays with 24/7 care and supervision",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: Scissors,
    title: "Grooming",
    description: "Professional spa and grooming services",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Stethoscope,
    title: "Veterinary",
    description: "On-site health checkups and medical care",
    color: "bg-success/10 text-success",
  },
  {
    icon: Car,
    title: "Pet Taxi",
    description: "Safe pickup and drop-off for your pets",
    color: "bg-rating/10 text-rating",
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
            Everything your pet needs under one roof — from cozy stays to expert care
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {services.map((service, index) => (
            <div
              key={index}
              className="group relative bg-card rounded-2xl p-6 shadow-soft hover:shadow-card transition-all duration-300 cursor-pointer hover:-translate-y-1"
            >
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${service.color} mb-4 group-hover:scale-110 transition-transform`}>
                <service.icon className="h-7 w-7" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-1">
                {service.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceCategories;
