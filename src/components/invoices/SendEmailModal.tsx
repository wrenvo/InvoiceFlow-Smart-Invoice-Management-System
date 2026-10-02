import React, { useState } from 'react';
import { Invoice } from '../../types';
import { Mail, AlertCircle, RefreshCw, Send } from 'lucide-react';

interface SendEmailModalProps {
  invoice: Invoice;
  onClose: () => void;
  onSent: () => void;
  sendInvoiceEmail: (
    invoiceId: string,
    recipientEmail?: string,
    simulateFailure?: boolean
  ) => Promise<{ success: boolean; message: string }>;
}

export const SendEmailModal: React.FC<SendEmailModalProps> = ({
  invoice,
  onClose,
  onSent,
  sendInvoiceEmail,
}) => {
  const [recipient, setRecipient] = useState(invoice.customerSnapshot.email || '');
  const [subject, setSubject] = useState(
    `Invoice ${invoice.invoiceNumber} from ${invoice.companySnapshot.legalName}`
  );
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient) return;

    setSending(true);
    setMessage('');
    setIsError(false);

    const res = await sendInvoiceEmail(invoice.id, recipient, simulateFailure);
    setSending(false);

    if (res.success) {
      setMessage(res.message);
      setTimeout(() => {
        onSent();
      }, 900);
    } else {
      setIsError(true);
      setMessage(res.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#fffdf9] border border-[#c9b896] rounded-xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#c9b896]/60">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#008371] shrink-0" />
            <div className="truncate">
              <h3 className="text-base font-bold text-[#24312e] truncate">Dispatch Invoice via Email</h3>
              <p className="text-xs text-[#24312e]/70 truncate">
                Delivering document <strong>{invoice.invoiceNumber}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#24312e]/50 hover:text-[#24312e] text-lg font-bold"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {message && (
          <div
            className={`p-3 rounded text-xs flex items-start gap-2 ${
              isError
                ? 'bg-[#b42318]/10 border border-[#b42318]/30 text-[#b42318]'
                : 'bg-[#008371]/10 border border-[#008371]/30 text-[#006b5b]'
            }`}
          >
            {isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <Send className="w-4 h-4 shrink-0" />}
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#24312e] mb-1">
              Recipient Email (Customer Billing Contact)
            </label>
            <input
              type="email"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] text-xs rounded border border-[#c9b896] bg-white text-[#24312e]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#24312e] mb-1">
              Subject Line
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 min-h-[44px] text-xs rounded border border-[#c9b896] bg-white text-[#24312e]"
            />
          </div>

          {/* Email Preview Snippet */}
          <div className="p-3 bg-[#f5f0e6]/70 rounded-md border border-[#c9b896]/50 text-xs text-[#24312e]/80 space-y-1 font-mono text-[11px]">
            <div className="truncate">To: {recipient}</div>
            <div>Attached: {invoice.invoiceNumber}.pdf</div>
            <div className="text-[#24312e]/60 pt-1 line-clamp-2">
              "Dear {invoice.customerSnapshot.name}, please find attached your invoice for ${invoice.grandTotal.toFixed(2)} due on {invoice.dueDate}."
            </div>
          </div>

          {/* Failure Simulation Tester (to verify PRD INV-04 retry logic) */}
          <div className="p-2.5 bg-[#e8dcc8]/40 border border-[#c9b896]/60 rounded flex items-center justify-between min-h-[44px]">
            <div className="text-[11px] text-[#24312e] pr-2">
              <span className="font-semibold">Test Delivery Retry:</span> Simulate provider delivery failure (SMTP 550)
            </div>
            <input
              type="checkbox"
              checked={simulateFailure}
              onChange={(e) => setSimulateFailure(e.target.checked)}
              className="rounded accent-[#008371] cursor-pointer min-h-[24px] min-w-[24px]"
            />
          </div>

          <div className="pt-3 border-t border-[#c9b896]/40 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 min-h-[44px] text-xs text-[#24312e]/70"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-4 py-2 min-h-[44px] bg-[#008371] hover:bg-[#006b5b] text-white text-xs font-semibold rounded shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {sending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Dispatch Email</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
