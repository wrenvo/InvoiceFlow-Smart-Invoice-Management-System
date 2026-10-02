import React, { useState } from 'react';
import { Invoice } from '../../types';
import { AlertTriangle } from 'lucide-react';

interface VoidModalProps {
  invoice: Invoice;
  onClose: () => void;
  onVoidConfirmed: () => void;
  voidInvoice: (invoiceId: string, reason: string) => { success: boolean; error?: string };
}

export const VoidModal: React.FC<VoidModalProps> = ({
  invoice,
  onClose,
  onVoidConfirmed,
  voidInvoice,
}) => {
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!confirmed) {
      setErrorMessage('You must confirm that this action cannot be undone.');
      return;
    }
    if (reason.trim().length < 5) {
      setErrorMessage('A detailed business reason is mandatory (minimum 5 characters).');
      return;
    }

    const res = voidInvoice(invoice.id, reason.trim());
    if (res.success) {
      onVoidConfirmed();
    } else {
      setErrorMessage(res.error || 'Failed to void invoice.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#fffdf9] border border-[#b42318] rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto">
        <div className="flex items-center gap-3 pb-3 border-b border-[#c9b896]/60">
          <div className="w-10 h-10 rounded-full bg-[#b42318]/15 text-[#b42318] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h3 className="text-base font-bold text-[#b42318] truncate">Void Issued Invoice</h3>
            <p className="text-xs text-[#24312e]/70 truncate">
              Permanently mark <strong>{invoice.invoiceNumber}</strong> as VOID.
            </p>
          </div>
        </div>

        <div className="p-3 bg-[#b42318]/10 border border-[#b42318]/25 rounded text-xs text-[#24312e] space-y-1.5 leading-relaxed">
          <div className="font-bold text-[#b42318]">Financial Audit Warning:</div>
          <div>
            • The invoice number <strong className="font-mono">{invoice.invoiceNumber}</strong> will be retired and <strong>never reused</strong>.
          </div>
          <div>
            • Historical customer details and line items will be preserved immutably for tax and audit compliance.
          </div>
          <div>
            • Outstanding balance will be cleared to $0.00.
          </div>
        </div>

        {errorMessage && (
          <div className="p-2.5 bg-[#b42318]/15 text-[#b42318] rounded text-xs">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#24312e] mb-1">
              Mandatory Business Reason for Cancellation
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Contract superseded by PO-9941 / Client requested consolidation..."
              className="w-full p-2 text-xs rounded border border-[#c9b896] bg-white text-[#24312e] focus:outline-none focus:ring-1 focus:ring-[#b42318]"
            />
          </div>

          <label className="flex items-start gap-2.5 text-xs text-[#24312e] cursor-pointer pt-1">
            <input
              type="checkbox"
              required
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 accent-[#b42318] rounded"
            />
            <span>
              I confirm that I have verified this action and understand that this issued financial document will be permanently voided.
            </span>
          </label>

          <div className="pt-3 border-t border-[#c9b896]/40 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-[#24312e]/70 hover:text-[#24312e]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#b42318] hover:bg-[#911c13] text-white text-xs font-semibold rounded shadow-xs transition-colors cursor-pointer"
            >
              Confirm and Void Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
