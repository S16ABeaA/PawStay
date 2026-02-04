import SearchBar from "./SearchBar";
import { Sparkles } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-secondary/50 to-background py-12 md:py-20">
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="container relative">
        <div className="text-center mb-10 md:mb-14 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
            <Sparkles className="h-4 w-4" />
            Trusted by 50,000+ fur parents
          </div>
          
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4 leading-tight">
            Find the Perfect{" "}
            <span className="text-gradient">Home Away</span>
            <br className="hidden sm:block" />
            From Home for Your Fur Baby
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Book trusted pet hotels, grooming, and veterinary services. 
            Your fur baby deserves the best care while you're away.
          </p>
        </div>

        {/* Search Bar */}
        <div className="animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <SearchBar />
        </div>

        {/* Stats */}
        <div className="mt-12 md:mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: "0.4s" }}>
          {[
            { value: "2,500+", label: "Pet Hotels" },
            { value: "98%", label: "Happy Fur Babies" },
            { value: "24/7", label: "Support" },
            { value: "4.9★", label: "Rating" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
