import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { formatCurrency, formatDate } from '../../utils/calculations';
import { BarChart3, Download, Calendar, DollarSign, ArrowUpRight, TrendingUp } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { currentWorkspace, invoices, payments, customers } = useWorkspace();

  const [dateRange, setDateRange] = useState<'30d' | '90d' | 'ytd' | 'all'>('all');

  // Compute Receivables Aging
  const today = '2026-09-30';
  const todayTime = new Date(today).getTime();

  let currentBucket = 0;
  let bucket1_30 = 0;
  let bucket31_60 = 0;
  let bucket61_90 = 0;
  let bucket90Plus = 0;

  const customerAgingMap: Record<
    string,
    {
      name: string;
      current: number;
      b1_30: number;
      b31_60: number;
      b61_90: number;
      b90Plus: number;
      total: number;
    }
  > = {};

  invoices.forEach((inv) => {
    if (inv.documentStatus !== 'issued' || inv.balanceDue <= 0.001) return;

    const dueTime = new Date(inv.dueDate).getTime();
    const daysPastDue = Math.floor((todayTime - dueTime) / (1000 * 60 * 60 * 24));
    const bal = inv.balanceDue;

    if (!customerAgingMap[inv.customerId]) {
      customerAgingMap[inv.customerId] = {
        name: inv.customerSnapshot.name,
        current: 0,
        b1_30: 0,
        b31_60: 0,
        b61_90: 0,
        b90Plus: 0,
        total: 0,
      };
    }

    const cEntry = customerAgingMap[inv.customerId];
    cEntry.total += bal;

    if (daysPastDue <= 0) {
      currentBucket += bal;
      cEntry.current += bal;
    } else if (daysPastDue <= 30) {
      bucket1_30 += bal;
      cEntry.b1_30 += bal;
    } else if (daysPastDue <= 60) {
      bucket31_60 += bal;
      cEntry.b31_60 += bal;
    } else if (daysPastDue <= 90) {
      bucket61_90 += bal;
      cEntry.b61_90 += bal;
    } else {
      bucket90Plus += bal;
      cEntry.b90Plus += bal;
    }
  });

  const totalOutstanding = currentBucket + bucket1_30 + bucket31_60 + bucket61_90 + bucket90Plus;

  // Collections metrics
  const totalInvoicedIssued = invoices
    .filter((i) => i.documentStatus === 'issued')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  // CSV Export for Aging
  const handleExportAgingCsv = () => {
    const headers = ['Customer', 'Current', '1-30 Days', '31-60 Days', '61-90 Days', '90+ Days', 'Total Outstanding'];
    const rows = Object.values(customerAgingMap).map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      c.current.toFixed(2),
      c.b1_30.toFixed(2),
      c.b31_60.toFixed(2),
      c.b61_90.toFixed(2),
      c.b90Plus.toFixed(2),
      c.total.toFixed(2),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `receivables_aging_${currentWorkspace.name.replace(/\s+/g, '_')}_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#c9b896]/60">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#24312e]">
            Financial & Receivables Reports
          </h1>
          <p className="text-xs md:text-sm text-[#24312e]/70 mt-1">
            Accounts receivable aging schedules, cash collection reconciliation, and revenue realization.
          </p>
        </div>

        <button
          onClick={handleExportAgingCsv}
          className="px-3.5 py-2 text-xs font-medium border border-[#c9b896] bg-[#fffdf9] hover:bg-[#e8dcc8]/50 text-[#24312e] rounded-md transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Aging Schedule (CSV)</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-[#fffdf9] border border-[#c9b896] rounded-lg shadow-xs">
          <span className="text-xs text-[#24312e]/70 block font-medium">Total Billed (Issued)</span>
          <div className="text-2xl font-bold font-mono text-[#24312e] mt-2 tabular-nums">
            {formatCurrency(totalInvoicedIssued, currentWorkspace.currency)}
          </div>
          <span className="text-[11px] text-[#24312e]/60 mt-1 block">Active commercial ledger</span>
        </div>

        <div className="p-5 bg-[#fffdf9] border border-[#c9b896] rounded-lg shadow-xs">
          <span className="text-xs text-[#24312e]/70 block font-medium">Realized Collections</span>
          <div className="text-2xl font-bold font-mono text-[#008371] mt-2 tabular-nums">
            {formatCurrency(totalCollected, currentWorkspace.currency)}
          </div>
          <span className="text-[11px] text-[#008371] mt-1 block font-medium">
            {totalInvoicedIssued > 0
              ? `${((totalCollected / totalInvoicedIssued) * 100).toFixed(1)}% recovery rate`
              : '0%'}
          </span>
        </div>

        <div className="p-5 bg-[#fffdf9] border border-[#c9b896] rounded-lg shadow-xs">
          <span className="text-xs text-[#24312e]/70 block font-medium">Outstanding Receivables</span>
          <div className="text-2xl font-bold font-mono text-[#24312e] mt-2 tabular-nums">
            {formatCurrency(totalOutstanding, currentWorkspace.currency)}
          </div>
          <span className="text-[11px] text-[#b42318] mt-1 block font-semibold">
            {formatCurrency(totalOutstanding - currentBucket, currentWorkspace.currency)} currently past due
          </span>
        </div>
      </div>

      {/* Aging Schedule Table */}
      <div className="bg-[#fffdf9] border border-[#c9b896] rounded-lg shadow-xs overflow-hidden space-y-3 p-5">
        <div className="flex items-center justify-between pb-2 border-b border-[#c9b896]/40">
          <div>
            <h2 className="text-sm font-bold text-[#24312e]">Accounts Receivable Aging Schedule</h2>
            <p className="text-xs text-[#24312e]/70">Calculated as of reference date: {today}</p>
          </div>
        </div>

        {/* Bucket Breakdown Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 p-3 bg-[#f5f0e6]/60 rounded-md border border-[#c9b896]/50 text-xs">
          <div>
            <span className="text-[11px] text-[#24312e]/70 block font-semibold">Current (0-30d terms)</span>
            <div className="font-mono font-bold text-[#008371] text-sm tabular-nums">
              {formatCurrency(currentBucket, currentWorkspace.currency)}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-[#24312e]/70 block font-semibold">1 - 30 Days Overdue</span>
            <div className="font-mono font-bold text-[#24312e] text-sm tabular-nums">
              {formatCurrency(bucket1_30, currentWorkspace.currency)}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-[#24312e]/70 block font-semibold">31 - 60 Days Overdue</span>
            <div className="font-mono font-bold text-amber-800 text-sm tabular-nums">
              {formatCurrency(bucket31_60, currentWorkspace.currency)}
            </div>
          </div>
          <div>
            <span className="text-[11px] text-[#24312e]/70 block font-semibold">61 - 90 Days Overdue</span>
            <div className="font-mono font-bold text-orange-800 text-sm tabular-nums">
              {formatCurrency(bucket61_90, currentWorkspace.currency)}
            </div>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[11px] text-[#24312e]/70 block font-semibold">90+ Days Overdue</span>
            <div className="font-mono font-bold text-[#b42318] text-sm tabular-nums">
              {formatCurrency(bucket90Plus, currentWorkspace.currency)}
            </div>
          </div>
        </div>

        {/* Mobile View: Customer Aging Cards (visible on < md) */}
        <div className="md:hidden space-y-3 pt-2">
          {Object.keys(customerAgingMap).length === 0 ? (
            <div className="py-6 text-center text-[#24312e]/60 text-xs">
              No active outstanding receivables. All balances settled.
            </div>
          ) : (
            Object.values(customerAgingMap).map((entry, idx) => (
              <div
                key={idx}
                className="p-3.5 bg-[#f5f0e6]/40 border border-[#c9b896]/60 rounded-lg space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="font-bold text-[#24312e]">{entry.name}</div>
                  <div className="font-mono font-bold text-sm text-[#24312e]">
                    {formatCurrency(entry.total, currentWorkspace.currency)}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-[#c9b896]/30">
                  <div>
                    <span className="text-[#24312e]/60 block text-[10px]">Current</span>
                    <span className="font-mono font-semibold text-[#008371]">
                      {entry.current > 0 ? formatCurrency(entry.current, currentWorkspace.currency) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#24312e]/60 block text-[10px]">1-30 Days</span>
                    <span className="font-mono font-medium text-[#24312e]">
                      {entry.b1_30 > 0 ? formatCurrency(entry.b1_30, currentWorkspace.currency) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#24312e]/60 block text-[10px]">31-60 Days</span>
                    <span className="font-mono font-medium text-amber-800">
                      {entry.b31_60 > 0 ? formatCurrency(entry.b31_60, currentWorkspace.currency) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#24312e]/60 block text-[10px]">61-90 Days</span>
                    <span className="font-mono font-medium text-orange-800">
                      {entry.b61_90 > 0 ? formatCurrency(entry.b61_90, currentWorkspace.currency) : '—'}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#24312e]/60 block text-[10px]">90+ Days</span>
                    <span className="font-mono font-bold text-[#b42318]">
                      {entry.b90Plus > 0 ? formatCurrency(entry.b90Plus, currentWorkspace.currency) : '—'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Detailed Breakdown by Customer Table (hidden on mobile, visible on md+) */}
        <div className="hidden md:block overflow-x-auto pt-2">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f5f0e6]/60 border-b border-[#c9b896]/50 text-[#24312e]/70 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Customer Entity</th>
                <th className="py-2.5 px-3 text-right">Current</th>
                <th className="py-2.5 px-3 text-right">1-30 Days</th>
                <th className="py-2.5 px-3 text-right">31-60 Days</th>
                <th className="py-2.5 px-3 text-right">61-90 Days</th>
                <th className="py-2.5 px-3 text-right">90+ Days</th>
                <th className="py-2.5 px-3 text-right">Total Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c9b896]/30">
              {Object.keys(customerAgingMap).length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-[#24312e]/60">
                    No active outstanding receivables. All balances settled.
                  </td>
                </tr>
              ) : (
                Object.values(customerAgingMap).map((entry, idx) => (
                  <tr key={idx} className="hover:bg-[#f5f0e6]/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#24312e]">{entry.name}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#008371]">
                      {entry.current > 0 ? formatCurrency(entry.current, currentWorkspace.currency) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {entry.b1_30 > 0 ? formatCurrency(entry.b1_30, currentWorkspace.currency) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {entry.b31_60 > 0 ? formatCurrency(entry.b31_60, currentWorkspace.currency) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums">
                      {entry.b61_90 > 0 ? formatCurrency(entry.b61_90, currentWorkspace.currency) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#b42318]">
                      {entry.b90Plus > 0 ? formatCurrency(entry.b90Plus, currentWorkspace.currency) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-[#24312e]">
                      {formatCurrency(entry.total, currentWorkspace.currency)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
