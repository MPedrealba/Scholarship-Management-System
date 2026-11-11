import React, { useState } from 'react';
import { PortalSidebar, type SidebarNavItem } from './PortalSidebar';
import { NotificationBell } from './NotificationBell';
import { Menu } from 'lucide-react';

export interface DashboardLayoutProps {
  role: 'superadmin' | 'evaluator' | 'student';
  activeTab: string;
  onTabChange: (tabId: string) => void;
  title: string;
  subtitle?: string;
  sidebarItems?: SidebarNavItem[];
  onSignOut?: () => void;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  role,
  activeTab,
  onTabChange,
  title,
  subtitle,
  sidebarItems,
  onSignOut,
  headerActions,
  children,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-neutral-50 text-neutral-900 font-sans selection:bg-amber-300 selection:text-maroon-900">
      {/* 1. Left Responsive Sidebar (Fixed on Desktop, Collapsible Drawer on Mobile) */}
      <PortalSidebar
        role={role}
        activeTab={activeTab}
        onTabChange={onTabChange}
        items={sidebarItems}
        onSignOut={onSignOut}
        isOpenMobile={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* 2. Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Minimal Top Bar (Sticky with Active Section Title & Mobile Toggle) */}
        <header className="bg-white border-b border-neutral-200 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between sticky top-0 z-20 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="p-2 -ml-2 rounded-lg text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 lg:hidden cursor-pointer transition-colors"
              aria-label="Open navigation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-neutral-500 hidden sm:block truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Right Header Actions Slot & Notification Bell (Feature 4) */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
            {headerActions}
            <NotificationBell />
          </div>
        </header>

        {/* Padded Workspace Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
