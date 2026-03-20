import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PetAnalyzer from "@/components/ai/PetAnalyzer";

const PetAnalyzerPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <PetAnalyzer />
      </main>
      <Footer />
    </div>
  );
};

export default PetAnalyzerPage;
