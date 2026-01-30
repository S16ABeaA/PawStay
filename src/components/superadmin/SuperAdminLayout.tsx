import { ReactNode } from "react";
import SuperAdminSidebar from "./SuperAdminSidebar";

interface SuperAdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const SuperAdminLayout = ({ children, title, subtitle }: SuperAdminLayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-950 flex">
      <SuperAdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <div className="mb-8">
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-slate-400 mt-1">{subtitle}</p>
            )}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};

export default SuperAdminLayout;
