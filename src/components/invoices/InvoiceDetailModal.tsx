import React, { useState } from 'react';
import { Invoice } from '../../types';
import { useWorkspace } from '../../context/WorkspaceContext';
import { formatCurrency, formatDate, isInvoiceOverdue } from '../../utils/calculations';
import { PaymentModal } from './PaymentModal';
import { SendEmailModal } from './SendEmailModal';
import { VoidModal } from './VoidModal';
import {
  Printer,
  Mail,
  DollarSign,
  Ban,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  History,
  FileText,
  CreditCard,
  Building2,
  Calendar,
  X,
} from 'lucide-react';

interface InvoiceDetailModalProps {
  invoice: Invoice;
  onClose: () => void;
  onEditDraft?: (invoice: Invoice) => void;
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  invoice,
  onClose,
  onEditDraft,
}) => {
  const {
    canIssueInvoice,
    canRecordPayment,
    canVoidInvoice,
    issueInvoice,
    recordPayment,
    sendInvoiceEmail,
    retryInvoiceDelivery,
    voidInvoice,
    payments,
    auditEvents,
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'preview' | 'payments' | 'delivery' | 'audit'>('preview');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showVoidModal, setShowVoidModal] = useState(false);
  const [retryingDelivery, setRetryingDelivery] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  const isOverdue = isInvoiceOverdue(invoice);

  // Filter payments linked to this invoice
  const invoicePayments = payments.filter((p) => p.invoiceId === invoice.id);

  // Filter audit events linked to this invoice
  const invoiceAuditEvents = auditEvents.filter(
    (a) => a.targetId === invoice.id || a.summary.includes(invoice.invoiceNumber)
  );

  const handleIssue = () => {
    const res = issueInvoice(invoice.id);
    if (res.success) {
      setActionMessage(`Allocated sequential number ${res.invoice?.invoiceNumber} and issued successfully.`);
    } else {
      alert(res.error || 'Failed to issue invoice.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRetryDelivery = async () => {
    setRetryingDelivery(true);
    const res = await retryInvoiceDelivery(invoice.id);
    setRetryingDelivery(false);
    if (res.success) {
      setActionMessage('Delivery retried successfully and accepted by provider.');
    } else {
      setActionMessage('Retry failed. Please check recipient address.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-0 sm:p-4 overflow-y-auto">
      <div className="bg-[#fffdf9] border-0 sm:border border-[#c9b896] rounded-none sm:rounded-xl max-w-4xl w-full h-full sm:h-auto sm:my-auto shadow-2xl overflow-hidden flex flex-col sm:max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="p-3 sm:p-4 border-b border-[#c9b896]/60 bg-[#fffdf9] flex flex-wrap items-center justify-between gap-2 sm:gap-3 no-print">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 rounded bg-[#008371] text-white flex items-center justify-center font-bold text-xs shrink-0">
              IW
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base md:text-lg font-bold font-mono text-[#24312e]">
                  {invoice.invoiceNumber}
                </h2>
                {/* Document Status */}
                <span
                  className={`text-[9px] sm:text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                    invoice.documentStatus === 'issued'
                      ? 'bg-[#008371]/15 text-[#008371]'
                      : invoice.documentStatus === 'void'
                      ? 'bg-[#b42318]/15 text-[#b42318]'
                      : 'bg-[#e8dcc8] text-[#24312e]'
                  }`}
                >
                  {invoice.documentStatus}
                </span>

                {/* Overdue / Payment Status */}
                {invoice.documentStatus === 'issued' && (
                  <span
                    className={`text-[9px] sm:text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                      isOverdue
                        ? 'bg-[#b42318] text-white'
                        : invoice.paymentStatus === 'paid'
                        ? 'bg-[#008371] text-white'
                        : invoice.paymentStatus === 'partially_paid'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-neutral-100 text-neutral-700'
                    }`}
                  >
                    {isOverdue ? 'OVERDUE' : invoice.paymentStatus.replace('_', ' ')}
                  </span>
                )}
              </div>
              <div className="text-[11px] sm:text-xs text-[#24312e]/70 truncate">
                Customer: <strong>{invoice.customerSnapshot.name}</strong>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 ml-auto sm:ml-0">
            {/* Draft Actions */}
            {invoice.documentStatus === 'draft' && (
              <>
                {onEditDraft && (
                  <button
                    onClick={() => {
                      onClose();
                      onEditDraft(invoice);
                    }}
                    className="px-2.5 py-1.5 min-h-[36px] text-xs font-medium border border-[#c9b896] hover:bg-[#e8dcc8] rounded text-[#24312e]"
                  >
                    Edit Draft
                  </button>
                )}
                {canIssueInvoice && (
                  <button
                    onClick={handleIssue}
                    className="px-3 py-1.5 min-h-[36px] bg-[#008371] hover:bg-[#006b5b] text-white text-xs font-semibold rounded shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Issue</span>
                  </button>
                )}
              </>
            )}

            {/* Issued Actions */}
            {invoice.documentStatus === 'issued' && (
              <>
                {/* Send Email */}
                <button
                  onClick={() => setShowSendModal(true)}
                  className="px-2.5 py-1.5 min-h-[36px] text-xs font-medium border border-[#c9b896] hover:bg-[#e8dcc8] rounded text-[#24312e] flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5 text-[#008371]" />
                  <span>Send</span>
                </button>

                {/* Record Payment (if balance > 0) */}
                {invoice.balanceDue > 0 && canRecordPayment && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="px-3 py-1.5 min-h-[36px] bg-[#008371] hover:bg-[#006b5b] text-white text-xs font-semibold rounded shadow-xs flex items-center gap-1 cursor-pointer"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Pay</span>
                  </button>
                )}

                {/* Void Invoice */}
                {canVoidInvoice && (
                  <button
                    onClick={() => setShowVoidModal(true)}
                    className="px-2.5 py-1.5 min-h-[36px] text-xs font-medium text-[#b42318] border border-[#b42318]/40 hover:bg-[#b42318]/10 rounded flex items-center gap-1"
                    title="Void this issued financial record"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Void</span>
                  </button>
                )}
              </>
            )}

            {/* Print / Download PDF */}
            <button
              onClick={handlePrint}
              className="px-2.5 py-1.5 min-h-[36px] text-xs font-medium border border-[#c9b896] hover:bg-[#e8dcc8] rounded text-[#24312e] flex items-center gap-1"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-[#24312e]/60 hover:text-[#24312e] rounded-md"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action feedback banner if any */}
        {actionMessage && (
          <div className="px-4 py-2 bg-[#008371]/10 border-b border-[#008371]/30 text-xs text-[#006b5b] flex items-center justify-between no-print">
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage('')} className="font-bold">✕</button>
          </div>
        )}

        {/* Sub-tabs Navigation (horizontally scrollable on mobile) */}
        <div className="px-3 sm:px-4 pt-2 border-b border-[#c9b896]/40 bg-[#f5f0e6]/40 flex gap-3 sm:gap-4 text-xs font-medium no-print overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setActiveTab('preview')}
            className={`pb-2.5 border-b-2 transition-colors shrink-0 min-h-[36px] ${
              activeTab === 'preview'
                ? 'border-[#008371] text-[#008371] font-bold'
                : 'border-transparent text-[#24312e]/70 hover:text-[#24312e]'
            }`}
          >
            Invoice Document
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-2.5 border-b-2 transition-colors shrink-0 min-h-[36px] flex items-center gap-1.5 ${
              activeTab === 'payments'
                ? 'border-[#008371] text-[#008371] font-bold'
                : 'border-transparent text-[#24312e]/70 hover:text-[#24312e]'
            }`}
          >
            <span>Payment History</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 bg-[#e8dcc8] rounded">
              {invoicePayments.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('delivery')}
            className={`pb-2.5 border-b-2 transition-colors shrink-0 min-h-[36px] flex items-center gap-1.5 ${
              activeTab === 'delivery'
                ? 'border-[#008371] text-[#008371] font-bold'
                : 'border-transparent text-[#24312e]/70 hover:text-[#24312e]'
            }`}
          >
            <span>Delivery Tracking</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 bg-[#e8dcc8] rounded">
              {invoice.deliveryAttempts?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-2.5 border-b-2 transition-colors shrink-0 min-h-[36px] flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-[#008371] text-[#008371] font-bold'
                : 'border-transparent text-[#24312e]/70 hover:text-[#24312e]'
            }`}
          >
            <span>Audit Trail</span>
            <span className="font-mono text-[10px] px-1.5 py-0.2 bg-[#e8dcc8] rounded">
              {invoiceAuditEvents.length}
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-3 sm:p-8 overflow-y-auto flex-1 bg-[#f5f0e6]/20">
          {/* TAB 1: INVOICE PREVIEW */}
          {activeTab === 'preview' && (
            <div className="bg-[#fffdf9] p-6 sm:p-10 rounded-lg border border-[#c9b896] shadow-sm max-w-3xl mx-auto print-card relative">
              {/* Void Banner Watermark if VOID */}
              {invoice.documentStatus === 'void' && (
                <div className="mb-6 p-4 bg-[#b42318]/10 border-2 border-[#b42318] rounded-lg text-center">
                  <div className="text-xl font-bold font-mono text-[#b42318] uppercase tracking-widest">
                    *** VOIDED INVOICE ***
                  </div>
                  <div className="text-xs text-[#24312e] mt-1 font-medium">
                    Reason: {invoice.voidReason || 'Cancelled per administrative review'}
                  </div>
                  <div className="text-[10px] text-[#24312e]/60 mt-0.5">
                    Voided on {formatDate(invoice.voidedAt || '')} by {invoice.voidedBy || 'Administrator'}
                  </div>
                </div>
              )}

              {/* Invoice Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-[#c9b896]/60">
                <div>
                  <div className="text-xl font-bold text-[#24312e] tracking-tight">
                    {invoice.companySnapshot.legalName}
                  </div>
                  <div className="text-xs text-[#24312e]/70 mt-1 space-y-0.5">
                    <div>{invoice.companySnapshot.address}</div>
                    <div>Email: {invoice.companySnapshot.email} · Phone: {invoice.companySnapshot.phone}</div>
                    {invoice.companySnapshot.taxId && (
                      <div>Tax Registration / EIN: <strong>{invoice.companySnapshot.taxId}</strong></div>
                    )}
                  </div>
                </div>

                <div className="sm:text-right">
                  <div className="text-2xl font-bold text-[#008371] tracking-tight font-mono">
                    INVOICE
                  </div>
                  <div className="text-sm font-mono font-bold text-[#24312e] mt-0.5">
                    #{invoice.invoiceNumber}
                  </div>
                  {invoice.referencePo && (
                    <div className="text-xs text-[#24312e]/70 font-mono mt-1">
                      Client PO: <strong>{invoice.referencePo}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Bill To & Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-[#c9b896]/60 text-xs">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#24312e]/60 block mb-1">
                    Billed To:
                  </span>
                  <div className="font-bold text-sm text-[#24312e]">
                    {invoice.customerSnapshot.name}
                  </div>
                  <div className="text-[#24312e]/80 mt-0.5 leading-relaxed">
                    <div>{invoice.customerSnapshot.legalName}</div>
                    <div>{invoice.customerSnapshot.address}</div>
                    <div>{invoice.customerSnapshot.email}</div>
                    {invoice.customerSnapshot.taxId && (
                      <div>Client Tax ID: {invoice.customerSnapshot.taxId}</div>
                    )}
                  </div>
                </div>

                <div className="sm:text-right space-y-1">
                  <div className="flex sm:justify-end gap-3">
                    <span className="text-[#24312e]/60">Invoice Date:</span>
                    <strong className="font-mono">{formatDate(invoice.issueDate)}</strong>
                  </div>
                  <div className="flex sm:justify-end gap-3">
                    <span className="text-[#24312e]/60">Payment Due:</span>
                    <strong className={`font-mono ${isOverdue ? 'text-[#b42318]' : ''}`}>
                      {formatDate(invoice.dueDate)}
                    </strong>
                  </div>
                  <div className="flex sm:justify-end gap-3">
                    <span className="text-[#24312e]/60">Currency:</span>
                    <strong className="font-mono">{invoice.currency}</strong>
                  </div>
                  <div className="flex sm:justify-end gap-3">
                    <span className="text-[#24312e]/60">Payment Status:</span>
                    <strong className="font-mono uppercase text-[#006b5b]">
                      {invoice.documentStatus === 'void' ? 'VOID' : isOverdue ? 'OVERDUE' : invoice.paymentStatus}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="py-6">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#c9b896] text-[#24312e]/70 font-semibold">
                    <tr>
                      <th className="py-2.5 pr-4">Description</th>
                      <th className="py-2.5 px-3 text-center">Unit</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Rate</th>
                      <th className="py-2.5 px-3 text-right">Disc</th>
                      <th className="py-2.5 px-3 text-right">Tax</th>
                      <th className="py-2.5 pl-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#c9b896]/30">
                    {invoice.items.map((line) => (
                      <tr key={line.id}>
                        <td className="py-3 pr-4 font-medium text-[#24312e]">
                          {line.description}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-[#24312e]/70">
                          {line.unit}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          {line.quantity}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          {formatCurrency(line.unitRate, invoice.currency)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-[#24312e]/70">
                          {line.discountPercent > 0 ? `${line.discountPercent}%` : '—'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-[#24312e]/70">
                          {line.taxPercent > 0 ? `${line.taxPercent}%` : '0%'}
                        </td>
                        <td className="py-3 pl-3 text-right font-mono font-bold tabular-nums text-[#24312e]">
                          {formatCurrency(line.lineTotal, invoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals Calculation Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#c9b896]/60">
                <div className="text-xs space-y-3">
                  {invoice.notes && (
                    <div>
                      <span className="font-bold text-[#24312e]">Client Notes:</span>
                      <p className="text-[#24312e]/80 mt-0.5 italic">{invoice.notes}</p>
                    </div>
                  )}

                  <div className="p-3 bg-[#f5f0e6]/70 rounded border border-[#c9b896]/60">
                    <span className="font-bold text-[#24312e] block mb-1">
                      Payment Remittance Instructions:
                    </span>
                    <pre className="font-mono text-[11px] text-[#24312e]/80 whitespace-pre-wrap">
                      {invoice.companySnapshot.paymentInstructions || 'Wire or ACH remittance.'}
                    </pre>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-[#24312e]/80">
                    <span>Subtotal:</span>
                    <span className="font-mono tabular-nums">{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                  </div>

                  {invoice.totalDiscount > 0 && (
                    <div className="flex justify-between text-[#b42318]">
                      <span>Discounts:</span>
                      <span className="font-mono tabular-nums">-{formatCurrency(invoice.totalDiscount, invoice.currency)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-[#24312e]/80">
                    <span>Taxes:</span>
                    <span className="font-mono tabular-nums">{formatCurrency(invoice.totalTax, invoice.currency)}</span>
                  </div>

                  <div className="flex justify-between text-sm font-bold text-[#24312e] pt-2 border-t border-[#c9b896]">
                    <span>Grand Total:</span>
                    <span className="font-mono text-base text-[#008371] tabular-nums">
                      {formatCurrency(invoice.grandTotal, invoice.currency)}
                    </span>
                  </div>

                  <div className="flex justify-between text-[#008371] font-medium pt-1">
                    <span>Amount Paid:</span>
                    <span className="font-mono tabular-nums">-{formatCurrency(invoice.amountPaid, invoice.currency)}</span>
                  </div>

                  <div className="flex justify-between text-sm font-bold pt-2 border-t border-[#c9b896]">
                    <span>Balance Due:</span>
                    <span className={`font-mono text-base tabular-nums ${invoice.balanceDue > 0 ? (isOverdue ? 'text-[#b42318]' : 'text-[#24312e]') : 'text-[#008371]'}`}>
                      {formatCurrency(invoice.balanceDue, invoice.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PAYMENT HISTORY */}
          {activeTab === 'payments' && (
            <div className="bg-[#fffdf9] p-6 rounded-lg border border-[#c9b896] shadow-sm space-y-4 max-w-3xl mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#c9b896]/50">
                <div>
                  <h3 className="text-sm font-bold text-[#24312e]">Append-Only Payment Records</h3>
                  <p className="text-xs text-[#24312e]/70">
                    Every payment remittance applied against invoice {invoice.invoiceNumber}.
                  </p>
                </div>
                {invoice.balanceDue > 0 && canRecordPayment && (
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="px-3 py-1.5 bg-[#008371] hover:bg-[#006b5b] text-white text-xs font-semibold rounded"
                  >
                    + Record Payment
                  </button>
                )}
              </div>

              {invoicePayments.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#24312e]/60">
                  <CreditCard className="w-8 h-8 mx-auto text-[#c9b896] mb-2" />
                  <p>No payments recorded yet for this invoice.</p>
                  <p className="mt-1">Outstanding balance: <strong>{formatCurrency(invoice.balanceDue, invoice.currency)}</strong></p>
                </div>
              ) : (
                <div className="divide-y divide-[#c9b896]/30">
                  {invoicePayments.map((p) => (
                    <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[#24312e] font-mono">
                          {formatCurrency(p.amount, invoice.currency)}
                        </div>
                        <div className="text-[11px] text-[#24312e]/70 mt-0.5">
                          Method: <strong className="uppercase">{p.paymentMethod.replace('_', ' ')}</strong> · Ref: <span className="font-mono">{p.reference}</span>
                        </div>
                        {p.notes && <div className="text-[11px] text-[#24312e]/60 italic mt-0.5">"{p.notes}"</div>}
                      </div>

                      <div className="text-right text-[11px] text-[#24312e]/70 font-mono">
                        <div>Date: {formatDate(p.paymentDate)}</div>
                        <div className="text-[10px]">Actor: {p.actorName}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DELIVERY TRACKING */}
          {activeTab === 'delivery' && (
            <div className="bg-[#fffdf9] p-6 rounded-lg border border-[#c9b896] shadow-sm space-y-4 max-w-3xl mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-[#c9b896]/50">
                <div>
                  <h3 className="text-sm font-bold text-[#24312e]">Email Delivery Tracking</h3>
                  <p className="text-xs text-[#24312e]/70">
                    SMTP dispatch attempts, provider response codes, and retry history.
                  </p>
                </div>
                {invoice.deliveryStatus === 'failed' && (
                  <button
                    onClick={handleRetryDelivery}
                    disabled={retryingDelivery}
                    className="px-3 py-1.5 bg-[#b42318] hover:bg-[#911c13] text-white text-xs font-semibold rounded flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${retryingDelivery ? 'animate-spin' : ''}`} />
                    <span>Retry Failed Delivery</span>
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-[#f5f0e6] rounded border border-[#c9b896]/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#24312e]/60">Current Delivery State:</span>
                    <div className="font-bold text-sm text-[#24312e] capitalize">
                      {invoice.deliveryStatus.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <span className="text-[#24312e]/60">Recipient Mailbox:</span>
                    <div className="font-mono text-xs text-[#24312e]">
                      {invoice.customerSnapshot.email || 'N/A'}
                    </div>
                  </div>
                </div>

                {(!invoice.deliveryAttempts || invoice.deliveryAttempts.length === 0) ? (
                  <div className="py-6 text-center text-xs text-[#24312e]/60">
                    <Mail className="w-8 h-8 mx-auto text-[#c9b896] mb-2" />
                    <p>This invoice has not yet been dispatched via email.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {invoice.deliveryAttempts.map((att) => (
                      <div
                        key={att.id}
                        className={`p-3 rounded border text-xs flex items-center justify-between ${
                          att.status === 'sent'
                            ? 'bg-[#008371]/10 border-[#008371]/30 text-[#006b5b]'
                            : 'bg-[#b42318]/10 border-[#b42318]/30 text-[#b42318]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {att.status === 'sent' ? (
                            <CheckCircle2 className="w-4 h-4 text-[#008371]" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-[#b42318]" />
                          )}
                          <div>
                            <div className="font-bold uppercase font-mono">{att.status}</div>
                            <div className="text-[11px] text-[#24312e]/80">
                              Recipient: {att.recipient}
                            </div>
                            {att.errorMessage && (
                              <div className="text-[11px] text-[#b42318] mt-0.5 font-mono">
                                {att.errorMessage}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-[11px] font-mono text-[#24312e]/60">
                          {new Date(att.sentAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="bg-[#fffdf9] p-6 rounded-lg border border-[#c9b896] shadow-sm space-y-4 max-w-3xl mx-auto">
              <div className="pb-3 border-b border-[#c9b896]/50">
                <h3 className="text-sm font-bold text-[#24312e]">Document Audit Trail</h3>
                <p className="text-xs text-[#24312e]/70">
                  Tamper-evident record of all lifecycle, status, and remittance actions for this record.
                </p>
              </div>

              {invoiceAuditEvents.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#24312e]/60">
                  <History className="w-8 h-8 mx-auto text-[#c9b896] mb-2" />
                  <p>Initial creation event logged.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoiceAuditEvents.map((evt) => (
                    <div key={evt.id} className="p-3 bg-[#f5f0e6]/50 border border-[#c9b896]/40 rounded text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#008371] text-[11px]">
                          {evt.action}
                        </span>
                        <span className="text-[10px] font-mono text-[#24312e]/60">
                          {new Date(evt.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="font-medium text-[#24312e]">{evt.summary}</div>
                      {evt.details && <div className="text-[11px] text-[#24312e]/70 italic">{evt.details}</div>}
                      <div className="text-[10px] text-[#24312e]/60 pt-0.5">
                        Actor: {evt.actorName} ({evt.actorRole.toUpperCase()})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          invoice={invoice}
          onClose={() => setShowPaymentModal(false)}
          onPaymentRecorded={() => {
            setShowPaymentModal(false);
            setActionMessage('Payment recorded successfully. Balance reconciled.');
          }}
          recordPayment={recordPayment}
        />
      )}

      {/* Send Email Modal */}
      {showSendModal && (
        <SendEmailModal
          invoice={invoice}
          onClose={() => setShowSendModal(false)}
          onSent={() => {
            setShowSendModal(false);
            setActionMessage(`Invoice ${invoice.invoiceNumber} dispatched via email.`);
          }}
          sendInvoiceEmail={sendInvoiceEmail}
        />
      )}

      {/* Void Modal */}
      {showVoidModal && (
        <VoidModal
          invoice={invoice}
          onClose={() => setShowVoidModal(false)}
          onVoidConfirmed={() => {
            setShowVoidModal(false);
            setActionMessage(`Invoice ${invoice.invoiceNumber} has been voided.`);
          }}
          voidInvoice={voidInvoice}
        />
      )}
    </div>
  );
};
