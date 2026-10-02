import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Building2, ChevronDown, ShieldAlert, UserCheck, LogOut, Shield, Check, Menu } from 'lucide-react';
import { WorkspaceRole } from '../../types';

interface NavbarProps {
  currentTab: string;
  onOpenMobileMenu?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onOpenMobileMenu }) => {
  const {
    currentWorkspace,
    workspaces,
    currentUser,
    switchWorkspace,
    selectPersona,
    users,
    switchUserRole,
    logout,
    enterControlPlane,
    activeSupportSession,
    endSupportSession,
  } = useWorkspace();

  const [wsDropdownOpen, setWsDropdownOpen] = useState(false);
  const [personaModalOpen, setPersonaModalOpen] = useState(false);

  // Tab display name
  const tabTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    invoices: 'Invoices',
    customers: 'Customers',
    catalog: 'Catalog',
    reports: 'Financial Reports',
    activity: 'Audit Activity',
    settings: 'Workspace Settings',
  };

  const roleLabels: Record<WorkspaceRole, string> = {
    owner: 'Owner',
    admin: 'Admin',
    finance: 'Finance',
    preparer: 'Preparer',
    viewer: 'Viewer',
  };

  return (
    <>
      {/* Support Session Warning Banner if active */}
      {activeSupportSession && (
        <div className="bg-[#b42318] text-white px-3 sm:px-4 py-2 text-xs font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm no-print">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 animate-pulse text-amber-200" />
            <span className="truncate">
              SUPPORT SESSION ACTIVE · {activeSupportSession.operatorName} · #{activeSupportSession.ticketId}
            </span>
          </div>
          <button
            onClick={endSupportSession}
            className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded text-xs transition-colors shrink-0 font-semibold self-start sm:self-auto min-h-[32px] sm:min-h-0"
          >
            End Support Session
          </button>
        </div>
      )}

      {/* Top Bar adhering to Top Bar Contract */}
      <header className="h-14 border-b border-[#c9b896]/60 bg-[#fffdf9] px-3 md:px-6 flex items-center justify-between sticky top-0 z-30 no-print">
        {/* Zone 1: Mobile Menu Button & Brand Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          {onOpenMobileMenu && (
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 -ml-1 text-[#24312e] hover:bg-[#f5f0e6] rounded-md transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5 text-[#24312e]" />
            </button>
          )}

          <a href="#dashboard" className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-[#24312e] flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#008371] text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              IW
            </div>
            <span className="truncate max-w-[130px] sm:max-w-none">Invoice Workspace</span>
          </a>

          {/* Breadcrumb locator (hidden on small screens) */}
          <div className="hidden lg:flex items-center text-xs text-[#24312e]/60 font-medium ml-2">
            <span className="text-[#c9b896]">/</span>
            <span className="ml-2 font-medium text-[#24312e]">{currentWorkspace.name}</span>
            <span className="text-[#c9b896] ml-2">/</span>
            <span className="ml-2 text-[#006b5b] font-semibold">{tabTitles[currentTab] || 'Workspace'}</span>
          </div>
        </div>

        {/* Zone 2: Subtle contextual info (desktop only) */}
        <div className="hidden xl:flex items-center gap-2 text-xs text-[#24312e]/70">
          <span>Currency: <strong className="font-mono text-[#24312e]">{currentWorkspace.currency}</strong></span>
          <span className="text-[#c9b896]">·</span>
          <span>Prefix: <strong className="font-mono text-[#24312e]">{currentWorkspace.invoicePrefix}</strong></span>
        </div>

        {/* Zone 3: Actions & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
          {/* Workspace Switcher */}
          <div className="relative">
            <button
              onClick={() => setWsDropdownOpen(!wsDropdownOpen)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 min-h-[38px] rounded text-xs font-medium border border-[#c9b896] bg-[#f5f0e6]/50 hover:bg-[#e8dcc8]/60 text-[#24312e] transition-colors"
              title="Switch Workspace"
            >
              <Building2 className="w-3.5 h-3.5 text-[#008371] shrink-0" />
              <span className="max-w-[70px] sm:max-w-[110px] truncate">{currentWorkspace.name}</span>
              <ChevronDown className="w-3 h-3 text-[#24312e]/60 shrink-0" />
            </button>

            {wsDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 max-w-[calc(100vw-2rem)] bg-[#fffdf9] border border-[#c9b896] rounded-md shadow-lg py-1 z-40">
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#24312e]/50 border-b border-[#c9b896]/30">
                  Switch Workspace
                </div>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id}
                    onClick={() => {
                      switchWorkspace(ws.id);
                      setWsDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-[#f5f0e6] transition-colors min-h-[44px] ${
                      ws.id === currentWorkspace.id ? 'bg-[#e8dcc8]/40 font-semibold text-[#008371]' : 'text-[#24312e]'
                    }`}
                  >
                    <div className="truncate mr-2">
                      <div className="font-medium truncate">{ws.name}</div>
                      <div className="text-[10px] text-[#24312e]/60 font-mono truncate">{ws.legalName}</div>
                    </div>
                    {ws.id === currentWorkspace.id && <Check className="w-3.5 h-3.5 text-[#008371] shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Persona Switcher / Current User */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setPersonaModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 min-h-[38px] rounded border border-[#c9b896] bg-[#fffdf9] hover:bg-[#f5f0e6] transition-colors text-xs text-[#24312e]"
              title="Switch Persona / Test RBAC"
            >
              <div className="w-5 h-5 rounded-full bg-[#008371] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                {currentUser?.fullName?.[0] || 'U'}
              </div>
              <div className="text-left hidden md:block">
                <span className="font-semibold text-xs text-[#24312e]">{currentUser?.fullName}</span>
                <span className="ml-1.5 text-[10px] uppercase font-mono px-1 py-0.2 bg-[#e8dcc8] text-[#006b5b] rounded font-semibold">
                  {currentUser?.role ? roleLabels[currentUser.role] : 'Viewer'}
                </span>
              </div>
              <UserCheck className="w-3.5 h-3.5 text-[#008371] shrink-0" />
            </button>

            {/* Platform Control Link (hidden on tiny screens, accessible from mobile drawer) */}
            <button
              onClick={enterControlPlane}
              className="hidden sm:flex px-2.5 py-1.5 min-h-[38px] text-xs font-semibold rounded bg-[#24312e] text-[#f5f0e6] hover:bg-black transition-colors items-center gap-1.5"
              title="Platform Control Plane"
            >
              <Shield className="w-3.5 h-3.5 text-[#c9b896]" />
              <span className="hidden md:inline">Platform</span>
            </button>

            {/* Sign out to Login */}
            <button
              onClick={logout}
              className="min-h-[38px] px-2.5 py-1.5 flex items-center gap-1.5 text-[#24312e]/70 hover:text-[#b42318] hover:bg-[#b42318]/10 rounded border border-transparent hover:border-[#b42318]/20 transition-colors"
              title="Sign Out to Login Page"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4 text-[#b42318]" />
              <span className="hidden lg:inline text-xs font-semibold text-[#b42318]">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Persona & RBAC Test Modal */}
      {personaModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#fffdf9] border border-[#c9b896] rounded-xl max-w-lg w-full p-4 sm:p-6 shadow-xl my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#c9b896]/50">
              <div>
                <h3 className="text-base font-bold text-[#24312e]">Persona & RBAC Role Switcher</h3>
                <p className="text-xs text-[#24312e]/70 mt-0.5">
                  Test the PRD Section 1.10 workspace roles and permission boundaries.
                </p>
              </div>
              <button
                onClick={() => setPersonaModalOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#24312e]/50 hover:text-[#24312e] text-lg font-bold"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#24312e]/60 mb-1">
                Workspace Personas ({currentWorkspace.name})
              </div>
              {users.map((u) => (
                <div
                  key={u.id}
                  onClick={() => {
                    selectPersona(u.id);
                    setPersonaModalOpen(false);
                  }}
                  className={`p-3 min-h-[52px] rounded-md border cursor-pointer transition-all flex items-center justify-between ${
                    currentUser?.id === u.id
                      ? 'border-[#008371] bg-[#e8dcc8]/40 ring-1 ring-[#008371]'
                      : 'border-[#c9b896]/60 bg-white hover:bg-[#f5f0e6]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#008371] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {u.fullName.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#24312e] flex items-center gap-1.5 flex-wrap">
                        <span>{u.fullName}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-[#e8dcc8] text-[#006b5b] rounded font-semibold">
                          {roleLabels[u.role]}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#24312e]/70 truncate max-w-[200px] sm:max-w-none">{u.title || u.email}</div>
                    </div>
                  </div>
                  {currentUser?.id === u.id && (
                    <div className="text-xs font-semibold text-[#008371] flex items-center gap-1 shrink-0 ml-2">
                      <Check className="w-4 h-4" /> <span className="hidden sm:inline">Active</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-[#c9b896]/40 flex flex-wrap justify-between items-center gap-2 text-xs">
              <button
                onClick={() => {
                  setPersonaModalOpen(false);
                  logout();
                }}
                className="px-3 py-1.5 min-h-[36px] text-xs font-semibold text-[#b42318] hover:bg-[#b42318]/10 rounded border border-[#b42318]/30 flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out to Login Page</span>
              </button>
              <button
                onClick={() => setPersonaModalOpen(false)}
                className="px-4 py-2 min-h-[36px] bg-[#008371] hover:bg-[#006b5b] text-white rounded font-medium transition-colors ml-auto"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
