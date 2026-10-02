import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { AuditEvent } from '../../types';
import { History, Shield, Filter, Search, Clock, User, ArrowDownRight } from 'lucide-react';

export const AuditActivityView: React.FC = () => {
  const { currentWorkspace, auditEvents } = useWorkspace();

  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = auditEvents.filter((evt) => {
    if (filterType !== 'all' && evt.targetType !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        evt.action.toLowerCase().includes(q) ||
        evt.summary.toLowerCase().includes(q) ||
        evt.actorName.toLowerCase().includes(q) ||
        (evt.details && evt.details.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-[#c9b896]/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#24312e]">
              Workspace Audit Activity
            </h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#008371]/15 text-[#008371] font-bold">
              Append-Only
            </span>
          </div>
          <p className="text-xs md:text-sm text-[#24312e]/70 mt-0.5 sm:mt-1">
            Tamper-evident trail for 100% of issue, void, payment remittance, role, and security actions.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#fffdf9] p-3 border border-[#c9b896] rounded-lg shadow-xs">
        <div className="flex items-center gap-1 p-1 bg-[#f5f0e6] rounded border border-[#c9b896]/50 overflow-x-auto whitespace-nowrap">
          {[
            { id: 'all', label: 'All Events' },
            { id: 'invoice', label: 'Invoices' },
            { id: 'payment', label: 'Payments' },
            { id: 'member', label: 'Team / Roles' },
            { id: 'settings', label: 'Configuration' },
            { id: 'security', label: 'Security & Sessions' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 min-h-[36px] text-xs font-medium rounded transition-colors shrink-0 ${
                filterType === tab.id
                  ? 'bg-[#008371] text-white font-semibold shadow-xs'
                  : 'text-[#24312e]/80 hover:text-[#24312e]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:w-64 max-w-full sm:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#24312e]/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, actor, details..."
            className="w-full pl-8 pr-3 py-2 min-h-[40px] text-xs rounded border border-[#c9b896] bg-white text-[#24312e]"
          />
        </div>
      </div>

      {/* Events List */}
      <div className="bg-[#fffdf9] border border-[#c9b896] rounded-lg shadow-xs divide-y divide-[#c9b896]/30 overflow-hidden">
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#24312e]/60">
            <History className="w-8 h-8 mx-auto text-[#c9b896] mb-2" />
            <p className="font-semibold text-sm">No audit records match your filter.</p>
          </div>
        ) : (
          filteredEvents.map((evt) => (
            <div key={evt.id} className="p-4 hover:bg-[#f5f0e6]/40 transition-colors space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#006b5b] bg-[#e8dcc8]/60 px-2 py-0.5 rounded">
                    {evt.action}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 bg-neutral-100 text-neutral-600 rounded">
                    Target: {evt.targetType}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#24312e]/60 font-mono">
                  <Clock className="w-3 h-3 text-[#24312e]/50" />
                  <span>{new Date(evt.timestamp).toUTCString()}</span>
                </div>
              </div>

              <div className="text-xs font-semibold text-[#24312e]">
                {evt.summary}
              </div>

              {evt.details && (
                <div className="text-[11px] text-[#24312e]/70 italic bg-[#f5f0e6]/60 p-2 rounded border border-[#c9b896]/30 font-mono">
                  {evt.details}
                </div>
              )}

              <div className="flex items-center gap-2 text-[11px] text-[#24312e]/60 pt-1">
                <User className="w-3 h-3 text-[#008371]" />
                <span>
                  Actor: <strong className="text-[#24312e]">{evt.actorName}</strong> (Role: <span className="uppercase font-mono">{evt.actorRole}</span> · ID: <span className="font-mono">{evt.actorId}</span>)
                </span>
                <span>·</span>
                <span className="font-mono text-[10px]">Record ID: {evt.id}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
