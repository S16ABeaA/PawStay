import { CheckCircle2, Clock, Users, Star } from "lucide-react";

const ListPropertyHero = () => {
  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-primary/5 to-background">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            List Your Property on{" "}
            <span className="text-gradient">PawStay</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            Join thousands of pet care providers and start
            earning today. It only takes 10 minutes to get
            started.
          </p>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <span>Free to list</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span>Go live in 24 hours</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            <span>2,500+ active partners</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-rating" />
            <span>4.8 partner satisfaction</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ListPropertyHero;