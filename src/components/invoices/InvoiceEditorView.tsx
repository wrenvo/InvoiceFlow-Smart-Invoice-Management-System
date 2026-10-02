import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Invoice, InvoiceLineItem, Customer } from '../../types';
import { calculateLineItem, calculateInvoiceTotals, formatCurrency } from '../../utils/calculations';
import { Plus, Trash2, ArrowLeft, ShieldCheck, Info } from 'lucide-react';

interface InvoiceEditorViewProps {
  initialInvoice?: Invoice | null;
  onCancel: () => void;
  onSaved: (invoice: Invoice) => void;
  onIssued: (invoice: Invoice) => void;
}

export const InvoiceEditorView: React.FC<InvoiceEditorViewProps> = ({
  initialInvoice,
  onCancel,
  onSaved,
  onIssued,
}) => {
  const {
    currentWorkspace,
    customers,
    catalog,
    canIssueInvoice,
    saveInvoiceDraft,
    issueInvoice,
    addCustomer,
  } = useWorkspace();

  const isEditing = !!initialInvoice;

  // Form states
  const [customerId, setCustomerId] = useState(initialInvoice?.customerId || customers[0]?.id || '');
  const [issueDate, setIssueDate] = useState(
    initialInvoice?.issueDate || new Date().toISOString().split('T')[0]
  );
  const [dueDate, setDueDate] = useState(
    initialInvoice?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [paymentTerms, setPaymentTerms] = useState<string>(currentWorkspace.defaultPaymentTerms || 'net30');
  const [referencePo, setReferencePo] = useState(initialInvoice?.referencePo || '');
  const [currency, setCurrency] = useState(initialInvoice?.currency || currentWorkspace.currency || 'USD');
  const [notes, setNotes] = useState(
    initialInvoice?.notes || 'Thank you for your business. Please remit payment according to the stated terms.'
  );
  const [terms, setTerms] = useState(
    initialInvoice?.terms || `Payment due within 30 days. Wire details in payment instructions.`
  );

  // Line items state
  const [items, setItems] = useState<InvoiceLineItem[]>(() => {
    if (initialInvoice?.items && initialInvoice.items.length > 0) {
      return initialInvoice.items;
    }
    // Default 1 line item
    const firstCat = catalog[0];
    const initialCalc = calculateLineItem({
      quantity: 1,
      unitRate: firstCat?.defaultRate || 100,
      discountPercent: 0,
      taxPercent: firstCat?.defaultTaxRate || currentWorkspace.defaultTaxRate || 0,
    });

    return [
      {
        id: `line-${Date.now()}`,
        catalogItemId: firstCat?.id || '',
        description: firstCat ? firstCat.name : 'Professional Consulting Services',
        unit: firstCat?.unit || 'hour',
        quantity: 1,
        unitRate: firstCat?.defaultRate || 100,
        discountPercent: 0,
        taxPercent: firstCat?.defaultTaxRate || currentWorkspace.defaultTaxRate || 0,
        ...initialCalc,
      },
    ];
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [quickAddCustomerOpen, setQuickAddCustomerOpen] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');

  // Update dueDate when issueDate or paymentTerms changes
  useEffect(() => {
    if (!issueDate) return;
    try {
      const date = new Date(issueDate);
      let daysToAdd = 30;
      if (paymentTerms === 'due_on_receipt') daysToAdd = 0;
      else if (paymentTerms === 'net15') daysToAdd = 15;
      else if (paymentTerms === 'net30') daysToAdd = 30;
      else if (paymentTerms === 'net60') daysToAdd = 60;

      date.setDate(date.getDate() + daysToAdd);
      setDueDate(date.toISOString().split('T')[0]);
    } catch {
      // ignore
    }
  }, [issueDate, paymentTerms]);

  // Recalculate totals
  const totals = calculateInvoiceTotals(items);

  // Line item handlers
  const handleItemCatalogSelect = (index: number, catId: string) => {
    const catItem = catalog.find((c) => c.id === catId);
    if (!catItem) return;

    const newItems = [...items];
    const current = newItems[index];
    const calc = calculateLineItem({
      quantity: current.quantity,
      unitRate: catItem.defaultRate,
      discountPercent: current.discountPercent,
      taxPercent: catItem.defaultTaxRate,
    });

    newItems[index] = {
      ...current,
      catalogItemId: catItem.id,
      description: `${catItem.name} - ${catItem.description}`,
      unit: catItem.unit,
      unitRate: catItem.defaultRate,
      taxPercent: catItem.defaultTaxRate,
      ...calc,
    };
    setItems(newItems);
  };

  const handleLineChange = (index: number, field: keyof InvoiceLineItem, value: any) => {
    const newItems = [...items];
    const current = { ...newItems[index], [field]: value };

    // Recompute line totals
    const calc = calculateLineItem({
      quantity: Number(current.quantity) || 0,
      unitRate: Number(current.unitRate) || 0,
      discountPercent: Number(current.discountPercent) || 0,
      taxPercent: Number(current.taxPercent) || 0,
    });

    newItems[index] = {
      ...current,
      ...calc,
    };
    setItems(newItems);
  };

  const handleAddLine = () => {
    const calc = calculateLineItem({
      quantity: 1,
      unitRate: 100,
      discountPercent: 0,
      taxPercent: currentWorkspace.defaultTaxRate || 0,
    });

    setItems([
      ...items,
      {
        id: `line-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
        description: 'New service line item',
        unit: 'hour',
        quantity: 1,
        unitRate: 100,
        discountPercent: 0,
        taxPercent: currentWorkspace.defaultTaxRate || 0,
        ...calc,
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (items.length <= 1) {
      setErrorMessage('An invoice must have at least one line item.');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const handleQuickAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim() || !newCustEmail.trim()) return;

    const created = addCustomer({
      name: newCustName.trim(),
      legalName: `${newCustName.trim()} LLC`,
      email: newCustEmail.trim(),
      phone: '+1 (555) 000-0000',
      address: '100 Business Parkway, Suite 200',
      status: 'active',
    });

    setCustomerId(created.id);
    setNewCustName('');
    setNewCustEmail('');
    setQuickAddCustomerOpen(false);
  };

  // Save Draft
  const handleSaveDraft = () => {
    setErrorMessage('');
    if (!customerId) {
      setErrorMessage('Please select a customer.');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Please add at least one line item.');
      return;
    }

    try {
      const saved = saveInvoiceDraft({
        id: initialInvoice?.id,
        customerId,
        issueDate,
        dueDate,
        currency,
        referencePo,
        items,
        notes,
        terms,
      });
      onSaved(saved);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save draft.');
    }
  };

  // Preview & Issue
  const handleIssueNow = () => {
    setErrorMessage('');
    if (!customerId) {
      setErrorMessage('Please select a customer.');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('Please add at least one line item.');
      return;
    }

    try {
      // First save draft state
      const savedDraft = saveInvoiceDraft({
        id: initialInvoice?.id,
        customerId,
        issueDate,
        dueDate,
        currency,
        referencePo,
        items,
        notes,
        terms,
      });

      // Then allocate sequence & issue
      const result = issueInvoice(savedDraft.id);
      if (result.success && result.invoice) {
        onIssued(result.invoice);
      } else {
        setErrorMessage(result.error || 'Failed to issue invoice.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to issue invoice.');
    }
  };

  const selectedCustomer = customers.find((c) => c.id === customerId);

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-4 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#c9b896]/60">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded-md hover:bg-[#e8dcc8]/60 text-[#24312e] transition-colors"
            title="Back"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-[#24312e]">
              {isEditing ? `Edit Draft ${initialInvoice?.invoiceNumber}` : 'Create Invoice Draft'}
            </h1>
            <p className="text-[11px] sm:text-xs text-[#24312e]/70 mt-0.5">
              Drafts can be adjusted freely. Issuing will lock line snapshots and assign an immutable sequential number.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
          <button
            onClick={onCancel}
            className="flex-1 sm:flex-initial px-3 py-2 min-h-[40px] text-xs font-medium border border-[#c9b896] hover:bg-[#e8dcc8]/50 rounded text-[#24312e] transition-colors text-center"
          >
            Discard
          </button>
          <button
            onClick={handleSaveDraft}
            className="flex-1 sm:flex-initial px-4 py-2 min-h-[40px] bg-[#fffdf9] hover:bg-[#e8dcc8] border border-[#008371] text-[#008371] text-xs font-semibold rounded shadow-xs transition-colors text-center"
          >
            Save Draft
          </button>
          {canIssueInvoice ? (
            <button
              onClick={handleIssueNow}
              className="w-full sm:w-auto px-4 py-2 min-h-[40px] bg-[#008371] hover:bg-[#006b5b] text-white text-xs font-semibold rounded shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Issue Invoice</span>
            </button>
          ) : (
            <div className="text-[11px] text-[#24312e]/60 italic w-full text-center sm:w-auto">
              (Role: Preparer · Save draft for review)
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-[#b42318]/10 border border-[#b42318]/30 rounded-md text-xs text-[#b42318] flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form Body */}
      <div className="bg-[#fffdf9] border border-[#c9b896] rounded-lg shadow-xs p-4 sm:p-6 space-y-6">
        {/* Customer & Billing Dates Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 pb-6 border-b border-[#c9b896]/40">
          {/* Customer Selection */}
          <div className="md:col-span-5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#24312e] uppercase tracking-wider">
                Bill To (Customer)
              </label>
              <button
                type="button"
                onClick={() => setQuickAddCustomerOpen(!quickAddCustomerOpen)}
                className="text-xs text-[#006b5b] hover:underline font-medium min-h-[30px] flex items-center"
              >
                + Quick add client
              </button>
            </div>

            {quickAddCustomerOpen ? (
              <form onSubmit={handleQuickAddCustomer} className="p-3 bg-[#f5f0e6] rounded border border-[#c9b896] space-y-2">
                <input
                  type="text"
                  required
                  placeholder="Customer business name"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-2.5 py-2 min-h-[40px] text-xs rounded border border-[#c9b896] bg-white text-[#24312e]"
                />
                <input
                  type="email"
                  required
                  placeholder="Billing email address"
                  value={newCustEmail}
                  onChange={(e) => setNewCustEmail(e.target.value)}
                  className="w-full px-2.5 py-2 min-h-[40px] text-xs rounded border border-[#c9b896] bg-white text-[#24312e]"
                />
                <div className="flex justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setQuickAddCustomerOpen(false)}
                    className="px-2.5 py-1.5 text-xs text-[#24312e]/70 min-h-[36px]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#008371] text-white text-xs rounded font-medium min-h-[36px]"
                  >
                    Save & Select
                  </button>
                </div>
              </form>
            ) : (
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[44px] text-xs rounded border border-[#c9b896] bg-white text-[#24312e] focus:outline-none focus:ring-1 focus:ring-[#008371]"
              >
                <option value="">Select a customer...</option>
                {customers
                  .filter((c) => c.status === 'active' || c.id === customerId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.email})
                    </option>
                  ))}
              </select>
            )}

            {selectedCustomer && (
              <div className="p-2.5 bg-[#f5f0e6]/60 rounded border border-[#c9b896]/40 text-xs text-[#24312e]/80 space-y-0.5">
                <div className="font-semibold text-[#24312e]">{selectedCustomer.legalName}</div>
                <div>{selectedCustomer.address}</div>
                <div>Email: {selectedCustomer.email}</div>
                {selectedCustomer.taxId && <div>Tax ID: {selectedCustomer.taxId}</div>}
              </div>
            )}
          </div>

          {/* Dates & Reference */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#24312e] mb-1">
                Issue Date
              </label>
              <input
                type="date"
                required
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-2.5 py-2 min-h-[40px] text-xs font-mono rounded border border-[#c9b896] bg-white text-[#24312e]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#24312e] mb-1">
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-2.5 py-2 min-h-[40px] text-xs rounded border border-[#c9b896] bg-white text-[#24312e]"
              >
                <option value="due_on_receipt">Due on Receipt</option>
                <option value="net15">Net 15 Days</option>
                <option value="net30">Net 30 Days</option>
                <option value="net60">Net 60 Days</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#24312e] mb-1">
                Due Date
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-2 min-h-[40px] text-xs font-mono rounded border border-[#c9b896] bg-white text-[#24312e]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#24312e] mb-1">
                PO / Client Reference
              </label>
              <input
                type="text"
                placeholder="e.g. PO-2026-904"
                value={referencePo}
                onChange={(e) => setReferencePo(e.target.value)}
                className="w-full px-2.5 py-2 min-h-[40px] text-xs font-mono rounded border border-[#c9b896] bg-white text-[#24312e]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#24312e] mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-2.5 py-2 min-h-[40px] text-xs font-mono rounded border border-[#c9b896] bg-white text-[#24312e]"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#24312e] mb-1">
                Workspace Prefix
              </label>
              <div className="px-2.5 py-2 min-h-[40px] text-xs font-mono rounded border border-[#c9b896]/60 bg-[#f5f0e6]/60 text-[#24312e]/70 flex items-center">
                {currentWorkspace.invoicePrefix}XXXX
              </div>
            </div>
          </div>
        </div>

        {/* Line Items Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#24312e]">
              Invoice Line Items ({items.length})
            </h2>
            <button
              type="button"
              onClick={handleAddLine}
              className="text-xs text-[#006b5b] hover:underline font-semibold flex items-center gap-1 min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Line</span>
            </button>
          </div>

          {/* Mobile Line Item Cards (for screen < md) */}
          <div className="space-y-3 md:hidden">
            {items.map((line, idx) => (
              <div key={line.id} className="p-3.5 bg-[#f5f0e6]/50 rounded-lg border border-[#c9b896] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#006b5b] font-mono">
                    Item #{idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={line.catalogItemId || ''}
                      onChange={(e) => handleItemCatalogSelect(idx, e.target.value)}
                      className="px-2 py-1 text-xs rounded border border-[#c9b896] bg-white text-[#24312e] max-w-[170px]"
                    >
                      <option value="">Catalog Item...</option>
                      {catalog.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="min-h-[36px] min-w-[36px] flex items-center justify-center p-1.5 text-[#b42318] hover:bg-[#b42318]/10 rounded"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#24312e]/70 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    required
                    value={line.description}
                    onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                    placeholder="Item description"
                    className="w-full px-2.5 py-2 min-h-[40px] text-xs rounded border border-[#c9b896] bg-white text-[#24312e]"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <label className="block text-[10px] text-[#24312e]/60 mb-0.5">Quantity</label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={line.quantity}
                      onChange={(e) => handleLineChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 min-h-[38px] text-xs text-right font-mono rounded border border-[#c9b896] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#24312e]/60 mb-0.5">Unit</label>
                    <input
                      type="text"
                      value={line.unit}
                      onChange={(e) => handleLineChange(idx, 'unit', e.target.value)}
                      className="w-full px-2 py-1.5 min-h-[38px] text-xs text-center font-mono rounded border border-[#c9b896] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#24312e]/60 mb-0.5">Rate ($)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.unitRate}
                      onChange={(e) => handleLineChange(idx, 'unitRate', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 min-h-[38px] text-xs text-right font-mono rounded border border-[#c9b896] bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-[#24312e]/60 mb-0.5">Tax (%)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={line.taxPercent}
                      onChange={(e) => handleLineChange(idx, 'taxPercent', parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 min-h-[38px] text-xs text-right font-mono rounded border border-[#c9b896] bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#c9b896]/30 text-xs">
                  <span className="text-[#24312e]/70">Line Total:</span>
                  <span className="font-mono font-bold text-sm text-[#008371]">
                    {formatCurrency(line.lineTotal, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Line Items Table (hidden on mobile) */}
          <div className="hidden md:block overflow-x-auto border border-[#c9b896] rounded-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f5f0e6]/60 border-b border-[#c9b896]/50 text-[#24312e]/70 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 min-w-[220px]">Description & Item Catalog</th>
                  <th className="py-2.5 px-3 w-20">Unit</th>
                  <th className="py-2.5 px-3 w-20 text-right">Qty</th>
                  <th className="py-2.5 px-3 w-28 text-right">Unit Rate</th>
                  <th className="py-2.5 px-3 w-20 text-right">Disc %</th>
                  <th className="py-2.5 px-3 w-20 text-right">Tax %</th>
                  <th className="py-2.5 px-3 w-28 text-right">Line Total</th>
                  <th className="py-2.5 px-2 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c9b896]/30">
                {items.map((line, idx) => (
                  <tr key={line.id} className="hover:bg-[#f5f0e6]/30">
                    {/* Description & Catalog selector */}
                    <td className="py-2 px-3 space-y-1">
                      <div className="flex gap-1.5">
                        <select
                          value={line.catalogItemId || ''}
                          onChange={(e) => handleItemCatalogSelect(idx, e.target.value)}
                          className="px-1.5 py-1 text-[11px] rounded border border-[#c9b896] bg-white text-[#24312e] shrink-0"
                        >
                          <option value="">Catalog Item...</option>
                          {catalog.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} (${c.defaultRate}/{c.unit})
                            </option>
                          ))}
                        </select>
                      </div>
                      <input
                        type="text"
                        required
                        value={line.description}
                        onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                        placeholder="Item or service description"
                        className="w-full px-2 py-1 text-xs rounded border border-[#c9b896] bg-white text-[#24312e]"
                      />
                    </td>

                    {/* Unit */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={line.unit}
                        onChange={(e) => handleLineChange(idx, 'unit', e.target.value)}
                        className="w-full px-1.5 py-1 text-xs text-center rounded border border-[#c9b896] bg-white font-mono"
                      />
                    </td>

                    {/* Qty */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={line.quantity}
                        onChange={(e) => handleLineChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-1.5 py-1 text-xs text-right font-mono rounded border border-[#c9b896] bg-white tabular-nums"
                      />
                    </td>

                    {/* Rate */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.unitRate}
                        onChange={(e) => handleLineChange(idx, 'unitRate', parseFloat(e.target.value) || 0)}
                        className="w-full px-1.5 py-1 text-xs text-right font-mono rounded border border-[#c9b896] bg-white tabular-nums"
                      />
                    </td>

                    {/* Discount % */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={line.discountPercent}
                        onChange={(e) => handleLineChange(idx, 'discountPercent', parseFloat(e.target.value) || 0)}
                        className="w-full px-1.5 py-1 text-xs text-right font-mono rounded border border-[#c9b896] bg-white tabular-nums"
                      />
                    </td>

                    {/* Tax % */}
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={line.taxPercent}
                        onChange={(e) => handleLineChange(idx, 'taxPercent', parseFloat(e.target.value) || 0)}
                        className="w-full px-1.5 py-1 text-xs text-right font-mono rounded border border-[#c9b896] bg-white tabular-nums"
                      />
                    </td>

                    {/* Calculated Line Total */}
                    <td className="py-2 px-3 text-right font-mono font-bold text-[#24312e] tabular-nums">
                      {formatCurrency(line.lineTotal, currency)}
                    </td>

                    {/* Remove */}
                    <td className="py-2 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        className="p-1 text-[#24312e]/40 hover:text-[#b42318] transition-colors"
                        title="Remove row"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Calculation Summary & Notes */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4 border-t border-[#c9b896]/40">
          {/* Notes and Terms */}
          <div className="md:col-span-7 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[#24312e] mb-1">
                Client Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes visible to client..."
                className="w-full p-2 text-xs rounded border border-[#c9b896] bg-white text-[#24312e]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#24312e] mb-1">
                Payment Terms & Remittance Info
              </label>
              <textarea
                rows={2}
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                placeholder="Payment instructions..."
                className="w-full p-2 text-xs rounded border border-[#c9b896] bg-white text-[#24312e]"
              />
            </div>
          </div>

          {/* Totals Summary */}
          <div className="md:col-span-5 bg-[#f5f0e6]/60 p-4 rounded-lg border border-[#c9b896] space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-[#24312e] pb-1 border-b border-[#c9b896]/50">
              Calculation Breakdown
            </div>

            <div className="flex justify-between text-xs text-[#24312e]/80">
              <span>Gross Subtotal</span>
              <span className="font-mono tabular-nums font-medium">
                {formatCurrency(totals.subtotal, currency)}
              </span>
            </div>

            {totals.totalDiscount > 0 && (
              <div className="flex justify-between text-xs text-[#b42318]">
                <span>Applied Discounts</span>
                <span className="font-mono tabular-nums">
                  -{formatCurrency(totals.totalDiscount, currency)}
                </span>
              </div>
            )}

            <div className="flex justify-between text-xs text-[#24312e]/80">
              <span>Calculated Tax</span>
              <span className="font-mono tabular-nums font-medium">
                {formatCurrency(totals.totalTax, currency)}
              </span>
            </div>

            <div className="pt-2 border-t border-[#c9b896] flex justify-between items-baseline text-sm font-bold text-[#24312e]">
              <span>Grand Total</span>
              <span className="font-mono text-lg text-[#008371] tabular-nums">
                {formatCurrency(totals.grandTotal, currency)}
              </span>
            </div>

            <div className="text-[10px] text-[#24312e]/60 pt-1 border-t border-[#c9b896]/30">
              Decimal-safe calculations guarantee reconciliation between UI, stored snapshot, and PDF invoice.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
