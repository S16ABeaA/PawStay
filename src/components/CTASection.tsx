import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Clock, HeartHandshake } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5">
      <div className="container">
        <div className="relative bg-card rounded-3xl overflow-hidden shadow-elevated">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-accent rounded-full blur-3xl" />
          </div>

          <div className="relative grid lg:grid-cols-2 gap-8 p-8 md:p-12 lg:p-16">
            {/* Content */}
            <div className="flex flex-col justify-center">
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight">
                Give Your Fur Baby the{" "}
                <span className="text-gradient">Vacation</span> They Deserve
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of fur parents who trust PawStay for their furry family members. 
                Book your first stay today with our verified providers!
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link to="/hotels">
                  <Button variant="hero" size="xl" className="group">
                    Start Booking
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-5 w-5 text-success" />
                  <span>Verified Providers</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-5 w-5 text-accent" />
                  <span>24/7 Support</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <HeartHandshake className="h-5 w-5 text-primary" />
                  <span>Money-back Guarantee</span>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="relative hidden lg:flex items-center justify-center">
              <div className="relative w-full max-w-md aspect-square">
                <img
                  src="https://images.unsplash.com/photo-1544568100-847a948585b9?w=600&auto=format&fit=crop"
                  alt="Happy dog"
                  className="w-full h-full object-cover rounded-2xl shadow-card"
                />
                {/* Floating Card */}
                <div className="absolute -bottom-4 -left-4 bg-card rounded-xl p-4 shadow-elevated">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">100% Verified</p>
                      <p className="text-sm text-muted-foreground">All locations inspected</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
