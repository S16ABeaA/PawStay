import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Hotels from "./pages/Hotels";
import HotelDetail from "./pages/HotelDetail";
import Grooming from "./pages/Grooming";
import Veterinary from "./pages/Veterinary";
import ShopDetail from "./pages/ShopDetail";
import About from "./pages/About";
import SignIn from "./pages/SignIn";
import ListProperty from "./pages/ListProperty";
import Favorites from "./pages/Favorites";
import Booking from "./pages/Booking";
import SearchResults from "./pages/SearchResults";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/hotels/:id" element={<HotelDetail />} />
          <Route path="/shops/:id" element={<ShopDetail />} />
          <Route path="/grooming" element={<Grooming />} />
          <Route path="/veterinary" element={<Veterinary />} />
          <Route path="/about" element={<About />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/list-property" element={<ListProperty />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
