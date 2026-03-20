import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AiChatPanel } from "@/components/ai/AiChatPanel";

const AiChat = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-2xl">
          <h1 className="text-2xl font-bold mb-1">PawStay AI Assistant</h1>
          <p className="text-muted-foreground text-sm mb-4">
            Ask about pet services, bookings, cancellations, and more.
          </p>
          <AiChatPanel variant="page" className="h-[70vh] min-h-[520px] max-h-[760px]" />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AiChat;
