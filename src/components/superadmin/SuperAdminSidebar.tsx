import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  PawPrint,
  ChevronLeft,
  Menu,
  Shield,
  DollarSign,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/superadmin" },
  { icon: Users, label: "Users", href: "/superadmin/users" },
  { icon: Building2, label: "Properties", href: "/superadmin/properties" },
  { icon: BarChart3, label: "Analytics", href: "/superadmin/analytics" },
  { icon: DollarSign, label: "Revenue", href: "/superadmin/revenue" },
  { icon: MessageSquare, label: "Support", href: "/superadmin/support" },
  { icon: Settings, label: "Settings", href: "/superadmin/settings" },
];

const SuperAdminSidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "sticky top-0 h-screen bg-slate-900 text-white flex flex-col transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
        {!collapsed && (
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
              <PawPrint className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-white">PawStay</span>
              <span className="block text-[10px] text-slate-400 -mt-1">Super Admin</span>
            </div>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-violet-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700">
        <div className={cn(
          "flex items-center gap-3 px-3 py-2 mb-2",
          collapsed && "justify-center"
        )}>
          <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center">
            <Shield className="h-4 w-4 text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-medium text-white">Admin User</p>
              <p className="text-xs text-slate-400">admin@pawstay.com</p>
            </div>
          )}
        </div>
        <Link
          to="/"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Back to Site</span>}
        </Link>
      </div>
    </aside>
  );
};

export default SuperAdminSidebar;
