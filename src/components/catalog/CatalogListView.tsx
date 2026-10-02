import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { CatalogItem } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import { Package, Plus, Edit2, Trash2, ShieldCheck, Tag } from 'lucide-react';

interface CatalogListViewProps {
  onOpenCreateInvoice?: () => void;
}

export const CatalogListView: React.FC<CatalogListViewProps> = ({ onOpenCreateInvoice }) => {
  const {
    catalog,
    currentWorkspace,
    addCatalogItem,
    updateCatalogItem,
    deleteCatalogItem,
    canCreateInvoice,
  } = useWorkspace();

  const [modalOpen, setModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<CatalogItem | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unit, setUnit] = useState<CatalogItem['unit']>('hour');
  const [defaultRate, setDefaultRate] = useState('150.00');
  const [defaultTaxRate, setDefaultTaxRate] = useState(
    currentWorkspace.defaultTaxRate ? currentWorkspace.defaultTaxRate.toString() : '8.5'
  );
  const [errorMessage, setErrorMessage] = useState('');

  const handleOpenAdd = () => {
    setItemToEdit(null);
    setName('');
    setDescription('');
    setUnit('hour');
    setDefaultRate('150.00');
    setDefaultTaxRate(currentWorkspace.defaultTaxRate?.toString() || '8.5');
    setErrorMessage('');
    setModalOpen(true);
  };

  const handleOpenEdit = (item: CatalogItem) => {
    setItemToEdit(item);
    setName(item.name);
    setDescription(item.description);
    setUnit(item.unit);
    setDefaultRate(item.defaultRate.toString());
    setDefaultTaxRate(item.defaultTaxRate.toString());
    setErrorMessage('');
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Item name is required.');
      return;
    }

    const rate = Math.max(0, parseFloat(defaultRate) || 0);
    const tax = Math.max(0, parseFloat(defaultTaxRate) || 0);

    if (itemToEdit) {
      updateCatalogItem(itemToEdit.id, {
        name: name.trim(),
        description: description.trim(),
        unit,
        defaultRate: rate,
        defaultTaxRate: tax,
      });
    } else {
      addCatalogItem({
        name: name.trim(),
        description: description.trim(),
        unit,
        defaultRate: rate,
        defaultTaxRate: tax,
      });
    }

    setModalOpen(false);
  };

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#c9b896]/60">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#24312e]">
            Items & Services Catalog
          </h1>
          <p className="text-xs md:text-sm text-[#24312e]/70 mt-0.5 sm:mt-1">
            Maintain standard billing rates and deliverables. Modifying items does not overwrite historical invoice line snapshots.
          </p>
        </div>

        {canCreateInvoice && (
          <button
            onClick={handleOpenAdd}
            className="w-full sm:w-auto px-4 py-2 min-h-[40px] bg-[#008371] hover:bg-[#006b5b] text-white text-xs font-semibold rounded-md shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Item / Service</span>
          </button>
        )}
      </div>

      {/* Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {catalog.map((item) => (
          <div
            key={item.id}
            className="p-4 sm:p-5 bg-[#fffdf9] border border-[#c9b896] rounded-lg shadow-xs flex flex-col justify-between hover:border-[#008371] transition-all"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-bold text-[#24312e]">{item.name}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[#e8dcc8] text-[#24312e] rounded uppercase font-semibold">
                  per {item.unit}
                </span>
              </div>

              <p className="text-xs text-[#24312e]/70 leading-relaxed line-clamp-2">
                {item.description}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-[#c9b896]/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#24312e]/60 block">Default Rate</span>
                <span className="font-mono text-base font-bold text-[#008371] tabular-nums">
                  {formatCurrency(item.defaultRate, currentWorkspace.currency)}
                </span>
                <span className="text-[10px] text-[#24312e]/60 ml-1">
                  ({item.defaultTaxRate}% tax)
                </span>
              </div>

              <div className="flex items-center gap-1">
                {canCreateInvoice && (
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center p-1.5 text-[#24312e]/70 hover:text-[#008371] hover:bg-[#f5f0e6] rounded transition-colors"
                    title="Edit Item"
                    aria-label="Edit Item"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
                {canCreateInvoice && (
                  <button
                    onClick={() => {
                      if (confirm(`Remove "${item.name}" from catalog?`)) {
                        deleteCatalogItem(item.id);
                      }
                    }}
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center p-1.5 text-[#24312e]/70 hover:text-[#b42318] hover:bg-[#b42318]/10 rounded transition-colors"
                    title="Delete Item"
                    aria-label="Delete Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#fffdf9] border border-[#c9b896] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#c9b896]/60">
              <h3 className="text-base font-bold text-[#24312e]">
                {itemToEdit ? 'Edit Catalog Service' : 'Add Item to Catalog'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#24312e]/50 hover:text-[#24312e]"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-[#b42318]/10 border border-[#b42318]/30 rounded text-xs text-[#b42318]">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#24312e] mb-1">
                  Item / Service Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior DevOps Consultation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-[#c9b896] bg-white text-[#24312e]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#24312e] mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Service deliverables, specifications..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 rounded border border-[#c9b896] bg-white text-[#24312e]"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-[#24312e] mb-1">
                    Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full px-2 py-1.5 rounded border border-[#c9b896] bg-white text-[#24312e]"
                  >
                    <option value="hour">Hour</option>
                    <option value="day">Day</option>
                    <option value="month">Month</option>
                    <option value="service">Service</option>
                    <option value="item">Item</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#24312e] mb-1">
                    Default Rate ({currentWorkspace.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={defaultRate}
                    onChange={(e) => setDefaultRate(e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-[#c9b896] bg-white text-[#24312e] font-mono text-right"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#24312e] mb-1">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={defaultTaxRate}
                    onChange={(e) => setDefaultTaxRate(e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-[#c9b896] bg-white text-[#24312e] font-mono text-right"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#c9b896]/40 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-[#24312e]/70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#008371] hover:bg-[#006b5b] text-white font-medium rounded shadow-xs"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
