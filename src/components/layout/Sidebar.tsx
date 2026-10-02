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
  PlusCircle,
  ShieldCheck,
} from 'lucide-react';
import { WorkspaceRole } from '../../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenCreateInvoice?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab, onOpenCreateInvoice }) => {
  const { currentUser, canCreateInvoice, switchUserRole } = useWorkspace();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'invoices', label: 'Invoices', icon: FileText },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'catalog', label: 'Items & Services', icon: Package },
    { id: 'reports', label: 'Financial Reports', icon: BarChart3 },
    { id: 'activity', label: 'Audit Activity', icon: History },
    { id: 'settings', label: 'Settings & Team', icon: Settings },
  ];

  const roles: WorkspaceRole[] = ['owner', 'admin', 'finance', 'preparer', 'viewer'];

  return (
    <aside className="hidden md:flex w-64 bg-[#fffdf9] border-r border-[#c9b896]/60 flex-col justify-between shrink-0 no-print">
      <div className="p-4 space-y-4">
        {/* Quick Action Button */}
        {canCreateInvoice ? (
          <button
            onClick={onOpenCreateInvoice}
            className="w-full py-2.5 px-3 bg-[#008371] hover:bg-[#006b5b] text-white text-xs font-semibold rounded-md shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Invoice</span>
          </button>
        ) : (
          <div className="p-2.5 bg-[#f5f0e6] border border-[#c9b896]/50 rounded-md text-[11px] text-[#24312e]/70 text-center">
            Role: <strong>{currentUser?.role?.toUpperCase()}</strong> (Read-only on creations)
          </div>
        )}

        {/* Primary Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-[#e8dcc8]/60 text-[#006b5b] font-semibold border-l-3 border-[#008371]'
                    : 'text-[#24312e] hover:bg-[#f5f0e6] hover:text-[#008371]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#008371]' : 'text-[#24312e]/60'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Role Testing Sandbox at bottom of sidebar */}
      <div className="p-4 border-t border-[#c9b896]/40 bg-[#f5f0e6]/40">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#24312e]/60 mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#008371]" />
          <span>Quick Role Switch</span>
        </div>
        <p className="text-[11px] text-[#24312e]/70 mb-2 leading-relaxed">
          Simulate role-based access for <strong>{currentUser?.fullName}</strong>:
        </p>
        <div className="grid grid-cols-2 gap-1">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => switchUserRole(r)}
              className={`px-2 py-1 text-[10px] font-mono rounded border uppercase transition-colors ${
                currentUser?.role === r
                  ? 'bg-[#008371] text-white border-[#008371] font-bold'
                  : 'bg-white text-[#24312e]/80 border-[#c9b896]/60 hover:bg-[#e8dcc8]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};
