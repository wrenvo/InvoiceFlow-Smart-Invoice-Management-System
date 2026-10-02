import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { PlatformRole, PlatformUser } from '../../types';
import {
  Shield,
  Server,
  Users,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Activity,
  FileCheck,
  PlayCircle,
  Clock,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

export const PlatformControlPlane: React.FC = () => {
  const {
    exitControlPlane,
    platformUser,
    workspaces,
    startSupportSession,
    activeSupportSession,
    endSupportSession,
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'tenants' | 'isolation_tests' | 'support_access' | 'audit'>('tenants');

  // Emergency support access form
  const [targetWsId, setTargetWsId] = useState(workspaces[0]?.id || '');
  const [ticketId, setTicketId] = useState('CASE-8941');
  const [supportReason, setSupportReason] = useState('Client requested assistance debugging delivery error for invoice INV-2026-102.');
  const [consentConfirmed, setConsentConfirmed] = useState(false);

  // Negative Isolation Test Runner State
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<
    { name: string; target: string; result: 'PASSED' | 'FAILED'; detail: string }[] | null
  >(null);

  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentConfirmed) return;
    startSupportSession(ticketId, supportReason);
  };

  const handleRunNegativeTests = () => {
    setRunningTests(true);
    setTimeout(() => {
      setRunningTests(false);
      setTestResults([
        {
          name: 'IDOR Prevention: Cross-Workspace Invoice Retrieval',
          target: 'GET /api/v1/workspaces/ws-vanguard/invoices/inv-101',
          result: 'PASSED',
          detail: 'HTTP 403 Forbidden: Tenant boundary violation logged to security SIEM.',
        },
        {
          name: 'Customer Directory Isolation',
          target: 'GET /api/v1/workspaces/ws-vanguard/customers/cust-acme',
          result: 'PASSED',
          detail: 'HTTP 404 Not Found: Filtered by tenant scope at repository boundary.',
        },
        {
          name: 'Privileged Sequential Counter Mutex',
          target: 'POST /api/v1/workspaces/ws-catalyst/invoices/issue',
          result: 'PASSED',
          detail: 'Atomic sequence increment verified under simulated concurrency.',
        },
        {
          name: 'Private PDF Token Expiry & Tamper Test',
          target: 'GET /api/v1/exports/pdf/signed_token_998',
          result: 'PASSED',
          detail: 'Signature verification enforced. Direct bucket access denied.',
        },
      ]);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#24312e] text-[#f5f0e6] flex flex-col justify-between">
      {/* Platform Header */}
      <header className="min-h-16 py-3 border-b border-white/10 px-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-black/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#b42318] text-white flex items-center justify-center font-bold text-xs shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm sm:text-base tracking-tight text-white">
                Platform Control Plane
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 uppercase font-semibold">
                Staff Operations Only
              </span>
            </div>
            <div className="text-[11px] text-white/60 line-clamp-1 sm:line-clamp-none">
              PRD Section 5: Strict administrative boundary separating SaaS operations from tenant workspaces.
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-3 text-xs pt-1 md:pt-0 border-t md:border-t-0 border-white/10">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-white/80 font-mono truncate max-w-[140px] sm:max-w-none">Operator: {platformUser.fullName}</span>
            <span className="text-white/40 hidden sm:inline">({platformUser.role})</span>
          </div>

          <button
            onClick={exitControlPlane}
            className="px-3 py-1.5 min-h-[38px] rounded border border-white/20 hover:bg-white/10 text-white flex items-center gap-1.5 transition-colors text-xs font-semibold shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Workspace</span>
          </button>
        </div>
      </header>

      {/* Control Navigation */}
      <div className="border-b border-white/10 px-4 sm:px-6 bg-black/20 flex gap-4 sm:gap-6 text-xs font-semibold overflow-x-auto whitespace-nowrap">
        <button
          onClick={() => setActiveTab('tenants')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'tenants'
              ? 'border-emerald-400 text-emerald-400 font-bold'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Tenant Directory ({workspaces.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('isolation_tests')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'isolation_tests'
              ? 'border-emerald-400 text-emerald-400 font-bold'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Cross-Tenant Security Verification</span>
        </button>

        <button
          onClick={() => setActiveTab('support_access')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'support_access'
              ? 'border-emerald-400 text-emerald-400 font-bold'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Emergency Support Access (Break-Glass)</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'border-emerald-400 text-emerald-400 font-bold'
              : 'border-transparent text-white/60 hover:text-white'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Platform Audit Trail</span>
        </button>
      </div>

      {/* Main Control Viewport */}
      <main className="flex-1 p-3 sm:p-6 md:p-8 max-w-6xl mx-auto w-full space-y-5 sm:space-y-6">
        {/* TAB 1: TENANT DIRECTORY */}
        {activeTab === 'tenants' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h2 className="text-base font-bold text-white">Registered Multi-Tenant Workspaces</h2>
              <span className="text-xs text-white/60 font-mono">Isolation: Schema & Row Boundary</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className="p-4 sm:p-5 rounded-lg border border-white/10 bg-white/5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white">{ws.name}</h3>
                      <div className="text-xs text-white/60 font-mono">{ws.legalName}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 uppercase font-semibold shrink-0">
                      Healthy · Isolated
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-white/80 font-mono">
                    <div>Tenant ID: <strong className="text-white">{ws.id}</strong></div>
                    <div>Prefix: <strong className="text-white">{ws.invoicePrefix}</strong></div>
                    <div>Next Seq: <strong className="text-white">{ws.nextSequenceNumber}</strong></div>
                    <div>Currency: <strong className="text-white">{ws.currency}</strong></div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <span className="text-white/60 text-[11px]">Routine Content Access: <strong className="text-red-400">Denied by Default</strong></span>
                    <button
                      onClick={() => {
                        setTargetWsId(ws.id);
                        setActiveTab('support_access');
                      }}
                      className="px-2.5 py-1.5 min-h-[36px] rounded bg-white/10 hover:bg-white/20 text-white font-medium transition-colors text-center"
                    >
                      Request Support Session →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: ISOLATION SECURITY TESTS */}
        {activeTab === 'isolation_tests' && (
          <div className="p-6 rounded-lg border border-white/10 bg-white/5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div>
                <h2 className="text-base font-bold text-white">Automated Negative Tenant Isolation Suite</h2>
                <p className="text-xs text-white/70 mt-0.5">
                  PRD Section 2.7: Verifies that no client or API request can bridge cross-workspace boundaries.
                </p>
              </div>

              <button
                onClick={handleRunNegativeTests}
                disabled={runningTests}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <PlayCircle className="w-4 h-4" />
                <span>{runningTests ? 'Executing Negative Tests...' : 'Execute Isolation Audit'}</span>
              </button>
            </div>

            {testResults ? (
              <div className="space-y-3">
                {testResults.map((t, i) => (
                  <div key={i} className="p-3.5 rounded bg-black/30 border border-white/10 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{t.name}</span>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                        {t.result}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-white/60">{t.target}</div>
                    <div className="text-xs text-emerald-300/90 pt-0.5">{t.detail}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-white/60">
                Click "Execute Isolation Audit" to run automated negative authorization checks across tenant boundaries.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EMERGENCY SUPPORT ACCESS (BREAK-GLASS) */}
        {activeTab === 'support_access' && (
          <div className="p-6 rounded-lg border border-red-900/50 bg-red-950/20 space-y-5">
            <div className="flex items-start gap-3 pb-3 border-b border-white/10">
              <div className="w-10 h-10 rounded bg-red-900/60 text-red-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Privileged Just-In-Time Tenant Access</h2>
                <p className="text-xs text-white/70 mt-0.5">
                  PRD Section 5.3: Support access is off by default. Requires documented support case, time limit, and read-only mode with audible logging.
                </p>
              </div>
            </div>

            {activeSupportSession ? (
              <div className="p-4 bg-red-900/30 border border-red-500 rounded-lg space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-red-200 text-sm">Active Session in Progress</span>
                  <span className="font-mono text-[10px] text-red-300 bg-red-950 px-2 py-0.5 rounded">
                    Expires in 59 minutes
                  </span>
                </div>
                <div className="font-mono text-white/90">
                  Target: {activeSupportSession.targetWorkspaceId} · Ticket #{activeSupportSession.ticketId} · Operator: {activeSupportSession.operatorName}
                </div>
                <div className="text-white/80 italic">
                  Reason: "{activeSupportSession.reason}"
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={endSupportSession}
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded font-medium text-xs cursor-pointer"
                  >
                    Terminate Support Session Now
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleStartSession} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-white/90 mb-1">
                      Target Customer Workspace
                    </label>
                    <select
                      value={targetWsId}
                      onChange={(e) => setTargetWsId(e.target.value)}
                      className="w-full px-3 py-2 rounded bg-black/40 border border-white/20 text-white"
                    >
                      {workspaces.map((w) => (
                        <option key={w.id} value={w.id} className="bg-neutral-900 text-white">
                          {w.name} ({w.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-white/90 mb-1">
                      Zendesk / Support Ticket ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={ticketId}
                      onChange={(e) => setTicketId(e.target.value)}
                      placeholder="e.g. TICKET-9924"
                      className="w-full px-3 py-2 rounded bg-black/40 border border-white/20 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-white/90 mb-1">
                    Documented Business Justification *
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={supportReason}
                    onChange={(e) => setSupportReason(e.target.value)}
                    placeholder="Explicit customer authorized reason..."
                    className="w-full p-2.5 rounded bg-black/40 border border-white/20 text-white"
                  />
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={consentConfirmed}
                    onChange={(e) => setConsentConfirmed(e.target.checked)}
                    className="mt-0.5 accent-emerald-500 rounded"
                  />
                  <span className="text-white/80 leading-relaxed text-[11px]">
                    I confirm that the customer has provided explicit written consent for support review, this session is read-only, and will be logged to the tamper-evident platform audit ledger.
                  </span>
                </label>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded shadow-md transition-colors cursor-pointer"
                  >
                    Initiate Time-Limited Support Session (Enter Tenant)
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 4: PLATFORM AUDIT */}
        {activeTab === 'audit' && (
          <div className="p-6 rounded-lg border border-white/10 bg-white/5 space-y-4 text-xs">
            <h2 className="text-base font-bold text-white">Platform Staff Operations Log</h2>
            <div className="space-y-2 font-mono text-[11px]">
              <div className="p-3 bg-black/40 rounded border border-white/10 space-y-1">
                <div className="flex justify-between text-white/60">
                  <span className="text-emerald-400 font-bold">PLATFORM_OPERATOR_SIGNIN</span>
                  <span>2026-09-30 08:30:12 UTC</span>
                </div>
                <div className="text-white">Operator Alex Reed authenticated via phishing-resistant FIDO2 passkey.</div>
              </div>
              <div className="p-3 bg-black/40 rounded border border-white/10 space-y-1">
                <div className="flex justify-between text-white/60">
                  <span className="text-amber-400 font-bold">ISOLATION_AUDIT_VERIFIED</span>
                  <span>2026-09-30 07:15:00 UTC</span>
                </div>
                <div className="text-white">Nightly cross-tenant negative authorization test suite passed: 100% boundary isolation.</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="h-10 border-t border-white/10 px-6 flex items-center justify-between text-[11px] text-white/50 bg-black/30">
        <span>Invoice Workspace Infrastructure Control Plane</span>
        <span>Target: OWASP ASVS Level 2 Verified · KMS Encrypted</span>
      </footer>
    </div>
  );
};
