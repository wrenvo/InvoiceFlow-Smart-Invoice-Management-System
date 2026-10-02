import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { WorkspaceRole, User } from '../../types';
import {
  Building2,
  Users,
  Sliders,
  Shield,
  Plus,
  Check,
  AlertCircle,
  KeyRound,
  ArrowRightLeft,
  Mail,
  UserX,
  UserCheck,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    currentWorkspace,
    currentUser,
    users,
    canManageSettings,
    canManageMembers,
    canTransferOwnership,
    updateWorkspaceSettings,
    inviteMember,
    updateMemberRole,
    toggleMemberStatus,
    transferOwnership,
    invitations,
  } = useWorkspace();

  const [activeSection, setActiveSection] = useState<'company' | 'invoicing' | 'team' | 'roles'>('company');

  // Company Form State
  const [legalName, setLegalName] = useState(currentWorkspace.legalName);
  const [taxId, setTaxId] = useState(currentWorkspace.taxId);
  const [email, setEmail] = useState(currentWorkspace.email);
  const [phone, setPhone] = useState(currentWorkspace.phone);
  const [address, setAddress] = useState(currentWorkspace.address);
  const [currency, setCurrency] = useState(currentWorkspace.currency);

  // Invoicing Defaults State
  const [invoicePrefix, setInvoicePrefix] = useState(currentWorkspace.invoicePrefix);
  const [nextSequenceNumber, setNextSequenceNumber] = useState(currentWorkspace.nextSequenceNumber.toString());
  const [defaultPaymentTerms, setDefaultPaymentTerms] = useState(currentWorkspace.defaultPaymentTerms);
  const [defaultTaxRate, setDefaultTaxRate] = useState(currentWorkspace.defaultTaxRate.toString());
  const [paymentInstructions, setPaymentInstructions] = useState(currentWorkspace.paymentInstructions);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Team Invite State
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<WorkspaceRole>('finance');

  // Ownership Transfer State
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [newOwnerId, setNewOwnerId] = useState('');

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSettings) return;

    updateWorkspaceSettings({
      legalName,
      taxId,
      email,
      phone,
      address,
      currency,
    });
    setFeedback({ type: 'success', message: 'Company profile updated successfully.' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSaveInvoicing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSettings) return;

    updateWorkspaceSettings({
      invoicePrefix,
      nextSequenceNumber: parseInt(nextSequenceNumber, 10) || 100,
      defaultPaymentTerms: defaultPaymentTerms as any,
      defaultTaxRate: parseFloat(defaultTaxRate) || 0,
      paymentInstructions,
    });
    setFeedback({ type: 'success', message: 'Invoicing defaults saved. Next issued invoices will reflect these defaults.' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = inviteMember(inviteEmail, inviteRole);
    if (res.success) {
      setFeedback({ type: 'success', message: `Invitation sent to ${inviteEmail}. Token: ${res.invitation?.token}` });
      setInviteModalOpen(false);
      setInviteEmail('');
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to send invite.' });
    }
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwnerId) return;

    const res = transferOwnership(newOwnerId);
    if (res.success) {
      setFeedback({ type: 'success', message: 'Workspace ownership transferred successfully.' });
      setTransferModalOpen(false);
    } else {
      setFeedback({ type: 'error', message: res.error || 'Failed to transfer ownership.' });
    }
  };

  return (
    <div className="p-3 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3 border-b border-[#c9b896]/60">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#24312e]">
            Workspace Settings & Administration
          </h1>
          <p className="text-xs md:text-sm text-[#24312e]/70 mt-0.5 sm:mt-1">
            Configure business identity, sequential numbering rules, team permissions, and security.
          </p>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-[#008371]/10 border border-[#008371]/30 text-[#006b5b]'
              : 'bg-[#b42318]/10 border border-[#b42318]/30 text-[#b42318]'
          }`}
        >
          {feedback.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tabs (Horizontally scrollable on mobile) */}
      <div className="flex items-center gap-1 border-b border-[#c9b896]/60 text-xs font-semibold overflow-x-auto whitespace-nowrap pb-0.5">
        <button
          onClick={() => setActiveSection('company')}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
            activeSection === 'company'
              ? 'border-[#008371] text-[#008371]'
              : 'border-transparent text-[#24312e]/70 hover:text-[#24312e]'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Company Profile</span>
        </button>

        <button
          onClick={() => setActiveSection('invoicing')}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
            activeSection === 'invoicing'
              ? 'border-[#008371] text-[#008371]'
              : 'border-transparent text-[#24312e]/70 hover:text-[#24312e]'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Invoicing & Numbering</span>
        </button>

        <button
          onClick={() => setActiveSection('team')}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
            activeSection === 'team'
              ? 'border-[#008371] text-[#008371]'
              : 'border-transparent text-[#24312e]/70 hover:text-[#24312e]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team Members ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSection('roles')}
          className={`pb-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 shrink-0 ${
            activeSection === 'roles'
              ? 'border-[#008371] text-[#008371]'
              : 'border-transparent text-[#24312e]/70 hover:text-[#24312e]'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Role Permissions Matrix</span>
        </button>
      </div>

      {/* SECTION 1: COMPANY PROFILE */}
      {activeSection === 'company' && (
        <form onSubmit={handleSaveCompany} className="bg-[#fffdf9] p-6 border border-[#c9b896] rounded-lg shadow-xs space-y-4 text-xs">
          <div className="pb-2 border-b border-[#c9b896]/40">
            <h3 className="text-sm font-bold text-[#24312e]">Legal Commercial Identity</h3>
            <p className="text-[11px] text-[#24312e]/70">
              Information populated into issued financial invoice headers and recipient snapshots.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#24312e] mb-1">
                Legal Registered Entity Name
              </label>
              <input
                type="text"
                disabled={!canManageSettings}
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-[#c9b896] bg-white text-[#24312e] disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#24312e] mb-1">
                Tax Registration / EIN / VAT ID
              </label>
              <input
                type="text"
                disabled={!canManageSettings}
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-[#c9b896] bg-white font-mono text-[#24312e] disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#24312e] mb-1">
                Billing Inquiries Email
              </label>
              <input
                type="email"
                disabled={!canManageSettings}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-[#c9b896] bg-white text-[#24312e] disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#24312e] mb-1">
                Direct Contact Phone
              </label>
              <input
                type="text"
                disabled={!canManageSettings}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-[#c9b896] bg-white text-[#24312e] disabled:opacity-60"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#24312e] mb-1">
                Primary Physical & Tax Address
              </label>
              <input
                type="text"
                disabled={!canManageSettings}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-[#c9b896] bg-white text-[#24312e] disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#24312e] mb-1">
                Primary Ledger Currency
              </label>
              <select
                disabled={!canManageSettings}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-[#c9b896] bg-white text-[#24312e] font-mono disabled:opacity-60"
              >
                <option value="USD">USD - United States Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="GBP">GBP - British Pound (£)</option>
                <option value="CAD">CAD - Canadian Dollar ($)</option>
                <option value="AUD">AUD - Australian Dollar ($)</option>
              </select>
            </div>
          </div>

          {canManageSettings && (
            <div className="pt-3 border-t border-[#c9b896]/40 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-[#008371] hover:bg-[#006b5b] text-white font-semibold rounded shadow-xs cursor-pointer"
              >
                Save Company Profile
              </button>
            </div>
          )}
        </form>
      )}

      {/* SECTION 2: INVOICING DEFAULTS */}
      {activeSection === 'invoicing' && (
        <form onSubmit={handleSaveInvoicing} className="bg-[#fffdf9] p-6 border border-[#c9b896] rounded-lg shadow-xs space-y-4 text-xs">
          <div className="pb-2 border-b border-[#c9b896]/40">
            <h3 className="text-sm font-bold text-[#24312e]">Invoice Sequence & Remittance Rules</h3>
            <p className="text-[11px] text-[#24312e]/70">
              PRD INV-03: Invoice numbers are unique per workspace, allocated atomically at issue, and never reused.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-[#24312e] mb-1">
                Sequential Number Prefix
              </label>
              <input
                type="text"
                disabled={!canManageSettings}
                value={invoicePrefix}
                onChange={(e) => setInvoicePrefix(e.target.value)}
                placeholder="INV-2026-"
                className="w-full px-3 py-1.5 rounded border border-[#c9b896] bg-white font-mono text-[#24312e] disabled:opacity-60"
              />
              <span className="text-[10px] text-[#24312e]/60 mt-0.5 block">
                Next invoice issued will be: <strong className="font-mono text-[#006b5b]">{invoicePrefix}{nextSequenceNumber}</strong>
              </span>
            </div>

            <div>
              <label className="block font-semibold text-[#24312e] mb-1">
                Next Atomic Sequence Counter
              </label>
              <input
                type="number"
                disabled={!canManageSettings}
                value={nextSequenceNumber}
                onChange={(e) => setNextSequenceNumber(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-[#c9b896] bg-white font-mono text-[#24312e] disabled:opacity-60"
              />
              <span className="text-[10px] text-[#24312e]/60 mt-0.5 block">
                Never decreases automatically. Numbers cannot be reused after void.
              </span>
            </div>

            <div>
              <label className="block font-semibold text-[#24312e] mb-1">
                Default Payment Terms
              </label>
              <select
                disabled={!canManageSettings}
                value={defaultPaymentTerms}
                onChange={(e) => setDefaultPaymentTerms(e.target.value as any)}
                className="w-full px-3 py-1.5 rounded border border-[#c9b896] bg-white text-[#24312e] disabled:opacity-60"
              >
                <option value="due_on_receipt">Due on Receipt</option>
                <option value="net15">Net 15 Days</option>
                <option value="net30">Net 30 Days</option>
                <option value="net60">Net 60 Days</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#24312e] mb-1">
                Default Standard Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                disabled={!canManageSettings}
                value={defaultTaxRate}
                onChange={(e) => setDefaultTaxRate(e.target.value)}
                className="w-full px-3 py-1.5 rounded border border-[#c9b896] bg-white font-mono text-[#24312e] disabled:opacity-60"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-[#24312e] mb-1">
                Default Payment Instructions & Wire Remittance Details
              </label>
              <textarea
                rows={3}
                disabled={!canManageSettings}
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                placeholder="Bank Name, Routing Number, Account Number, SWIFT..."
                className="w-full p-2.5 rounded border border-[#c9b896] bg-white font-mono text-[#24312e] text-xs disabled:opacity-60"
              />
            </div>
          </div>

          {canManageSettings && (
            <div className="pt-3 border-t border-[#c9b896]/40 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-[#008371] hover:bg-[#006b5b] text-white font-semibold rounded shadow-xs cursor-pointer"
              >
                Save Invoicing Configuration
              </button>
            </div>
          )}
        </form>
      )}

      {/* SECTION 3: TEAM MEMBERS */}
      {activeSection === 'team' && (
        <div className="bg-[#fffdf9] p-4 sm:p-6 border border-[#c9b896] rounded-lg shadow-xs space-y-4 sm:space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#c9b896]/40">
            <div>
              <h3 className="text-sm font-bold text-[#24312e]">Workspace Membership & Role Assignment</h3>
              <p className="text-xs text-[#24312e]/70">
                Manage roles, deactivate credentials, and enforce least privilege.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canTransferOwnership && (
                <button
                  onClick={() => setTransferModalOpen(true)}
                  className="px-3 py-2 min-h-[40px] text-xs font-medium border border-[#c9b896] hover:bg-[#e8dcc8] rounded text-[#24312e] flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#008371]" />
                  <span>Transfer Ownership</span>
                </button>
              )}
              {canManageMembers && (
                <button
                  onClick={() => setInviteModalOpen(true)}
                  className="px-3.5 py-2 min-h-[40px] bg-[#008371] hover:bg-[#006b5b] text-white text-xs font-semibold rounded shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Invite Teammate</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Teammates Card View (visible on < md) */}
          <div className="md:hidden space-y-3">
            {users.map((u) => {
              const isCurrentUser = u.id === currentUser?.id;
              const isOwner = u.role === 'owner';

              return (
                <div
                  key={u.id}
                  className="p-3.5 bg-[#f5f0e6]/40 border border-[#c9b896]/60 rounded-lg space-y-2.5 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-[#24312e] flex items-center gap-1.5 flex-wrap">
                        <span>{u.fullName}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#008371]/15 text-[#008371] rounded font-bold">
                            You
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#24312e]/70 truncate">{u.email}</div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                          u.status === 'active'
                            ? 'bg-[#008371]/15 text-[#008371]'
                            : 'bg-[#b42318]/15 text-[#b42318]'
                        }`}
                      >
                        {u.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#c9b896]/30">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#24312e]/60">Role:</span>
                      {canManageMembers && !isOwner ? (
                        <select
                          value={u.role}
                          onChange={(e) => updateMemberRole(u.id, e.target.value as WorkspaceRole)}
                          className="px-2 py-1 min-h-[36px] text-xs rounded border border-[#c9b896] bg-white text-[#24312e] font-semibold"
                        >
                          <option value="admin">Admin</option>
                          <option value="finance">Finance</option>
                          <option value="preparer">Preparer</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span className="font-mono text-xs font-bold uppercase text-[#006b5b]">
                          {u.role}
                        </span>
                      )}
                    </div>

                    <div>
                      {canManageMembers && !isOwner && !isCurrentUser ? (
                        <button
                          onClick={() => toggleMemberStatus(u.id)}
                          className={`px-2.5 py-1.5 min-h-[36px] text-xs rounded border transition-colors ${
                            u.status === 'active'
                              ? 'border-[#b42318]/40 text-[#b42318] hover:bg-[#b42318]/10'
                              : 'border-[#008371]/40 text-[#008371] hover:bg-[#008371]/10'
                          }`}
                        >
                          {u.status === 'active' ? 'Deactivate' : 'Reactivate'}
                        </button>
                      ) : isOwner ? (
                        <span className="text-[10px] text-[#24312e]/50 italic">Primary Owner</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Members Table (hidden on mobile, visible on md+) */}
          <div className="hidden md:block overflow-x-auto border border-[#c9b896] rounded-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f5f0e6]/60 border-b border-[#c9b896]/50 text-[#24312e]/70 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Member</th>
                  <th className="py-2.5 px-3">Current Role</th>
                  <th className="py-2.5 px-3">MFA Status</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c9b896]/30">
                {users.map((u) => {
                  const isCurrentUser = u.id === currentUser?.id;
                  const isOwner = u.role === 'owner';

                  return (
                    <tr key={u.id} className="hover:bg-[#f5f0e6]/40">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#24312e] flex items-center gap-2">
                          <span>{u.fullName}</span>
                          {isCurrentUser && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#008371]/15 text-[#008371] rounded">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#24312e]/70">{u.email}</div>
                      </td>

                      <td className="py-3 px-3">
                        {canManageMembers && !isOwner ? (
                          <select
                            value={u.role}
                            onChange={(e) => updateMemberRole(u.id, e.target.value as WorkspaceRole)}
                            className="px-2 py-1 text-xs rounded border border-[#c9b896] bg-white text-[#24312e] font-semibold"
                          >
                            <option value="admin">Admin</option>
                            <option value="finance">Finance</option>
                            <option value="preparer">Preparer</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        ) : (
                          <span className="font-mono text-[11px] font-bold uppercase text-[#006b5b]">
                            {u.role}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                            u.mfaEnabled
                              ? 'bg-[#008371]/15 text-[#008371]'
                              : 'bg-neutral-100 text-neutral-600'
                          }`}
                        >
                          {u.mfaEnabled ? 'MFA Verified' : 'Standard'}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                            u.status === 'active'
                              ? 'bg-[#008371]/15 text-[#008371]'
                              : 'bg-[#b42318]/15 text-[#b42318]'
                          }`}
                        >
                          {u.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        {canManageMembers && !isOwner && !isCurrentUser && (
                          <button
                            onClick={() => toggleMemberStatus(u.id)}
                            className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                              u.status === 'active'
                                ? 'border-[#b42318]/40 text-[#b42318] hover:bg-[#b42318]/10'
                                : 'border-[#008371]/40 text-[#008371] hover:bg-[#008371]/10'
                            }`}
                          >
                            {u.status === 'active' ? 'Deactivate' : 'Reactivate'}
                          </button>
                        )}
                        {isOwner && (
                          <span className="text-[10px] text-[#24312e]/50 italic">Primary Owner</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="pt-2 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#24312e]">
                Pending Workspace Invitations
              </h4>
              <div className="divide-y divide-[#c9b896]/30 border border-[#c9b896] rounded-md bg-white">
                {invitations.map((inv) => (
                  <div key={inv.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-[#24312e]">{inv.email}</span>
                      <span className="text-[11px] text-[#24312e]/60 ml-2 font-mono">
                        (Role: {inv.role.toUpperCase()})
                      </span>
                      <div className="text-[10px] text-[#24312e]/60 font-mono mt-0.5">
                        Token: {inv.token} · Invited by {inv.invitedBy}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold">
                      {inv.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: ROLE MATRIX */}
      {activeSection === 'roles' && (
        <div className="bg-[#fffdf9] p-6 border border-[#c9b896] rounded-lg shadow-xs space-y-4">
          <div className="pb-2 border-b border-[#c9b896]/40">
            <h3 className="text-sm font-bold text-[#24312e]">
              PRD Section 1.10 Workspace Role & Permission Baseline
            </h3>
            <p className="text-xs text-[#24312e]/70">
              All permissions are enforced server-side. Prepared drafts require elevated roles to issue or void.
            </p>
          </div>

          <div className="overflow-x-auto border border-[#c9b896] rounded-md">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f5f0e6]/60 border-b border-[#c9b896]/50 text-[#24312e]/70 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">System Capability</th>
                  <th className="py-2.5 px-3 text-center">Owner</th>
                  <th className="py-2.5 px-3 text-center">Admin</th>
                  <th className="py-2.5 px-3 text-center">Finance</th>
                  <th className="py-2.5 px-3 text-center">Preparer</th>
                  <th className="py-2.5 px-3 text-center">Viewer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c9b896]/30">
                {[
                  { name: 'View invoices / customers / reports', o: true, a: true, f: true, p: true, v: true },
                  { name: 'Create and edit invoice drafts', o: true, a: true, f: true, p: true, v: false },
                  { name: 'Issue & allocate invoice number', o: true, a: true, f: true, p: false, v: false },
                  { name: 'Record manual payment remittances', o: true, a: true, f: true, p: false, v: false },
                  { name: 'Void issued financial invoices', o: true, a: true, f: true, p: false, v: false },
                  { name: 'Manage customer and item catalog', o: true, a: true, f: true, p: true, v: false },
                  { name: 'Manage workspace members & roles', o: true, a: true, f: false, p: false, v: false },
                  { name: 'Change company & numbering settings', o: true, a: true, f: false, p: false, v: false },
                  { name: 'Transfer workspace ownership', o: true, a: false, f: false, p: false, v: false },
                  { name: 'View workspace audit trail', o: true, a: true, f: true, p: false, v: false },
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#f5f0e6]/30">
                    <td className="py-2.5 px-3 font-medium text-[#24312e]">{row.name}</td>
                    <td className="py-2.5 px-3 text-center font-bold">{row.o ? '✓' : '—'}</td>
                    <td className="py-2.5 px-3 text-center font-bold">{row.a ? '✓' : '—'}</td>
                    <td className="py-2.5 px-3 text-center font-bold">{row.f ? '✓' : '—'}</td>
                    <td className="py-2.5 px-3 text-center font-bold">{row.p ? '✓' : '—'}</td>
                    <td className="py-2.5 px-3 text-center font-bold">{row.v ? '✓' : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#fffdf9] border border-[#c9b896] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#24312e]">Invite New Teammate</h3>
            <p className="text-xs text-[#24312e]/70">
              Invitations are single-use, expire in 7 days, and require explicit workspace membership.
            </p>

            <form onSubmit={handleInviteSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#24312e] mb-1">
                  Teammate Work Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@catalyststudio.io"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 min-h-[44px] rounded border border-[#c9b896] bg-white text-[#24312e]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#24312e] mb-1">
                  Assigned Workspace Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as WorkspaceRole)}
                  className="w-full px-3 py-2 min-h-[44px] rounded border border-[#c9b896] bg-white text-[#24312e]"
                >
                  <option value="admin">Admin - Team & settings management</option>
                  <option value="finance">Finance - Prepare, issue & collect</option>
                  <option value="preparer">Preparer - Draft invoices & clients</option>
                  <option value="viewer">Viewer - Read-only access & exports</option>
                </select>
              </div>

              <div className="pt-3 border-t border-[#c9b896]/40 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-3.5 py-2 min-h-[40px] text-xs text-[#24312e]/70 hover:text-[#24312e]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 min-h-[40px] bg-[#008371] hover:bg-[#006b5b] text-white font-medium rounded transition-colors"
                >
                  Generate Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {transferModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-[#fffdf9] border border-[#b42318] rounded-xl max-w-md w-full p-4 sm:p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#b42318]">Transfer Workspace Ownership</h3>
            <p className="text-xs text-[#24312e]/70">
              Ownership can only be transferred to an active teammate. You will be assigned the <strong>Admin</strong> role upon completion.
            </p>

            <form onSubmit={handleTransferSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-[#24312e] mb-1">
                  Select New Owner
                </label>
                <select
                  required
                  value={newOwnerId}
                  onChange={(e) => setNewOwnerId(e.target.value)}
                  className="w-full px-3 py-2 min-h-[44px] rounded border border-[#c9b896] bg-white text-[#24312e]"
                >
                  <option value="">Select a member...</option>
                  {users
                    .filter((u) => u.id !== currentUser?.id && u.status === 'active')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.email}) - {u.role.toUpperCase()}
                      </option>
                    ))}
                </select>
              </div>

              <div className="pt-3 border-t border-[#c9b896]/40 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTransferModalOpen(false)}
                  className="px-3.5 py-2 min-h-[40px] text-xs text-[#24312e]/70 hover:text-[#24312e]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 min-h-[40px] bg-[#b42318] hover:bg-[#911c13] text-white font-medium rounded transition-colors"
                >
                  Transfer Ownership
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
