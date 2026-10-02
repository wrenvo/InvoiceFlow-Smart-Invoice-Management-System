import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { formatCurrency, formatDate, isInvoiceOverdue } from '../../utils/calculations';
import { Invoice } from '../../types';
import {
  DollarSign,
  AlertCircle,
  CheckCircle2,
  FileClock,
  ArrowUpRight,
  Plus,
  Clock,
  Send,
  FileText,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenCreateInvoice: () => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onNavigateToInvoices: (filterStatus?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenCreateInvoice,
  onSelectInvoice,
  onNavigateToInvoices,
}) => {
  const { currentWorkspace, invoices, canCreateInvoice } = useWorkspace();

  // Metrics calculation
  const issuedInvoices = invoices.filter((inv) => inv.documentStatus === 'issued');
  const draftInvoices = invoices.filter((inv) => inv.documentStatus === 'draft');

  // Outstanding = sum of balanceDue on all issued invoices
  const totalOutstanding = issuedInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  // Overdue = sum of balanceDue on issued invoices where dueDate < today
  const overdueInvoices = issuedInvoices.filter((inv) => isInvoiceOverdue(inv));
  const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.balanceDue, 0);

  // Paid = sum of amountPaid on issued invoices
  const totalPaid = issuedInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);

  // Total draft value
  const totalDraftValue = draftInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

  // Recent invoices (sorted by createdAt or updatedAt desc)
  const recentInvoices = [...invoices].slice(0, 5);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header with Title and Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#c9b896]/60">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#24312e]">
            Financial Receivables & Workspace Overview
          </h1>
          <p className="text-xs md:text-sm text-[#24312e]/70 mt-1">
            Tracking invoice lifecycles, liquidity, and billing health for{' '}
            <span className="font-semibold text-[#24312e]">{currentWorkspace.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateToInvoices()}
            className="px-3 py-2 text-xs font-medium border border-[#c9b896] bg-[#fffdf9] hover:bg-[#e8dcc8]/50 text-[#24312e] rounded-md transition-colors"
          >
            View All Invoices ({invoices.length})
          </button>
          {canCreateInvoice && (
            <button
              onClick={onOpenCreateInvoice}
              className="px-4 py-2 bg-[#008371] hover:bg-[#006b5b] text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Outstanding Receivables */}
        <div
          onClick={() => onNavigateToInvoices('unpaid')}
          className="p-5 bg-[#fffdf9] border border-[#c9b896] rounded-lg shadow-xs hover:border-[#008371] cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-xs font-medium text-[#24312e]/70">
            <span>Outstanding Receivables</span>
            <DollarSign className="w-4 h-4 text-[#008371]" />
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-[#24312e] tabular-nums">
            {formatCurrency(totalOutstanding, currentWorkspace.currency)}
          </div>
          <div className="mt-2 text-[11px] text-[#24312e]/60 flex items-center justify-between">
            <span>{issuedInvoices.filter((i) => i.balanceDue > 0).length} open invoices</span>
            <span className="text-[#008371] font-semibold">Active balance →</span>
          </div>
        </div>

        {/* Overdue Balance */}
        <div
          onClick={() => onNavigateToInvoices('overdue')}
          className={`p-5 rounded-lg border shadow-xs cursor-pointer transition-all ${
            totalOverdue > 0
              ? 'bg-[#fffdf9] border-[#b42318]/50 hover:border-[#b42318]'
              : 'bg-[#fffdf9] border-[#c9b896]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-[#24312e]/70">
            <span>Overdue Balance</span>
            <AlertCircle className={`w-4 h-4 ${totalOverdue > 0 ? 'text-[#b42318]' : 'text-[#24312e]/40'}`} />
          </div>
          <div
            className={`mt-3 text-2xl font-bold font-mono tabular-nums ${
              totalOverdue > 0 ? 'text-[#b42318]' : 'text-[#24312e]'
            }`}
          >
            {formatCurrency(totalOverdue, currentWorkspace.currency)}
          </div>
          <div className="mt-2 text-[11px] text-[#24312e]/60 flex items-center justify-between">
            <span>{overdueInvoices.length} invoices past due</span>
            {totalOverdue > 0 ? (
              <span className="text-[#b42318] font-semibold">Follow up required →</span>
            ) : (
              <span className="text-[#008371] font-medium">All current</span>
            )}
          </div>
        </div>

        {/* Collected / Paid */}
        <div
          onClick={() => onNavigateToInvoices('paid')}
          className="p-5 bg-[#fffdf9] border border-[#c9b896] rounded-lg shadow-xs hover:border-[#008371] cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-xs font-medium text-[#24312e]/70">
            <span>Collected Payments</span>
            <CheckCircle2 className="w-4 h-4 text-[#008371]" />
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-[#008371] tabular-nums">
            {formatCurrency(totalPaid, currentWorkspace.currency)}
          </div>
          <div className="mt-2 text-[11px] text-[#24312e]/60 flex items-center justify-between">
            <span>Verified remittances</span>
            <span className="text-[#008371] font-semibold">Settled →</span>
          </div>
        </div>

        {/* Draft Invoices */}
        <div
          onClick={() => onNavigateToInvoices('draft')}
          className="p-5 bg-[#fffdf9] border border-[#c9b896] rounded-lg shadow-xs hover:border-[#008371] cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-xs font-medium text-[#24312e]/70">
            <span>Draft Pipeline</span>
            <FileClock className="w-4 h-4 text-[#b8a888]" />
          </div>
          <div className="mt-3 text-2xl font-bold font-mono text-[#24312e] tabular-nums">
            {formatCurrency(totalDraftValue, currentWorkspace.currency)}
          </div>
          <div className="mt-2 text-[11px] text-[#24312e]/60 flex items-center justify-between">
            <span>{draftInvoices.length} draft documents</span>
            <span className="text-[#006b5b] font-semibold">Ready to review →</span>
          </div>
        </div>
      </div>

      {/* Receivables Aging Breakdown & Quick Health */}
      <div className="p-5 bg-[#fffdf9] border border-[#c9b896] rounded-lg shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#24312e]">
            Receivables Aging & Liquidity Profile
          </h2>
          <span className="text-xs text-[#24312e]/60 font-mono">Current period: Q3 2026</span>
        </div>

        {/* Aging Visual Bar */}
        <div className="h-4 rounded-md overflow-hidden bg-[#e8dcc8]/40 flex border border-[#c9b896]/50">
          <div
            title={`Current: ${formatCurrency(totalOutstanding - totalOverdue, currentWorkspace.currency)}`}
            style={{
              width: `${totalOutstanding > 0 ? Math.max(5, ((totalOutstanding - totalOverdue) / totalOutstanding) * 100) : 50}%`,
            }}
            className="bg-[#008371] h-full transition-all"
          />
          <div
            title={`Overdue: ${formatCurrency(totalOverdue, currentWorkspace.currency)}`}
            style={{
              width: `${totalOutstanding > 0 ? Math.max(5, (totalOverdue / totalOutstanding) * 100) : 50}%`,
            }}
            className="bg-[#b42318] h-full transition-all"
          />
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-xs bg-[#008371]" />
            <span className="text-[#24312e]/80">Current / Within Terms:</span>
            <strong className="font-mono tabular-nums text-[#24312e]">
              {formatCurrency(Math.max(0, totalOutstanding - totalOverdue), currentWorkspace.currency)}
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-xs bg-[#b42318]" />
            <span className="text-[#24312e]/80">Overdue Balances:</span>
            <strong className="font-mono tabular-nums text-[#b42318]">
              {formatCurrency(totalOverdue, currentWorkspace.currency)}
            </strong>
          </div>
          <div className="flex items-center gap-2 ml-auto text-[11px] text-[#24312e]/60">
            <span>Decimal-safe rounding enforced across line items & totals</span>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table (Desktop table + Mobile touch cards) */}
      <div className="bg-[#fffdf9] border border-[#c9b896] rounded-lg shadow-xs overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#c9b896]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#008371]" />
            <h2 className="text-sm font-bold text-[#24312e]">Recent Invoice Activity</h2>
          </div>
          <button
            onClick={() => onNavigateToInvoices()}
            className="text-xs font-semibold text-[#006b5b] hover:underline flex items-center gap-1 min-h-[36px]"
          >
            <span>View all</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Mobile Cards (Layout B from mobile guidelines) */}
        <div className="divide-y divide-[#c9b896]/30 md:hidden">
          {recentInvoices.map((inv) => {
            const isOverdue = isInvoiceOverdue(inv);

            return (
              <div
                key={inv.id}
                onClick={() => onSelectInvoice(inv)}
                className="p-3.5 hover:bg-[#f5f0e6]/50 active:bg-[#e8dcc8]/60 transition-colors cursor-pointer space-y-2 min-h-[64px]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#006b5b]">
                      {inv.invoiceNumber}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase ${
                        inv.documentStatus === 'issued'
                          ? 'bg-[#008371]/10 text-[#008371]'
                          : inv.documentStatus === 'void'
                          ? 'bg-[#b42318]/10 text-[#b42318] line-through'
                          : 'bg-[#e8dcc8] text-[#24312e]'
                      }`}
                    >
                      {inv.documentStatus}
                    </span>
                  </div>

                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-semibold uppercase ${
                      inv.documentStatus === 'void'
                        ? 'bg-neutral-100 text-neutral-500'
                        : isOverdue
                        ? 'bg-[#b42318] text-white'
                        : inv.paymentStatus === 'paid'
                        ? 'bg-[#008371] text-white'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {inv.documentStatus === 'void' ? 'VOID' : isOverdue ? 'OVERDUE' : inv.paymentStatus.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-baseline justify-between">
                  <div className="truncate mr-2">
                    <div className="text-xs font-semibold text-[#24312e] truncate">
                      {inv.customerSnapshot.name}
                    </div>
                    <div className="text-[10px] text-[#24312e]/60 font-mono">
                      Due: {formatDate(inv.dueDate)}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-xs text-[#24312e]">
                      {formatCurrency(inv.grandTotal, inv.currency)}
                    </div>
                    {inv.balanceDue > 0 && inv.documentStatus !== 'void' && (
                      <div className={`text-[10px] font-mono font-semibold ${isOverdue ? 'text-[#b42318]' : 'text-[#24312e]/70'}`}>
                        Bal: {formatCurrency(inv.balanceDue, inv.currency)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f0e6]/60 border-b border-[#c9b896]/50 text-[#24312e]/70">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Invoice #</th>
                <th className="py-2.5 px-4 font-semibold">Customer</th>
                <th className="py-2.5 px-4 font-semibold">Due Date</th>
                <th className="py-2.5 px-4 font-semibold text-right">Grand Total</th>
                <th className="py-2.5 px-4 font-semibold text-right">Balance Due</th>
                <th className="py-2.5 px-4 font-semibold text-center">Document</th>
                <th className="py-2.5 px-4 font-semibold text-center">Payment</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c9b896]/30">
              {recentInvoices.map((inv) => {
                const isOverdue = isInvoiceOverdue(inv);

                return (
                  <tr
                    key={inv.id}
                    onClick={() => onSelectInvoice(inv)}
                    className="hover:bg-[#f5f0e6]/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-[#006b5b] group-hover:underline">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#24312e]">
                      <div>{inv.customerSnapshot.name}</div>
                      {inv.referencePo && (
                        <div className="text-[10px] text-[#24312e]/60 font-mono">PO: {inv.referencePo}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className={isOverdue ? 'text-[#b42318] font-bold' : 'text-[#24312e]'}>
                        {formatDate(inv.dueDate)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-right font-bold text-[#24312e] tabular-nums">
                      {formatCurrency(inv.grandTotal, inv.currency)}
                    </td>
                    <td className="py-3 px-4 font-mono text-right font-bold tabular-nums">
                      <span className={inv.balanceDue > 0 ? (isOverdue ? 'text-[#b42318]' : 'text-[#24312e]') : 'text-[#008371]'}>
                        {formatCurrency(inv.balanceDue, inv.currency)}
                      </span>
                    </td>

                    {/* Document State */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                          inv.documentStatus === 'issued'
                            ? 'bg-[#008371]/10 text-[#008371]'
                            : inv.documentStatus === 'void'
                            ? 'bg-[#b42318]/10 text-[#b42318] line-through'
                            : 'bg-[#e8dcc8] text-[#24312e]'
                        }`}
                      >
                        {inv.documentStatus}
                      </span>
                    </td>

                    {/* Payment State */}
                    <td className="py-3 px-4 text-center">
                      {inv.documentStatus === 'void' ? (
                        <span className="text-[10px] text-[#24312e]/50 font-mono">VOID</span>
                      ) : isOverdue ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded font-semibold bg-[#b42318]/15 text-[#b42318]">
                          OVERDUE
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                            inv.paymentStatus === 'paid'
                              ? 'bg-[#008371] text-white'
                              : inv.paymentStatus === 'partially_paid'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {inv.paymentStatus === 'partially_paid' ? 'Partial' : inv.paymentStatus}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectInvoice(inv);
                        }}
                        className="px-2.5 py-1 text-xs font-medium border border-[#c9b896] hover:bg-[#e8dcc8] rounded text-[#24312e] transition-colors"
                      >
                        Inspect →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
