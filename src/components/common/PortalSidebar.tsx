import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { EaristLogo } from './EaristLogo';
import {
  ClipboardList,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  PlusCircle,
  Search,
  FileCheck,
  LogOut,
  X,
  ChevronRight,
  Layers,
  Users,
} from 'lucide-react';

export interface SidebarNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | number;
  badgeVariant?: 'neutral' | 'emerald' | 'amber' | 'red';
  onClick?: () => void;
}

export interface PortalSidebarProps {
  role?: 'superadmin' | 'evaluator' | 'student';
  activeTab: string;
  onTabChange: (tabId: string) => void;
  items?: SidebarNavItem[];
  onSignOut?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const PortalSidebar: React.FC<PortalSidebarProps> = ({
  role = 'superadmin',
  activeTab,
  onTabChange,
  items,
  onSignOut,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { currentUser } = useAuth();

  // Determine user role and details
  const activeRole = role || currentUser.role || 'superadmin';

  // Role display values
  const userName =
    activeRole === 'superadmin'
      ? currentUser.name || 'Dr. Mario M. Santos'
      : activeRole === 'evaluator'
      ? currentUser.name || 'Prof. Noel Carpio'
      : currentUser.name || 'Student Applicant';

  const userRoleLabel =
    activeRole === 'superadmin'
      ? 'SFAO Director'
      : activeRole === 'evaluator'
      ? `${currentUser.college || 'CIT'} Evaluator`
      : 'Enrolled Student';

  // Get user initials for avatar
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'EA';

  // Role-Specific Navigation Menu Defaults
  const defaultItems = React.useMemo<SidebarNavItem[]>(() => {
    if (activeRole === 'superadmin') {
      return [
        {
          id: 'masterlist',
          label: 'Disbursement Masterlist',
          icon: ClipboardList,
        },
        {
          id: 'quotas',
          label: 'Grant Quotas',
          icon: Sliders,
        },
        {
          id: 'users',
          label: 'User Accounts',
          icon: Users,
        },
        {
          id: 'audit',
          label: 'Audit Log (RA 10173)',
          icon: ShieldCheck,
        },
      ];
    }

    if (activeRole === 'evaluator') {
      return [
        {
          id: 'all',
          label: 'All Applications',
          icon: Layers,
        },
        {
          id: 'queue',
          label: 'Review Queue',
          icon: ClipboardList,
        },
        {
          id: 'endorsed',
          label: 'Endorsed Candidates',
          icon: CheckCircle2,
        },
        {
          id: 'flagged',
          label: 'Flagged Deficiencies',
          icon: AlertCircle,
        },
      ];
    }

    // Student Menu
    return [
      {
        id: 'programs',
        label: 'Scholarship Programs',
        icon: GraduationCap,
      },
      {
        id: 'apply',
        label: 'Apply Online',
        icon: PlusCircle,
      },
      {
        id: 'track',
        label: 'Track Status',
        icon: Search,
      },
      {
        id: 'requirements',
        label: 'Requirements Checklist',
        icon: FileCheck,
      },
    ];
  }, [activeRole]);

  const navItems = items || defaultItems;

  const handleItemClick = (item: SidebarNavItem) => {
    if (item.onClick) {
      item.onClick();
    } else {
      onTabChange(item.id);
    }
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* 1. Top Brand Header */}
      <div className="h-16 px-5 border-b border-neutral-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <EaristLogo size={36} showText={false} className="flex-shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-neutral-900 tracking-tight leading-tight truncate">
              EARIST SFAO
            </h1>
            <p className="text-[11px] text-neutral-500 font-medium truncate">
              Scholarship Portal
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 lg:hidden cursor-pointer transition-colors"
            aria-label="Close navigation drawer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Navigation Items List */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] uppercase font-bold tracking-wider text-neutral-400">
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-colors cursor-pointer text-left group ${
                isActive
                  ? 'bg-maroon-subtle text-maroon-primary font-semibold'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 font-medium'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    isActive ? 'text-maroon-primary' : 'text-neutral-400 group-hover:text-neutral-600'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge !== undefined && item.badge !== null && (
                <span
                  className={`ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full flex-shrink-0 ${
                    item.badgeVariant === 'amber'
                      ? 'bg-amber-100 text-amber-800'
                      : item.badgeVariant === 'red'
                      ? 'bg-red-100 text-red-800'
                      : item.badgeVariant === 'emerald'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-neutral-100 text-neutral-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. Bottom User Footer (Compact Profile Block + Sign Out) */}
      <div className="p-4 border-t border-neutral-200 bg-white space-y-3 flex-shrink-0">
        <button
          type="button"
          onClick={() => {
            onTabChange('profile');
            if (onCloseMobile) onCloseMobile();
          }}
          className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer group ${
            activeTab === 'profile'
              ? 'bg-maroon-subtle ring-1 ring-maroon-primary/30'
              : 'hover:bg-neutral-100'
          }`}
          title="View and edit institutional user profile"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs flex-shrink-0 transition-colors ${
                activeTab === 'profile'
                  ? 'bg-maroon-primary text-white border-maroon-primary'
                  : 'bg-neutral-100 border-neutral-200 text-maroon-primary group-hover:bg-maroon-primary group-hover:text-white'
              }`}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={`text-xs font-semibold truncate transition-colors ${
                  activeTab === 'profile'
                    ? 'text-maroon-primary'
                    : 'text-neutral-900 group-hover:text-maroon-primary'
                }`}
              >
                {userName}
              </p>
              <p className="text-[11px] text-neutral-500 truncate">
                {userRoleLabel}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-700 transition-colors flex-shrink-0 ml-1.5" />
        </button>

        {onSignOut && (
          <button
            type="button"
            onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium text-neutral-600 hover:text-maroon-primary hover:bg-maroon-subtle border border-neutral-200 rounded-lg transition-colors cursor-pointer"
            title="Sign out of current workstation session"
          >
            <LogOut className="w-3.5 h-3.5 text-neutral-400" />
            <span>Sign out</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 bg-white border-r border-neutral-200 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          onClick={onCloseMobile}
        />
      )}

      {/* Mobile Sliding Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-neutral-200 flex flex-col transform transition-transform duration-200 ease-in-out lg:hidden ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
