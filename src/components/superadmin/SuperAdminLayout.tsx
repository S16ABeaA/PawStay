import { ReactNode, useEffect, useState } from "react";
import SuperAdminSidebar from "./SuperAdminSidebar";
import { Bell, Search, ChevronDown, LogOut, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/services/authApi";
import { useToast } from "@/hooks/use-toast";

interface SuperAdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export type SAUser = { firstName: string; lastName: string; email: string } | null;

const SuperAdminLayout = ({ children, title, subtitle }: SuperAdminLayoutProps) => {
  const [user, setUser] = useState<SAUser>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

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
        <header className="sticky top-0 z-30 h-16 bg-[#1b1b1b]/95 backdrop-blur-sm border-b border-white/[0.06] flex items-center gap-4 px-6">
          {/* Page title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-semibold text-white truncate">{title}</h1>
            {subtitle && <p className="text-xs text-[#808080] truncate">{subtitle}</p>}
          </div>

          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#808080] pointer-events-none" />
            <Input
              placeholder="Search…"
              className="pl-9 w-56 h-9 bg-[#292929] border-white/10 text-sm text-white placeholder:text-[#808080] focus-visible:ring-[#ffa31a]/40 focus-visible:border-[#ffa31a]/40 rounded-lg"
            />
          </div>

          {/* Notification bell */}
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-lg text-[#808080] hover:text-white hover:bg-white/[0.05]"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ffa31a] ring-2 ring-[#1b1b1b]" />
          </Button>

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
        <main className="flex-1 overflow-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
