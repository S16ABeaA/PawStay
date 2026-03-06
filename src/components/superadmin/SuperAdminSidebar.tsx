import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Users, Building2, BarChart3, Settings,
  LogOut, PawPrint, ChevronLeft, Menu, Shield, DollarSign, MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SAUser } from "./SuperAdminLayout";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard",  href: "/superadmin",            exact: true  },
  { icon: Users,           label: "Users",       href: "/superadmin/users",      exact: false },
  { icon: Building2,       label: "Properties",  href: "/superadmin/properties", exact: false },
  { icon: BarChart3,       label: "Analytics",   href: "/superadmin/analytics",  exact: false },
  { icon: DollarSign,      label: "Revenue",     href: "/superadmin/revenue",    exact: false },
  { icon: PawPrint,        label: "Amenities",    href: "/superadmin/amenities",  exact: false },
  { icon: MessageSquare,   label: "Support",     href: "/superadmin/support",    exact: false },
  { icon: Settings,        label: "Settings",    href: "/superadmin/settings",   exact: false },
];

interface SidebarProps {
  user: SAUser;
}

const SuperAdminSidebar = ({ user }: SidebarProps) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (item: typeof navItems[0]) =>
    item.exact
      ? location.pathname === item.href
      : location.pathname === item.href || location.pathname.startsWith(item.href + "/");

  const NavLink = ({ item }: { item: typeof navItems[0] }) => {
    const active = isActive(item);
    const link = (
      <Link
        to={item.href}
        className={cn(
          "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 select-none",
          active
            ? "bg-[#ffa31a]/10 text-white shadow-[0_0_12px_rgba(255,163,26,0.06)]"
            : "text-[#808080] hover:bg-white/[0.04] hover:text-white",
          collapsed && "justify-center"
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[#ffa31a]" />
        )}
        <item.icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors",
            active ? "text-[#ffa31a]" : "text-[#808080] group-hover:text-white"
          )}
        />
        {!collapsed && (
          <span className="truncate flex-1">{item.label}</span>
        )}
        {active && !collapsed && (
          <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-[#ffa31a] sa-pulse-dot" />
        )}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" className="bg-[#292929] border-white/10 text-white text-xs font-medium px-3 py-1.5">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }
    return link;
  };

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "sticky top-0 h-screen flex flex-col border-r border-white/[0.06] transition-all duration-300",
          "bg-[#141414]",
          collapsed ? "w-[68px]" : "w-60"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-3 border-b border-white/[0.06] shrink-0">
          {!collapsed ? (
            <>
              <Link to="/" className="flex items-center gap-2.5">
                <img src="/PawStay%20Logo.jpg" alt="PawStay" className="h-8 w-8 rounded-md object-cover" />
                <div className="leading-none">
                  <span className="block text-sm font-bold text-white tracking-tight">PawStay</span>
                  <span className="block text-[9px] font-semibold text-[#ffa31a] uppercase tracking-[0.12em] mt-0.5">Super Admin</span>
                </div>
              </Link>
              <button
                onClick={() => setCollapsed(true)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-[#808080] hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Link to="/" className="w-full flex items-center justify-center h-8 rounded-lg text-[#808080] hover:text-white hover:bg-white/[0.06] transition-colors">
                  <img src="/PawStay%20Logo.jpg" alt="PawStay" className="h-6 w-6 rounded-md object-cover" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-[#292929] border-white/10 text-white text-xs">
                PawStay Super Admin
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Section label */}
        {!collapsed && (
          <div className="px-5 pt-4 pb-1">
            <p className="text-[10px] font-semibold text-[#808080]/60 uppercase tracking-[0.15em]">Main Menu</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-2 pb-2 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-white/[0.06] space-y-0.5 shrink-0">
          <div
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-xl",
              collapsed && "justify-center"
            )}
          >
            <div className="w-7 h-7 rounded-lg bg-[#ffa31a]/20 border border-[#ffa31a]/30 flex items-center justify-center shrink-0">
              <Shield className="h-3.5 w-3.5 text-[#ffa31a]" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate leading-tight">
                  {user ? `${user.firstName} ${user.lastName}` : "Super Admin"}
                </p>
                <p className="text-[10px] text-[#808080] truncate leading-tight">{user?.email ?? ""}</p>
              </div>
            )}
          </div>

          {collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  to="/"
                  className="flex items-center justify-center px-3 py-2.5 rounded-xl text-sm font-medium text-[#808080] hover:bg-white/[0.04] hover:text-white transition-colors"
                >
                  <LogOut className="h-[18px] w-[18px] shrink-0" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-[#292929] border-white/10 text-white text-xs">
                Back to Site
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              to="/"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#808080] hover:bg-white/[0.04] hover:text-white transition-colors"
            >
              <LogOut className="h-[18px] w-[18px] shrink-0" />
              <span>Back to Site</span>
            </Link>
          )}

          {!collapsed && (
            <div className="flex items-center justify-center pt-1 pb-0.5">
              <span className="text-[10px] text-[#808080]/40 tracking-wide">v1.0.0</span>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
};

export default SuperAdminSidebar;
