import React, { useState } from 'react';
import { Invoice, PaymentRecord } from '../../types';
import { formatCurrency, round2 } from '../../utils/calculations';
import { DollarSign, AlertCircle, Info } from 'lucide-react';

interface PaymentModalProps {
  invoice: Invoice;
  onClose: () => void;
  onPaymentRecorded: () => void;
  recordPayment: (
    invoiceId: string,
    amount: number,
    method: PaymentRecord['paymentMethod'],
    reference: string,
    notes?: string
  ) => { success: boolean; error?: string };
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  invoice,
  onClose,
  onPaymentRecorded,
  recordPayment,
}) => {
  const [amount, setAmount] = useState<string>(invoice.balanceDue.toFixed(2));
  const [method, setMethod] = useState<PaymentRecord['paymentMethod']>('bank_transfer');
  const [reference, setReference] = useState<string>(`WIRE-${Date.now().toString().slice(-6)}`);
  const [notes, setNotes] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const parsedAmount = round2(parseFloat(amount) || 0);

    if (parsedAmount <= 0) {
      setErrorMessage('Payment amount must be greater than zero.');
      return;
    }

    if (parsedAmount > invoice.balanceDue + 0.001) {
      setErrorMessage(
        `Payment amount cannot exceed outstanding balance (${formatCurrency(
          invoice.balanceDue,
          invoice.currency
        )}).`
      );
      return;
    }

    const res = recordPayment(invoice.id, parsedAmount, method, reference, notes);
    if (res.success) {
      onPaymentRecorded();
    } else {
      setErrorMessage(res.error || 'Failed to record payment.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#fffdf9] border border-[#c9b896] rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4 my-auto">
        <div className="flex items-center justify-between pb-3 border-b border-[#c9b896]/60">
          <div>
            <h3 className="text-base font-bold text-[#24312e]">Record Payment</h3>
            <p className="text-xs text-[#24312e]/70">
              Apply a manual payment remittance to invoice <strong>{invoice.invoiceNumber}</strong>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-[#24312e]/50 hover:text-[#24312e] text-lg font-bold"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {errorMessage && (
          <div className="p-2.5 bg-[#b42318]/10 border border-[#b42318]/30 rounded text-xs text-[#b42318] flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Balance status pill */}
        <div className="p-3 bg-[#f5f0e6] rounded-lg border border-[#c9b896]/60 flex items-center justify-between text-xs">
          <div>
            <span className="text-[#24312e]/70">Outstanding Balance:</span>
            <div className="font-mono text-base font-bold text-[#24312e]">
              {formatCurrency(invoice.balanceDue, invoice.currency)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAmount(invoice.balanceDue.toFixed(2))}
            className="px-2.5 py-1.5 min-h-[36px] text-[11px] bg-white border border-[#c9b896] hover:bg-[#e8dcc8] rounded text-[#006b5b] font-semibold"
          >
            Pay Full Balance
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-[#24312e] mb-1">
              Payment Amount ({invoice.currency})
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-xs font-mono text-[#24312e]/60">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={invoice.balanceDue}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-7 pr-3 py-2 min-h-[44px] text-xs font-mono font-bold rounded border border-[#c9b896] bg-white text-[#24312e]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#24312e] mb-1">
              Payment Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
              className="w-full px-2.5 py-2 min-h-[44px] text-xs rounded border border-[#c9b896] bg-white text-[#24312e]"
            >
              <option value="bank_transfer">Bank Wire / Wire Remittance</option>
              <option value="ach">ACH Electronic Transfer</option>
              <option value="credit_card">Corporate Card</option>
              <option value="check">Company Check</option>
              <option value="other">Other External Clearing</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#24312e] mb-1">
              Payment Reference / Transaction ID
            </label>
            <input
              type="text"
              required
              placeholder="e.g. WIRE-908124 or Check #1042"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-2.5 py-2 min-h-[44px] text-xs font-mono rounded border border-[#c9b896] bg-white text-[#24312e]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#24312e] mb-1">
              Internal Ledger Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Received via SVB wire desk"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-2.5 py-2 min-h-[44px] text-xs rounded border border-[#c9b896] bg-white text-[#24312e]"
            />
          </div>

          <div className="pt-3 border-t border-[#c9b896]/40 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 min-h-[44px] text-xs text-[#24312e]/70 hover:text-[#24312e]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 min-h-[44px] bg-[#008371] hover:bg-[#006b5b] text-white text-xs font-semibold rounded shadow-xs transition-colors"
            >
              Confirm & Post Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
