import { ReactNode, useEffect, useState, useRef } from "react";
import SuperAdminSidebar from "./SuperAdminSidebar";
import { Search, ChevronDown, LogOut, User, ChevronRight, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/NotificationBell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { authApi } from "@/services/authApi";
import { useToast } from "@/hooks/use-toast";

interface SuperAdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export type SAUser = { firstName: string; lastName: string; email: string } | null;

const BREADCRUMB_MAP: Record<string, string> = {
  "/superadmin": "Dashboard",
  "/superadmin/users": "Users",
  "/superadmin/properties": "Properties",
  "/superadmin/analytics": "Analytics",
  "/superadmin/revenue": "Revenue",
  "/superadmin/support": "Support",
  "/superadmin/settings": "Settings",
};

const SuperAdminLayout = ({ children, title, subtitle }: SuperAdminLayoutProps) => {
  const [user, setUser] = useState<SAUser>(null);
  const [clock, setClock] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Apply Inter font to document.body so Radix portals (dialogs, dropdowns, etc.)
    // that render outside .sa-panel also inherit Inter instead of the global Calli Cat.
    document.body.classList.add("sa-panel");
    return () => {
      document.body.classList.remove("sa-panel");
    };
  }, []);

  useEffect(() => {
    authApi.getProfile().then((profile) => {
      if (profile?.user) {
        setUser({
          firstName: profile.user.first_name || "",
          lastName: profile.user.last_name || "",
          email: profile.user.email || "",
        });
      }
    }).catch(() => {});
  }, []);

  // Live clock
  useEffect(() => {
    const fmt = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }));
    };
    fmt();
    const id = setInterval(fmt, 30_000);
    return () => clearInterval(id);
  }, []);

  // Scroll to top on page change
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  // Breadcrumb segments
  const crumbs = (() => {
    const path = location.pathname;
    const parts: { label: string; href: string }[] = [{ label: "Dashboard", href: "/superadmin" }];
    if (path !== "/superadmin") {
      const label = BREADCRUMB_MAP[path] ?? path.split("/").pop() ?? "";
      parts.push({ label, href: path });
    }
    return parts;
  })();

  const handleLogout = async () => {
    try {
      await authApi.signOut();
      localStorage.removeItem("pawstay.authenticated");
      navigate("/signin");
    } catch {
      toast({ title: "Error", description: "Failed to sign out." });
    }
  };

  const initials = user
    ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
    : "SA";

  return (
    <div className="sa-panel min-h-screen bg-[#1b1b1b] flex">
      <SuperAdminSidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* ── Top Header ── */}
        <header className="sticky top-0 z-30 h-16 bg-[#1b1b1b]/80 backdrop-blur-md border-b border-white/[0.06] flex items-center gap-4 px-6">
          {/* Breadcrumb + title */}
          <div className="flex-1 min-w-0">
            <nav className="flex items-center gap-1 text-xs text-[#808080] mb-0.5">
              {crumbs.map((c, i) => (
                <span key={c.href} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3 text-[#808080]/40" />}
                  {i === crumbs.length - 1 ? (
                    <span className="text-white/60 font-medium">{c.label}</span>
                  ) : (
                    <Link to={c.href} className="hover:text-[#ffa31a] transition-colors">{c.label}</Link>
                  )}
                </span>
              ))}
            </nav>
            <h1 className="text-base font-semibold text-white truncate leading-tight">{title}</h1>
          </div>

          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#808080] pointer-events-none" />
            <Input
              placeholder="Search…"
              className="pl-9 w-56 h-9 bg-[#292929] border-white/10 text-sm text-white placeholder:text-[#808080] focus-visible:ring-[#ffa31a]/40 focus-visible:border-[#ffa31a]/40 rounded-lg"
            />
          </div>

          {/* Live clock */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-[#808080]">
            <Clock className="h-3.5 w-3.5" />
            <span className="tabular-nums">{clock}</span>
          </div>

          <div className="w-px h-6 bg-white/[0.06] hidden lg:block" />

          {/* Notification bell */}
          <NotificationBell />

          {/* User avatar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/[0.05] transition-colors outline-none">
                <Avatar className="h-7 w-7 ring-2 ring-[#ffa31a]/40">
                  <AvatarFallback className="bg-[#ffa31a]/20 text-[#ffa31a] text-[11px] font-bold border border-[#ffa31a]/30">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {user && (
                  <span className="hidden md:block text-sm text-white font-medium">
                    {user.firstName}
                  </span>
                )}
                <ChevronDown className="h-3.5 w-3.5 text-[#808080]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52 bg-[#292929] border-white/10 text-white"
            >
              <div className="px-3 py-2 border-b border-white/[0.06]">
                <p className="text-sm font-semibold text-white">
                  {user ? `${user.firstName} ${user.lastName}` : "Super Admin"}
                </p>
                <p className="text-xs text-[#808080] truncate">{user?.email}</p>
              </div>
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center gap-2 cursor-pointer focus:bg-white/[0.05] text-white/80">
                  <User className="h-4 w-4" />
                  View Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/[0.06]" />
              <DropdownMenuItem
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-400 focus:bg-white/[0.05] focus:text-red-400 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* ── Page Content ── */}
        <main ref={mainRef} className="flex-1 overflow-auto p-6 md:p-8">
          <div className="sa-animate-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
