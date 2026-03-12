import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
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
import ForgotPassword from "./pages/ForgotPassword";
import ListProperty from "@/pages/user/ListProperty";
import Favorites from "./pages/Favorites";
import Booking from "./pages/Booking";
import SearchResults from "./pages/SearchResults";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import MyPets from "./pages/MyPets";
import MyBookings from "./pages/MyBookings";
import Notifications from "./pages/Notifications";
import HelpCenter from "./pages/HelpCenter";
import FAQ from "./pages/FAQ";
import RequireAuth from "./components/RequireAuth";
import RequireAdmin from "./components/RequireAdmin";
import RequireSuperAdmin from "./components/RequireSuperAdmin";
import { AdminPropertyProvider } from "./hooks/useAdminProperty";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminBookings from "./pages/admin/Bookings";
import AdminServices from "./pages/admin/Services";
import AdminReviews from "./pages/admin/Reviews";
import AdminSettings from "./pages/admin/Settings";
import AdminCalendar from "./pages/admin/Calendar";

// SuperAdmin pages
import SuperAdminDashboard from "./pages/superadmin/Dashboard";
import SuperAdminUsers from "./pages/superadmin/Users";
import SuperAdminProperties from "./pages/superadmin/Properties";
import SuperAdminAnalytics from "./pages/superadmin/Analytics";
import SuperAdminRevenue from "./pages/superadmin/Revenue";
import SuperAdminSupport from "./pages/superadmin/Support";
import SuperAdminSettings from "./pages/superadmin/Settings";
import SuperAdminAmenities from "./pages/superadmin/Amenities";

const queryClient = new QueryClient();

/** Shared wrapper for all /admin routes so the property context persists across navigation */
const AdminRouteWrapper = () => (
  <RequireAuth allowedRoles={["proprietor"]}>
    <AdminPropertyProvider>
      <Outlet />
    </AdminPropertyProvider>
  </RequireAuth>
);

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/list-property"
            element={
              <RequireAuth>
                <ListProperty />
              </RequireAuth>
            }
          />
          <Route path="/favorites" element={<RequireAuth><Favorites /></RequireAuth>} />
          <Route path="/booking" element={<RequireAuth signUpFirst><Booking /></RequireAuth> } />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/help-center" element={<HelpCenter />} />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <Profile />
              </RequireAuth>
            }
          />
          <Route path="/my-pets" element={<RequireAuth><MyPets /></RequireAuth>} />
          <Route
            path="/my-bookings"
            element={
              <RequireAuth>
                <MyBookings />
              </RequireAuth>
            }
          />
          <Route
            path="/notifications"
            element={
              <RequireAuth>
                <Notifications />
              </RequireAuth>
            }
          />
          
          {/* Admin routes — single shared AdminPropertyProvider via layout route */}
          <Route path="/admin" element={<AdminRouteWrapper />}>
            <Route index element={<AdminDashboard />} />
            <Route path="bookings" element={<AdminBookings />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="calendar" element={<AdminCalendar />} />
          </Route>
          
          {/* SuperAdmin routes */}
          <Route path="/superadmin" element={<RequireSuperAdmin><SuperAdminDashboard /></RequireSuperAdmin>} />
          <Route path="/superadmin/users" element={<RequireSuperAdmin><SuperAdminUsers /></RequireSuperAdmin>} />
          <Route path="/superadmin/properties" element={<RequireSuperAdmin><SuperAdminProperties /></RequireSuperAdmin>} />
          <Route path="/superadmin/analytics" element={<RequireSuperAdmin><SuperAdminAnalytics /></RequireSuperAdmin>} />
          <Route path="/superadmin/revenue" element={<RequireSuperAdmin><SuperAdminRevenue /></RequireSuperAdmin>} />
          <Route path="/superadmin/support" element={<RequireSuperAdmin><SuperAdminSupport /></RequireSuperAdmin>} />
          <Route path="/superadmin/settings" element={<RequireSuperAdmin><SuperAdminSettings /></RequireSuperAdmin>} />
          <Route path="/superadmin/amenities" element={<RequireSuperAdmin><SuperAdminAmenities /></RequireSuperAdmin>} />
          
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ThemeProvider>
);

export default App;
