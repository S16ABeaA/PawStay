import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import VeterinaryCard from "@/components/VeterinaryCard";
import { fetchProperties } from "@/services/propertyApi";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const Veterinary = () => {
  const [clinics, setClinics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVets = async () => {
      try {
        const data = await fetchProperties({ propertyType: "veterinary" });
        setClinics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadVets();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-16 md:py-24 bg-gradient-to-b from-success/10 to-background">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-success/10 text-success border-success/20 mb-4">Veterinary Care</Badge>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-4">
                Find Expert Care for Your <span className="text-gradient">Beloved Pets</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8">Connect with trusted veterinary clinics offering compassionate, comprehensive care for all your pet's health needs.</p>
            </div>
            <div className="relative hidden lg:block">
              <img src="https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=600" className="rounded-2xl shadow-elevated" alt="Veterinary" />
            </div>
          </div>
        </div>
      </section>

      <main className="container py-12">
        <h1 className="text-4xl font-bold mb-8">Veterinary Clinics</h1>
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clinics.map((c) => (
              <VeterinaryCard key={c.id} clinic={{
                ...c,
                image: c.cover_image || "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800",
                location: c.city,
                price: c.cheapest_service_price,
                services: ["Consultation", "Vaccination"],
                rating: c.rating || 0,
                reviews: c.review_count || 0
              }} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};
export default Veterinary;
