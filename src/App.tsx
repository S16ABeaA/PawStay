import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Hotels from "./pages/Hotels";
import HotelDetail from "./pages/HotelDetail";
import Grooming from "./pages/Grooming";
import GroomingDetail from "./pages/GroomingDetail";
import Veterinary from "./pages/Veterinary";
import VeterinaryDetail from "./pages/VeterinaryDetail";
import About from "./pages/About";
import SignIn from "./pages/SignIn";
import CheckEmail from "./pages/CheckEmail";
import ListProperty from "./pages/ListProperty";
import Favorites from "./pages/Favorites";
import Booking from "./pages/Booking";
import SearchResults from "./pages/SearchResults";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import MyPets from "./pages/MyPets";
import MyBookings from "./pages/MyBookings";
import RequireAuth from "./components/RequireAuth";

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
          <Route path="/check-email" element={<CheckEmail />} />
          <Route
            path="/list-property"
            element={
              <RequireAuth>
                <ListProperty />
              </RequireAuth>
            }
          />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/search" element={<SearchResults />} />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route path="/my-pets" element={<MyPets />} />
          <Route
            path="/my-bookings"
            element={
              <RequireAuth>
                <MyBookings />
              </RequireAuth>
            }
          />
          
          {/* Admin routes */}
          <Route
            path="/admin"
            element={
              <RequireAuth allowedRoles={["proprietor"]}>
                <AdminDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <RequireAuth allowedRoles={["proprietor"]}>
                <AdminBookings />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/services"
            element={
              <RequireAuth allowedRoles={["proprietor"]}>
                <AdminServices />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <RequireAuth allowedRoles={["proprietor"]}>
                <AdminReviews />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <RequireAuth allowedRoles={["proprietor"]}>
                <AdminSettings />
              </RequireAuth>
            }
          />
          
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
