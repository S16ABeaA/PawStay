import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Hotels from "./pages/Hotels";
import HotelDetail from "./pages/HotelDetail";
import Grooming from "./pages/Grooming";
import GroomingDetail from "./pages/GroomingDetail";
import Veterinary from "./pages/Veterinary";
import VeterinaryDetail from "./pages/VeterinaryDetail";
import About from "./pages/About";
import SignIn from "./pages/SignIn";
import ListProperty from "./pages/ListProperty";
import Favorites from "./pages/Favorites";
import Booking from "./pages/Booking";
import SearchResults from "./pages/SearchResults";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminBookings from "./pages/admin/Bookings";
import AdminServices from "./pages/admin/Services";
import AdminReviews from "./pages/admin/Reviews";
import AdminSettings from "./pages/admin/Settings";

// SuperAdmin pages
import SuperAdminDashboard from "./pages/superadmin/Dashboard";
import SuperAdminUsers from "./pages/superadmin/Users";
import SuperAdminProperties from "./pages/superadmin/Properties";
import SuperAdminAnalytics from "./pages/superadmin/Analytics";
import SuperAdminRevenue from "./pages/superadmin/Revenue";
import SuperAdminSupport from "./pages/superadmin/Support";
import SuperAdminSettings from "./pages/superadmin/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
      <ScrollToTop />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/hotels/:id" element={<HotelDetail />} />
          <Route path="/grooming" element={<Grooming />} />
          <Route path="/grooming/:id" element={<GroomingDetail />} />
          <Route path="/veterinary" element={<Veterinary />} />
          <Route path="/veterinary/:id" element={<VeterinaryDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/list-property" element={<ListProperty />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/search" element={<SearchResults />} />
          
          {/* Admin routes */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/bookings" element={<AdminBookings />} />
          <Route path="/admin/services" element={<AdminServices />} />
          <Route path="/admin/reviews" element={<AdminReviews />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          
          {/* SuperAdmin routes */}
          <Route path="/superadmin" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/users" element={<SuperAdminUsers />} />
          <Route path="/superadmin/properties" element={<SuperAdminProperties />} />
          <Route path="/superadmin/analytics" element={<SuperAdminAnalytics />} />
          <Route path="/superadmin/revenue" element={<SuperAdminRevenue />} />
          <Route path="/superadmin/support" element={<SuperAdminSupport />} />
          <Route path="/superadmin/settings" element={<SuperAdminSettings />} />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
