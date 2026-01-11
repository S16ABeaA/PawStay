import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ServiceCategories from "@/components/ServiceCategories";
import FeaturedHotels from "@/components/FeaturedHotels";
import Testimonials from "@/components/Testimonials";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ServiceCategories />
        <FeaturedHotels />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
