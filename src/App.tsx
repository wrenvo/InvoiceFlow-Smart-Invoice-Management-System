import React, { useState } from 'react';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LoginView } from './components/auth/LoginView';
import { DashboardView } from './components/dashboard/DashboardView';
import { InvoiceListView } from './components/invoices/InvoiceListView';
import { InvoiceEditorView } from './components/invoices/InvoiceEditorView';
import { InvoiceDetailModal } from './components/invoices/InvoiceDetailModal';
import { CustomerListView } from './components/customers/CustomerListView';
import { CatalogListView } from './components/catalog/CatalogListView';
import { ReportsView } from './components/reports/ReportsView';
import { AuditActivityView } from './components/activity/AuditActivityView';
import { SettingsView } from './components/settings/SettingsView';
import { PlatformControlPlane } from './components/control/PlatformControlPlane';
import { MobileNav } from './components/layout/MobileNav';
import { Invoice } from './types';

const MainAppContent: React.FC = () => {
  const { currentUser, inControlPlane, invoices } = useWorkspace();

  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('all');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Selected invoice for detail modal
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // Editor state (creating or editing draft)
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [draftToEdit, setDraftToEdit] = useState<Invoice | null>(null);

  // If user enters Platform Control Plane (/control)
  if (inControlPlane) {
    return <PlatformControlPlane />;
  }

  // If user is not authenticated in a workspace
  if (!currentUser) {
    return <LoginView />;
  }

  // Active selected invoice
  const selectedInvoice = selectedInvoiceId
    ? invoices.find((i) => i.id === selectedInvoiceId) || null
    : null;

  const handleOpenCreateInvoice = () => {
    setDraftToEdit(null);
    setIsEditorOpen(true);
  };

  const handleEditDraft = (invoice: Invoice) => {
    setDraftToEdit(invoice);
    setIsEditorOpen(true);
  };

  const handleNavigateToInvoices = (filterStatus?: string) => {
    if (filterStatus) {
      setInvoiceStatusFilter(filterStatus);
    }
    setCurrentTab('invoices');
  };

  return (
    <div className="min-h-screen bg-[#f5f0e6] flex flex-col">
      {/* Top Bar adhering to 3-zone contract */}
      <Navbar
        currentTab={currentTab}
        onOpenMobileMenu={() => setMobileDrawerOpen(true)}
      />

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (hidden on mobile) */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setIsEditorOpen(false);
            setCurrentTab(tab);
          }}
          onOpenCreateInvoice={handleOpenCreateInvoice}
        />

        {/* Viewport Content with padding for mobile bottom bar */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6">
          {isEditorOpen ? (
            <InvoiceEditorView
              initialInvoice={draftToEdit}
              onCancel={() => setIsEditorOpen(false)}
              onSaved={(saved) => {
                setIsEditorOpen(false);
                setSelectedInvoiceId(saved.id);
              }}
              onIssued={(issued) => {
                setIsEditorOpen(false);
                setSelectedInvoiceId(issued.id);
              }}
            />
          ) : (
            <>
              {currentTab === 'dashboard' && (
                <DashboardView
                  onOpenCreateInvoice={handleOpenCreateInvoice}
                  onSelectInvoice={(inv) => setSelectedInvoiceId(inv.id)}
                  onNavigateToInvoices={handleNavigateToInvoices}
                />
              )}

              {currentTab === 'invoices' && (
                <InvoiceListView
                  onOpenCreateInvoice={handleOpenCreateInvoice}
                  onSelectInvoice={(inv) => setSelectedInvoiceId(inv.id)}
                  onEditDraft={handleEditDraft}
                  initialFilter={invoiceStatusFilter}
                />
              )}

              {currentTab === 'customers' && (
                <CustomerListView
                  onSelectInvoice={(inv) => setSelectedInvoiceId(inv.id)}
                  onCreateInvoiceForCustomer={() => handleOpenCreateInvoice()}
                />
              )}

              {currentTab === 'catalog' && (
                <CatalogListView onOpenCreateInvoice={handleOpenCreateInvoice} />
              )}

              {currentTab === 'reports' && <ReportsView />}

              {currentTab === 'activity' && <AuditActivityView />}

              {currentTab === 'settings' && <SettingsView />}
            </>
          )}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar & Navigation Drawer */}
      <MobileNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setIsEditorOpen(false);
          setCurrentTab(tab);
        }}
        onOpenCreateInvoice={handleOpenCreateInvoice}
        drawerOpen={mobileDrawerOpen}
        onCloseDrawer={() => setMobileDrawerOpen(false)}
      />

      {/* Invoice Detail & Printable PDF Modal */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoiceId(null)}
          onEditDraft={handleEditDraft}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <WorkspaceProvider>
      <MainAppContent />
    </WorkspaceProvider>
  );
}
