import { ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";
import NotificationBell from "@/components/NotificationBell";
import BusinessSelector from "@/components/admin/BusinessSelector";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const AdminLayout = ({ children, title, subtitle }: AdminLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          {/* Business selector bar */}
          <div className="mb-4 flex items-center justify-end gap-8 pb-4 border-b border-border">
            <NotificationBell />
            <BusinessSelector />
          </div>
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
