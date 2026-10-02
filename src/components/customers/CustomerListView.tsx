import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Customer, Invoice } from '../../types';
import { formatCurrency, formatDate } from '../../utils/calculations';
import {
  Users,
  Search,
  Plus,
  Building2,
  Mail,
  Phone,
  MapPin,
  Archive,
  RotateCcw,
  Edit2,
  FileText,
  ShieldCheck,
  X,
} from 'lucide-react';

interface CustomerListViewProps {
  onSelectInvoice?: (invoice: Invoice) => void;
  onCreateInvoiceForCustomer?: (customerId: string) => void;
}

export const CustomerListView: React.FC<CustomerListViewProps> = ({
  onSelectInvoice,
  onCreateInvoiceForCustomer,
}) => {
  const {
    customers,
    invoices,
    currentWorkspace,
    addCustomer,
    updateCustomer,
    archiveCustomer,
    unarchiveCustomer,
    canCreateInvoice,
  } = useWorkspace();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Add / Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [taxId, setTaxId] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.legalName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    setCustomerToEdit(null);
    setName('');
    setLegalName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setTaxId('');
    setNotes('');
    setFormError('');
    setEditModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setCustomerToEdit(c);
    setName(c.name);
    setLegalName(c.legalName);
    setEmail(c.email);
    setPhone(c.phone);
    setAddress(c.address);
    setTaxId(c.taxId || '');
    setNotes(c.notes || '');
    setFormError('');
    setEditModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !email.trim()) {
      setFormError('Customer name and billing email are mandatory.');
      return;
    }

    if (customerToEdit) {
      updateCustomer(customerToEdit.id, {
        name: name.trim(),
        legalName: legalName.trim() || name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        taxId: taxId.trim(),
        notes: notes.trim(),
      });
    } else {
      addCustomer({
        name: name.trim(),
        legalName: legalName.trim() || name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        taxId: taxId.trim(),
        notes: notes.trim(),
        status: 'active',
      });
    }

    setEditModalOpen(false);
  };

  // Helper stats for a customer
  const getCustomerMetrics = (cId: string) => {
    const custInvoices = invoices.filter((i) => i.customerId === cId);
    const totalInvoiced = custInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
    const balanceDue = custInvoices.reduce((sum, i) => sum + i.balanceDue, 0);
    return {
      count: custInvoices.length,
      totalInvoiced,
      balanceDue,
      invoices: custInvoices,
    };
  };

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#c9b896]/60">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#24312e]">
            Customer Directory
          </h1>
          <p className="text-xs md:text-sm text-[#24312e]/70 mt-0.5 sm:mt-1">
            Maintain client billing identities and tax profiles. Historical invoices preserve their original line snapshots.
          </p>
        </div>

        {canCreateInvoice && (
          <button
            onClick={handleOpenAdd}
            className="w-full sm:w-auto px-4 py-2 min-h-[40px] bg-[#008371] hover:bg-[#006b5b] text-white text-xs font-semibold rounded-md shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#fffdf9] p-3 border border-[#c9b896] rounded-lg shadow-xs">
        <div className="flex items-center gap-1 p-1 bg-[#f5f0e6] rounded border border-[#c9b896]/50 shrink-0">
          {(['active', 'archived', 'all'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`flex-1 sm:flex-initial px-3 py-1.5 min-h-[36px] text-xs font-medium rounded capitalize transition-colors text-center ${
                statusFilter === st
                  ? 'bg-[#008371] text-white font-semibold shadow-xs'
                  : 'text-[#24312e]/80 hover:text-[#24312e]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-full sm:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#24312e]/50" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by customer name, legal entity, email..."
            className="w-full pl-8 pr-3 py-2 min-h-[40px] text-xs rounded border border-[#c9b896] bg-white text-[#24312e]"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          const metrics = getCustomerMetrics(cust.id);
          const isArchived = cust.status === 'archived';

          return (
            <div
              key={cust.id}
              onClick={() => setSelectedCustomer(cust)}
              className={`p-5 rounded-lg border bg-[#fffdf9] shadow-xs flex flex-col justify-between hover:border-[#008371] transition-all cursor-pointer ${
                isArchived ? 'opacity-70 border-dashed border-[#c9b896]' : 'border-[#c9b896]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-[#24312e]">{cust.name}</h3>
                    <div className="text-[11px] text-[#24312e]/70">{cust.legalName}</div>
                  </div>
                  <span
                    className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-semibold ${
                      isArchived ? 'bg-neutral-200 text-neutral-700' : 'bg-[#008371]/15 text-[#008371]'
                    }`}
                  >
                    {cust.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-[#24312e]/80">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#008371] shrink-0" />
                    <span className="truncate">{cust.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#008371] shrink-0" />
                    <span>{cust.phone || '—'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#008371] shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{cust.address}</span>
                  </div>
                  {cust.taxId && (
                    <div className="text-[11px] font-mono text-[#24312e]/70">
                      Tax / VAT: <strong>{cust.taxId}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Snapshot Summary */}
              <div className="mt-4 pt-3 border-t border-[#c9b896]/40 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[#24312e]/60 block">Invoices / Total</span>
                  <strong className="font-mono text-[#24312e]">
                    {metrics.count} ({formatCurrency(metrics.totalInvoiced, currentWorkspace.currency)})
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#24312e]/60 block">Outstanding</span>
                  <strong
                    className={`font-mono ${
                      metrics.balanceDue > 0 ? 'text-[#b42318]' : 'text-[#008371]'
                    }`}
                  >
                    {formatCurrency(metrics.balanceDue, currentWorkspace.currency)}
                  </strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Detail Drill-Down Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-[#fffdf9] border border-[#c9b896] rounded-xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 sm:space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-3 border-b border-[#c9b896]/60 gap-2 sm:gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-[#24312e]">{selectedCustomer.name}</h3>
                  <span
                    className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-semibold ${
                      selectedCustomer.status === 'archived'
                        ? 'bg-neutral-200 text-neutral-700'
                        : 'bg-[#008371]/15 text-[#008371]'
                    }`}
                  >
                    {selectedCustomer.status}
                  </span>
                </div>
                <div className="text-xs text-[#24312e]/70 mt-0.5">{selectedCustomer.legalName}</div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => {
                    handleOpenEdit(selectedCustomer);
                    setSelectedCustomer(null);
                  }}
                  className="px-2.5 py-1.5 min-h-[36px] text-xs border border-[#c9b896] hover:bg-[#e8dcc8] rounded text-[#24312e] flex items-center gap-1 font-medium"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit Profile</span>
                </button>
                {selectedCustomer.status === 'active' ? (
                  <button
                    onClick={() => {
                      archiveCustomer(selectedCustomer.id);
                      setSelectedCustomer({ ...selectedCustomer, status: 'archived' });
                    }}
                    className="px-2.5 py-1.5 min-h-[36px] text-xs text-[#b42318] border border-[#b42318]/40 hover:bg-[#b42318]/10 rounded flex items-center gap-1 font-medium"
                  >
                    <Archive className="w-3 h-3" />
                    <span>Archive</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      unarchiveCustomer(selectedCustomer.id);
                      setSelectedCustomer({ ...selectedCustomer, status: 'active' });
                    }}
                    className="px-2.5 py-1.5 min-h-[36px] text-xs text-[#008371] border border-[#008371]/40 hover:bg-[#008371]/10 rounded flex items-center gap-1 font-medium"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Restore</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-[#24312e]/60 hover:text-[#24312e] rounded-md"
                  aria-label="Close dialog"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-3.5 sm:p-4 bg-[#f5f0e6]/60 rounded-lg border border-[#c9b896]/50 text-xs">
              <div>
                <span className="text-[#24312e]/60 block text-[11px]">Billing Email:</span>
                <strong className="font-mono text-[#24312e] break-all">{selectedCustomer.email}</strong>
              </div>
              <div>
                <span className="text-[#24312e]/60 block text-[11px]">Phone:</span>
                <strong className="text-[#24312e]">{selectedCustomer.phone || '—'}</strong>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[#24312e]/60 block text-[11px]">Billing Address:</span>
                <span className="text-[#24312e]">{selectedCustomer.address}</span>
              </div>
              {selectedCustomer.taxId && (
                <div>
                  <span className="text-[#24312e]/60 block text-[11px]">Tax Registration / VAT:</span>
                  <strong className="font-mono text-[#24312e]">{selectedCustomer.taxId}</strong>
                </div>
              )}
              {selectedCustomer.notes && (
                <div className="sm:col-span-2 italic text-[#24312e]/80">
                  Note: "{selectedCustomer.notes}"
                </div>
              )}
            </div>

            {/* Invoices linked to this customer */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#24312e]">
                  Linked Financial Invoices
                </h4>
                <div className="text-[11px] text-[#24312e]/60">
                  Immutable Snapshot Policy Active
                </div>
              </div>

              {getCustomerMetrics(selectedCustomer.id).invoices.length === 0 ? (
                <div className="py-6 text-center text-xs text-[#24312e]/60">
                  No invoices issued for this client yet.
                </div>
              ) : (
                <div className="divide-y divide-[#c9b896]/40 border border-[#c9b896] rounded-md overflow-hidden bg-white">
                  {getCustomerMetrics(selectedCustomer.id).invoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => {
                        setSelectedCustomer(null);
                        onSelectInvoice?.(inv);
                      }}
                      className="p-3 flex items-center justify-between hover:bg-[#f5f0e6]/60 cursor-pointer text-xs transition-colors"
                    >
                      <div>
                        <div className="font-mono font-bold text-[#006b5b]">
                          {inv.invoiceNumber}
                        </div>
                        <div className="text-[11px] text-[#24312e]/60 font-mono">
                          Due: {formatDate(inv.dueDate)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-bold text-[#24312e]">
                          {formatCurrency(inv.grandTotal, inv.currency)}
                        </div>
                        <div className="text-[11px] font-mono">
                          Bal: {formatCurrency(inv.balanceDue, inv.currency)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#fffdf9] border border-[#c9b896] rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#c9b896]/60">
              <h3 className="text-base font-bold text-[#24312e]">
                {customerToEdit ? 'Edit Customer Profile' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-[#24312e]/50 hover:text-[#24312e]"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-[#b42318]/10 border border-[#b42318]/30 rounded text-xs text-[#b42318]">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#24312e] mb-1">
                  Customer Trade Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corporation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-[#c9b896] bg-white text-[#24312e]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#24312e] mb-1">
                  Legal Entity / Registered Company Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Enterprise Solutions LLC"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-[#c9b896] bg-white text-[#24312e]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#24312e] mb-1">
                    Billing Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="ap@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 min-h-[44px] rounded border border-[#c9b896] bg-white text-[#24312e]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#24312e] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 min-h-[44px] rounded border border-[#c9b896] bg-white text-[#24312e]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#24312e] mb-1">
                  Billing Street Address
                </label>
                <input
                  type="text"
                  placeholder="Street, Suite, City, State, ZIP, Country"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 min-h-[44px] rounded border border-[#c9b896] bg-white text-[#24312e]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#24312e] mb-1">
                  Tax Registration Number / VAT / EIN
                </label>
                <input
                  type="text"
                  placeholder="e.g. US-94-1122334"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  className="w-full px-3 py-2 min-h-[44px] rounded border border-[#c9b896] bg-white text-[#24312e] font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#24312e] mb-1">
                  Internal Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Special PO requirements or billing contacts"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 rounded border border-[#c9b896] bg-white text-[#24312e]"
                />
              </div>

              <div className="pt-3 border-t border-[#c9b896]/40 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-3.5 py-2 min-h-[40px] text-xs text-[#24312e]/70 hover:text-[#24312e]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 min-h-[40px] bg-[#008371] hover:bg-[#006b5b] text-white font-medium rounded shadow-xs transition-colors"
                >
                  Save Customer Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
