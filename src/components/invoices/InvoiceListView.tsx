import React, { useState, useMemo } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Invoice } from '../../types';
import { formatCurrency, formatDate, isInvoiceOverdue } from '../../utils/calculations';
import {
  Search,
  Plus,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  FileText,
  Trash2,
  Edit3,
} from 'lucide-react';

interface InvoiceListViewProps {
  onOpenCreateInvoice: () => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onEditDraft: (invoice: Invoice) => void;
  initialFilter?: string;
}

export const InvoiceListView: React.FC<InvoiceListViewProps> = ({
  onOpenCreateInvoice,
  onSelectInvoice,
  onEditDraft,
  initialFilter = 'all',
}) => {
  const { currentWorkspace, invoices, customers, canCreateInvoice, deleteDraft } = useWorkspace();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialFilter);
  const [customerFilter, setCustomerFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'number' | 'amount' | 'balance'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filtered and sorted invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Search term filter
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchNumber = inv.invoiceNumber.toLowerCase().includes(query);
        const matchCustomer = inv.customerSnapshot.name.toLowerCase().includes(query);
        const matchPo = inv.referencePo?.toLowerCase().includes(query);
        if (!matchNumber && !matchCustomer && !matchPo) return false;
      }

      // Customer filter
      if (customerFilter !== 'all' && inv.customerId !== customerFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'draft') return inv.documentStatus === 'draft';
      if (statusFilter === 'issued') return inv.documentStatus === 'issued';
      if (statusFilter === 'unpaid') return inv.documentStatus === 'issued' && inv.balanceDue > 0;
      if (statusFilter === 'paid') return inv.documentStatus === 'issued' && inv.paymentStatus === 'paid';
      if (statusFilter === 'overdue') return isInvoiceOverdue(inv);
      if (statusFilter === 'void') return inv.documentStatus === 'void';

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = (a.issueDate || '').localeCompare(b.issueDate || '');
      } else if (sortBy === 'number') {
        comparison = a.invoiceNumber.localeCompare(b.invoiceNumber);
      } else if (sortBy === 'amount') {
        comparison = a.grandTotal - b.grandTotal;
      } else if (sortBy === 'balance') {
        comparison = a.balanceDue - b.balanceDue;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, [invoices, searchTerm, statusFilter, customerFilter, sortBy, sortOrder]);

  // CSV Export handler
  const handleExportCsv = () => {
    const headers = [
      'Invoice Number',
      'Customer',
      'Reference PO',
      'Issue Date',
      'Due Date',
      'Currency',
      'Subtotal',
      'Discount',
      'Tax',
      'Grand Total',
      'Amount Paid',
      'Balance Due',
      'Document Status',
      'Payment Status',
      'Delivery Status',
    ];

    const rows = filteredInvoices.map((i) => [
      `"${i.invoiceNumber}"`,
      `"${i.customerSnapshot.name.replace(/"/g, '""')}"`,
      `"${i.referencePo || ''}"`,
      i.issueDate,
      i.dueDate,
      i.currency,
      i.subtotal.toFixed(2),
      i.totalDiscount.toFixed(2),
      i.totalTax.toFixed(2),
      i.grandTotal.toFixed(2),
      i.amountPaid.toFixed(2),
      i.balanceDue.toFixed(2),
      i.documentStatus,
      i.paymentStatus,
      i.deliveryStatus,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentWorkspace.invoicePrefix}invoices_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusTabs = [
    { id: 'all', label: 'All Invoices' },
    { id: 'unpaid', label: 'Unpaid / Open' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'paid', label: 'Paid' },
    { id: 'draft', label: 'Drafts' },
    { id: 'void', label: 'Voided' },
  ];

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-5">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-[#c9b896]/60">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#24312e]">
            Invoices
          </h1>
          <p className="text-xs md:text-sm text-[#24312e]/70 mt-0.5 sm:mt-1">
            Create, issue, track, and reconcile financial invoice documents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={filteredInvoices.length === 0}
            className="flex-1 sm:flex-initial px-3 py-2 min-h-[40px] text-xs font-medium border border-[#c9b896] bg-[#fffdf9] hover:bg-[#e8dcc8]/50 text-[#24312e] rounded-md transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          {canCreateInvoice && (
            <button
              onClick={onOpenCreateInvoice}
              className="flex-1 sm:flex-initial px-4 py-2 min-h-[40px] bg-[#008371] hover:bg-[#006b5b] text-white text-xs font-semibold rounded-md shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Segmented Filter Bar (Horizontally scrollable on mobile) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#fffdf9] p-3 border border-[#c9b896] rounded-lg shadow-xs">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#f5f0e6] rounded-md border border-[#c9b896]/50 overflow-x-auto max-w-full pb-1 sm:pb-1">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 min-h-[36px] text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#008371] text-white font-semibold shadow-xs'
                    : 'text-[#24312e]/80 hover:text-[#24312e] hover:bg-white/50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search & Customer Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#24312e]/50" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search number, client, PO..."
              className="w-full pl-8 pr-3 py-2 min-h-[40px] text-xs rounded border border-[#c9b896] bg-white focus:outline-none focus:ring-1 focus:ring-[#008371] text-[#24312e]"
            />
          </div>

          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="px-2.5 py-2 min-h-[40px] text-xs rounded border border-[#c9b896] bg-white text-[#24312e] focus:outline-none"
          >
            <option value="all">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoice List View (Mobile Cards + Desktop Table) */}
      <div className="bg-[#fffdf9] border border-[#c9b896] rounded-lg shadow-xs overflow-hidden">
        {/* Mobile Cards (Layout B from mobile guidelines) */}
        <div className="divide-y divide-[#c9b896]/30 md:hidden">
          {filteredInvoices.length === 0 ? (
            <div className="py-12 text-center text-[#24312e]/60 px-4">
              <FileText className="w-8 h-8 mx-auto text-[#c9b896] mb-2" />
              <p className="font-semibold text-sm">No invoices match this filter</p>
              <p className="text-xs mt-1">Adjust search parameters or create a new invoice draft.</p>
            </div>
          ) : (
            filteredInvoices.map((inv) => {
              const isOverdue = isInvoiceOverdue(inv);

              return (
                <div
                  key={inv.id}
                  onClick={() => onSelectInvoice(inv)}
                  className="p-4 hover:bg-[#f5f0e6]/50 active:bg-[#e8dcc8]/60 transition-colors cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-xs text-[#006b5b]">
                        {inv.invoiceNumber}
                      </span>
                      {inv.documentStatus === 'draft' && (
                        <span className="text-[9px] uppercase font-mono px-1 py-0.2 bg-[#e8dcc8] text-[#24312e] rounded">
                          Draft
                        </span>
                      )}
                      {inv.documentStatus === 'void' && (
                        <span className="text-[9px] uppercase font-mono px-1 py-0.2 bg-[#b42318]/15 text-[#b42318] rounded">
                          Void
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Delivery Status icon */}
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-medium inline-flex items-center gap-0.5 ${
                          inv.deliveryStatus === 'sent'
                            ? 'bg-[#008371]/10 text-[#008371]'
                            : inv.deliveryStatus === 'failed'
                            ? 'bg-[#b42318]/15 text-[#b42318]'
                            : 'bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {inv.deliveryStatus.replace('_', ' ')}
                      </span>

                      {/* Payment Status */}
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase ${
                          inv.documentStatus === 'void'
                            ? 'bg-neutral-100 text-neutral-500'
                            : isOverdue
                            ? 'bg-[#b42318] text-white'
                            : inv.paymentStatus === 'paid'
                            ? 'bg-[#008371] text-white'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {inv.documentStatus === 'void' ? 'VOID' : isOverdue ? 'OVERDUE' : inv.paymentStatus.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div className="truncate mr-2">
                      <div className="text-xs font-semibold text-[#24312e] truncate">
                        {inv.customerSnapshot.name}
                      </div>
                      <div className="text-[10px] text-[#24312e]/60 font-mono mt-0.5">
                        Due: {formatDate(inv.dueDate)} {inv.referencePo ? `· PO: ${inv.referencePo}` : ''}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-xs text-[#24312e]">
                        {formatCurrency(inv.grandTotal, inv.currency)}
                      </div>
                      <div className={`text-[10px] font-mono font-semibold ${inv.balanceDue > 0 ? (isOverdue ? 'text-[#b42318]' : 'text-[#24312e]/80') : 'text-[#008371]'}`}>
                        Bal: {formatCurrency(inv.balanceDue, inv.currency)}
                      </div>
                    </div>
                  </div>

                  {/* Mobile Actions Row */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#c9b896]/30" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[10px] text-[#24312e]/60 font-mono">
                      Issued: {formatDate(inv.issueDate)}
                    </span>
                    <div className="flex items-center gap-1">
                      {inv.documentStatus === 'draft' && canCreateInvoice && (
                        <button
                          onClick={() => onEditDraft(inv)}
                          className="px-2.5 py-1 min-h-[32px] text-xs font-medium text-[#006b5b] hover:bg-[#e8dcc8] rounded flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      )}
                      <button
                        onClick={() => onSelectInvoice(inv)}
                        className="px-2.5 py-1 min-h-[32px] text-xs font-medium border border-[#c9b896] hover:bg-[#e8dcc8] rounded text-[#24312e]"
                      >
                        Inspect →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f0e6]/60 border-b border-[#c9b896]/50 text-[#24312e]/70">
              <tr>
                <th
                  onClick={() => {
                    setSortBy('number');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-2.5 px-4 font-semibold cursor-pointer hover:text-[#008371]"
                >
                  Invoice # {sortBy === 'number' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2.5 px-4 font-semibold">Customer</th>
                <th
                  onClick={() => {
                    setSortBy('date');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-2.5 px-4 font-semibold cursor-pointer hover:text-[#008371]"
                >
                  Issue Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2.5 px-4 font-semibold">Due Date</th>
                <th
                  onClick={() => {
                    setSortBy('amount');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-2.5 px-4 font-semibold text-right cursor-pointer hover:text-[#008371]"
                >
                  Grand Total {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th
                  onClick={() => {
                    setSortBy('balance');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-2.5 px-4 font-semibold text-right cursor-pointer hover:text-[#008371]"
                >
                  Balance Due {sortBy === 'balance' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-2.5 px-4 font-semibold text-center">Delivery</th>
                <th className="py-2.5 px-4 font-semibold text-center">Payment Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c9b896]/30">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-[#24312e]/60">
                    <FileText className="w-8 h-8 mx-auto text-[#c9b896] mb-2" />
                    <p className="font-semibold text-sm">No invoices match this filter</p>
                    <p className="text-xs mt-1">Adjust search parameters or create a new invoice draft.</p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const isOverdue = isInvoiceOverdue(inv);

                  return (
                    <tr
                      key={inv.id}
                      onClick={() => onSelectInvoice(inv)}
                      className="hover:bg-[#f5f0e6]/50 transition-colors cursor-pointer group"
                    >
                      {/* Number */}
                      <td className="py-3 px-4 font-mono font-bold text-[#006b5b] group-hover:underline">
                        <div className="flex items-center gap-1.5">
                          <span>{inv.invoiceNumber}</span>
                          {inv.documentStatus === 'draft' && (
                            <span className="text-[9px] uppercase font-mono px-1 py-0.2 bg-[#e8dcc8] text-[#24312e] rounded">
                              Draft
                            </span>
                          )}
                          {inv.documentStatus === 'void' && (
                            <span className="text-[9px] uppercase font-mono px-1 py-0.2 bg-[#b42318]/15 text-[#b42318] rounded">
                              Void
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3 px-4 font-medium text-[#24312e]">
                        <div>{inv.customerSnapshot.name}</div>
                        {inv.referencePo && (
                          <div className="text-[10px] text-[#24312e]/60 font-mono">PO: {inv.referencePo}</div>
                        )}
                      </td>

                      {/* Issue Date */}
                      <td className="py-3 px-4 font-mono text-[#24312e]/80">
                        {formatDate(inv.issueDate)}
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-4 font-mono">
                        <span className={isOverdue ? 'text-[#b42318] font-bold' : 'text-[#24312e]/80'}>
                          {formatDate(inv.dueDate)}
                        </span>
                      </td>

                      {/* Grand Total */}
                      <td className="py-3 px-4 font-mono text-right font-bold text-[#24312e] tabular-nums">
                        {formatCurrency(inv.grandTotal, inv.currency)}
                      </td>

                      {/* Balance Due */}
                      <td className="py-3 px-4 font-mono text-right font-bold tabular-nums">
                        <span
                          className={
                            inv.documentStatus === 'void'
                              ? 'text-[#24312e]/40 line-through'
                              : inv.balanceDue > 0
                              ? isOverdue
                                ? 'text-[#b42318]'
                                : 'text-[#24312e]'
                              : 'text-[#008371]'
                          }
                        >
                          {formatCurrency(inv.balanceDue, inv.currency)}
                        </span>
                      </td>

                      {/* Delivery Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium inline-flex items-center gap-1 ${
                            inv.deliveryStatus === 'sent'
                              ? 'bg-[#008371]/10 text-[#008371]'
                              : inv.deliveryStatus === 'failed'
                              ? 'bg-[#b42318]/15 text-[#b42318]'
                              : inv.deliveryStatus === 'queued'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {inv.deliveryStatus === 'sent' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {inv.deliveryStatus === 'failed' && <AlertCircle className="w-2.5 h-2.5" />}
                          {inv.deliveryStatus === 'queued' && <Clock className="w-2.5 h-2.5" />}
                          <span className="capitalize">{inv.deliveryStatus.replace('_', ' ')}</span>
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3 px-4 text-center">
                        {inv.documentStatus === 'void' ? (
                          <span className="text-[10px] text-[#24312e]/50 font-mono">VOIDED</span>
                        ) : isOverdue ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-[#b42318]/15 text-[#b42318]">
                            OVERDUE
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                              inv.paymentStatus === 'paid'
                                ? 'bg-[#008371] text-white'
                                : inv.paymentStatus === 'partially_paid'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-neutral-100 text-neutral-700'
                            }`}
                          >
                            {inv.paymentStatus === 'partially_paid' ? 'Partial' : inv.paymentStatus}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.documentStatus === 'draft' && canCreateInvoice && (
                            <button
                              onClick={() => onEditDraft(inv)}
                              className="p-1 text-[#006b5b] hover:bg-[#e8dcc8] rounded"
                              title="Edit Draft"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {inv.documentStatus === 'draft' && (
                            <button
                              onClick={() => {
                                if (confirm(`Discard draft ${inv.invoiceNumber}?`)) {
                                  deleteDraft(inv.id);
                                }
                              }}
                              className="p-1 text-[#b42318] hover:bg-[#b42318]/10 rounded"
                              title="Delete Draft"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onSelectInvoice(inv)}
                            className="px-2 py-1 text-xs font-medium border border-[#c9b896] hover:bg-[#e8dcc8] rounded text-[#24312e] transition-colors"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
