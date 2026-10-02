import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  BarChart3,
  History,
  Settings,
  Shield,
  PlusCircle,
  X,
  ShieldCheck,
  LogOut,
  Building2,
} from 'lucide-react';
import { WorkspaceRole } from '../../types';

interface MobileNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCreateInvoice?: () => void;
  drawerOpen: boolean;
  onCloseDrawer: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenCreateInvoice,
  drawerOpen,
  onCloseDrawer,
}) => {
  const {
    currentUser,
    currentWorkspace,
    canCreateInvoice,
    switchUserRole,
    enterControlPlane,
    logout,
  } = useWorkspace();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'catalog', label: 'Items & Services', icon: Package },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'activity', label: 'Audit Activity', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const bottomTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'customers', label: 'Clients', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  const roles: WorkspaceRole[] = ['owner', 'admin', 'finance', 'preparer', 'viewer'];

  return (
    <>
      {/* 1. Mobile Bottom Navigation Bar (Natural Thumb Zone) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#fffdf9]/95 backdrop-blur-md border-t border-[#c9b896]/60 shadow-lg no-print"
      >
        <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-1">
          {bottomTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors ${
                  isActive ? 'text-[#008371] font-bold' : 'text-[#24312e]/70 hover:text-[#24312e]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#008371]' : 'text-[#24312e]/60'}`} />
                <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#008371] mt-0.5" />}
              </button>
            );
          })}

          {/* Quick Create or More Button */}
          {canCreateInvoice ? (
            <button
              onClick={onOpenCreateInvoice}
              className="flex flex-col items-center justify-center min-h-[48px] text-[#008371] hover:text-[#006b5b]"
              aria-label="Create Invoice"
            >
              <div className="w-7 h-7 rounded-full bg-[#008371] text-white flex items-center justify-center shadow-xs">
                <PlusCircle className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-semibold mt-0.5 text-[#008371]">New</span>
            </button>
          ) : (
            <button
              onClick={() => onSelectTab('settings')}
              className={`flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors ${
                currentTab === 'settings' ? 'text-[#008371] font-bold' : 'text-[#24312e]/70'
              }`}
            >
              <Settings className="w-5 h-5 text-[#24312e]/60" />
              <span className="text-[10px] tracking-tight mt-0.5">Settings</span>
            </button>
          )}
        </div>
      </nav>

      {/* 2. Slide-over Mobile Drawer for Full Navigation & Workspace Tools */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex no-print">
          {/* Backdrop overlay */}
          <div
            onClick={onCloseDrawer}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            aria-hidden="true"
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-[#fffdf9] h-full shadow-2xl flex flex-col justify-between p-4 z-10 overflow-y-auto border-r border-[#c9b896]">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-[#c9b896]/50">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-[#008371] text-white flex items-center justify-center font-bold text-xs">
                    IW
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#24312e]">Invoice Workspace</div>
                    <div className="text-[11px] text-[#24312e]/60 font-mono truncate max-w-[170px]">
                      {currentWorkspace.name}
                    </div>
                  </div>
                </div>

                <button
                  onClick={onCloseDrawer}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-[#24312e]/60 hover:text-[#24312e] rounded-md"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Create Invoice Action */}
              {canCreateInvoice && (
                <button
                  onClick={() => {
                    onCloseDrawer();
                    onOpenCreateInvoice?.();
                  }}
                  className="w-full py-2.5 px-3 min-h-[44px] bg-[#008371] hover:bg-[#006b5b] text-white text-xs font-semibold rounded-md shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Invoice</span>
                </button>
              )}

              {/* Navigation Links */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onCloseDrawer();
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] text-xs font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-[#e8dcc8]/60 text-[#006b5b] font-semibold border-l-3 border-[#008371]'
                          : 'text-[#24312e] hover:bg-[#f5f0e6]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#008371]' : 'text-[#24312e]/60'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Platform Control Link */}
              <button
                onClick={() => {
                  onCloseDrawer();
                  enterControlPlane();
                }}
                className="w-full py-2.5 px-3 min-h-[44px] text-xs font-semibold rounded bg-[#24312e] text-[#f5f0e6] hover:bg-black transition-colors flex items-center gap-2"
              >
                <Shield className="w-4 h-4 text-[#c9b896]" />
                <span>Platform Control Plane (/control)</span>
              </button>
            </div>

            {/* Bottom Drawer Actions */}
            <div className="pt-4 mt-4 border-t border-[#c9b896]/40 space-y-3">
              {/* Quick Role switch for mobile */}
              <div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-[#24312e]/70 mb-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#008371]" />
                  <span>Switch Role: {currentUser?.role.toUpperCase()}</span>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => switchUserRole(r)}
                      className={`py-1 text-[9px] font-mono rounded border uppercase transition-colors min-h-[30px] ${
                        currentUser?.role === r
                          ? 'bg-[#008371] text-white font-bold border-[#008371]'
                          : 'bg-white text-[#24312e]/80 border-[#c9b896]/60'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* User info & Sign out */}
              <div className="flex items-center justify-between pt-2 border-t border-[#c9b896]/30 text-xs">
                <div className="truncate mr-2">
                  <div className="font-semibold text-[#24312e] truncate">{currentUser?.fullName}</div>
                  <div className="text-[10px] text-[#24312e]/60 truncate">{currentUser?.email}</div>
                </div>
                <button
                  onClick={() => {
                    onCloseDrawer();
                    logout();
                  }}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-[#b42318] hover:bg-[#b42318]/10 rounded"
                  title="Sign out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
