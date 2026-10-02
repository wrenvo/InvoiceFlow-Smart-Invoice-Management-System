import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { INITIAL_USERS } from '../../data/mockData';
import { User } from '../../types';
import {
  Shield,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  ArrowRight,
  Building2,
  Lock,
  Mail,
  User as UserIcon,
  AlertCircle,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, registerWorkspace, users } = useWorkspace();

  // Active form tab: 'signin' | 'register'
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin');

  // Sign In state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Register / Create Workspace state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regWorkspaceName, setRegWorkspaceName] = useState('');
  const [regCurrency, setRegCurrency] = useState('USD');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAgreed, setRegAgreed] = useState(false);
  const [regError, setRegError] = useState('');

  // MFA state
  const [isMfaStep, setIsMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [selectedUserForMfa, setSelectedUserForMfa] = useState<User | null>(null);

  // Forgot password modal
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Invite token modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteToken, setInviteToken] = useState('sec_tok_f8a91b2c');

  // Handle Standard Sign In
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your work email and password.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const allUsers = [...users, ...INITIAL_USERS];
      const user = allUsers.find(
        (u) => u.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (!user) {
        setErrorMessage(
          'We couldn’t sign you in with those details. Please check your email or create a new workspace.'
        );
        return;
      }

      if (user.mfaEnabled) {
        setSelectedUserForMfa(user);
        setIsMfaStep(true);
      } else {
        login(user);
      }
    }, 400);
  };

  // Handle MFA Verification
  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mfaCode.length < 6) {
      setErrorMessage('Please enter a valid 6-digit verification code.');
      return;
    }
    if (selectedUserForMfa) {
      login(selectedUserForMfa);
    }
  };

  // Handle Create Account / Register
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regFullName.trim() || !regEmail.trim() || !regWorkspaceName.trim()) {
      setRegError('Please fill in all required fields.');
      return;
    }

    if (regPassword.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    if (!regAgreed) {
      setRegError('You must agree to the Terms of Service and Privacy Policy.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      registerWorkspace({
        fullName: regFullName.trim(),
        email: regEmail.trim(),
        workspaceName: regWorkspaceName.trim(),
        currency: regCurrency,
      });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#f5f0e6] flex flex-col justify-between p-3 sm:p-6 md:p-8">
      {/* Top Bar Indicator */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between pb-4 sm:pb-6 text-xs text-[#24312e]/70">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#008371] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            IW
          </div>
          <span className="font-bold text-sm tracking-tight text-[#24312e]">Invoice Workspace</span>
          <span className="hidden sm:inline-block font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#e8dcc8] text-[#006b5b] font-semibold">
            v2.4 Production
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setForgotModalOpen(true)}
            className="hover:text-[#008371] transition-colors"
          >
            Need Help?
          </button>
        </div>
      </header>

      {/* Main Two-Column Container */}
      <main className="max-w-5xl w-full mx-auto my-auto shadow-sm rounded-2xl overflow-hidden border border-[#c9b896] bg-[#fffdf9] grid md:grid-cols-12">
        {/* Left Feature & Branding Panel (#e8dcc8) - collapsed on mobile screens */}
        <div className="hidden md:flex md:col-span-5 bg-[#e8dcc8] p-6 lg:p-8 flex-col justify-between border-r border-[#c9b896]">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-[#008371] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                IW
              </div>
              <span className="font-bold text-lg text-[#24312e] tracking-tight">Invoice Workspace</span>
            </div>

            <h2 className="text-xl lg:text-2xl font-bold text-[#24312e] leading-snug tracking-tight">
              One dependable workspace for the complete invoice lifecycle.
            </h2>

            <p className="text-xs text-[#24312e]/80 leading-relaxed">
              Create, review, issue, deliver, and reconcile financial invoice records with decimal-safe precision and immutable audit trails.
            </p>

            {/* Feature Bullets */}
            <div className="space-y-2.5 pt-2 text-xs text-[#24312e]/90">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#008371] shrink-0 mt-0.5" />
                <span><strong>Multi-Tenant Architecture</strong>: Row-level tenant isolation defense.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#008371] shrink-0 mt-0.5" />
                <span><strong>RBAC Role Matrix</strong>: Enforces Owner, Admin, Finance, Preparer, and Viewer boundaries.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#008371] shrink-0 mt-0.5" />
                <span><strong>Lifecycle Security</strong>: Drafts, atomic numbering, email logs, payment tracking, and irreversible voids.</span>
              </div>
            </div>
          </div>

          {/* Ledger Illustration & Trust Badges */}
          <div className="mt-6 pt-4 border-t border-[#c9b896]/60">
            <div className="rounded-lg overflow-hidden border border-[#c9b896]/60 bg-white/40 shadow-xs">
              <img
                src="/src/assets/images/login_ledger_illustration_1790783168291.jpg"
                alt="Financial balance ledger and invoice line items"
                referrerPolicy="no-referrer"
                className="w-full h-32 lg:h-36 object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-[#24312e]/70 font-mono">
              <span>OWASP ASVS L2</span>
              <span>·</span>
              <span>Multi-Tenant Isolated</span>
              <span>·</span>
              <span>Audit Immutable</span>
            </div>
          </div>
        </div>

        {/* Right Authentication Card */}
        <div className="md:col-span-7 p-4 sm:p-7 lg:p-9 flex flex-col justify-between">
          {!isMfaStep ? (
            <div>
              {/* Mobile Brand Mark */}
              <div className="md:hidden flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded bg-[#008371] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  IW
                </div>
                <span className="font-bold text-base text-[#24312e]">Invoice Workspace</span>
              </div>

              {/* Mode Switcher Tabs */}
              <div className="flex items-center gap-1 p-1 bg-[#f5f0e6] rounded-lg border border-[#c9b896]/50 mb-5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setErrorMessage('');
                  }}
                  className={`flex-1 py-2 rounded-md transition-colors cursor-pointer text-center ${
                    authMode === 'signin'
                      ? 'bg-[#008371] text-white shadow-xs font-bold'
                      : 'text-[#24312e]/70 hover:text-[#24312e]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setRegError('');
                  }}
                  className={`flex-1 py-2 rounded-md transition-colors cursor-pointer text-center ${
                    authMode === 'register'
                      ? 'bg-[#008371] text-white shadow-xs font-bold'
                      : 'text-[#24312e]/70 hover:text-[#24312e]'
                  }`}
                >
                  Create Workspace
                </button>
              </div>

              {/* TAB 1: SIGN IN */}
              {authMode === 'signin' && (
                <div>
                  <div className="mb-4">
                    <h1 className="text-xl sm:text-2xl font-bold text-[#24312e] tracking-tight">
                      Welcome back
                    </h1>
                    <p className="text-xs text-[#24312e]/70 mt-1">
                      Sign in to manage invoices, clients, payments, and team settings.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="mb-4 p-3 rounded-md bg-[#b42318]/10 border border-[#b42318]/30 text-[#b42318] text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleSignIn} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#24312e] mb-1">
                        Work email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3 top-3.5 text-[#24312e]/40" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@catalyststudio.io"
                          className="w-full pl-9 pr-3 py-2.5 min-h-[44px] text-xs rounded border border-[#c9b896] bg-[#fffdf9] focus:outline-none focus:ring-2 focus:ring-[#008371] text-[#24312e]"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-[#24312e]">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setForgotModalOpen(true)}
                          className="text-xs text-[#006b5b] hover:underline font-medium min-h-[30px] flex items-center"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3 top-3.5 text-[#24312e]/40" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-9 pr-10 py-2.5 min-h-[44px] text-xs rounded border border-[#c9b896] bg-[#fffdf9] focus:outline-none focus:ring-2 focus:ring-[#008371] text-[#24312e]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-0 top-0 bottom-0 px-3 min-w-[44px] flex items-center justify-center text-[#24312e]/50 hover:text-[#24312e]"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <label className="flex items-center gap-2 cursor-pointer text-[#24312e]/80">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded accent-[#008371] min-h-[16px] min-w-[16px]"
                        />
                        <span>Remember this device</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 min-h-[44px] bg-[#008371] hover:bg-[#006b5b] text-white text-xs font-semibold rounded shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <span>Authenticating credentials...</span>
                      ) : (
                        <>
                          <span>Sign in to Workspace</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Clean Registration Link & Invitation */}
                  <div className="mt-5 pt-3.5 border-t border-[#c9b896]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <span className="text-[#24312e]/70">Don't have a workspace yet?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('register');
                        setRegError('');
                      }}
                      className="font-semibold text-[#006b5b] hover:underline cursor-pointer text-left sm:text-right"
                    >
                      Create a new workspace →
                    </button>
                  </div>

                  <div className="mt-3 text-center sm:text-left">
                    <button
                      type="button"
                      onClick={() => setInviteModalOpen(true)}
                      className="text-xs text-[#24312e]/60 hover:text-[#008371] hover:underline min-h-[36px] inline-flex items-center"
                    >
                      Have an invitation? Accept your invite token
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: CREATE WORKSPACE (REGISTER) */}
              {authMode === 'register' && (
                <div>
                  <div className="mb-4">
                    <h1 className="text-xl sm:text-2xl font-bold text-[#24312e] tracking-tight">
                      Create your workspace
                    </h1>
                    <p className="text-xs text-[#24312e]/70 mt-1">
                      Set up a new isolated multi-tenant organization. You will be assigned the <strong>Owner</strong> role.
                    </p>
                  </div>

                  {regError && (
                    <div className="mb-4 p-3 rounded-md bg-[#b42318]/10 border border-[#b42318]/30 text-[#b42318] text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{regError}</span>
                    </div>
                  )}

                  <form onSubmit={handleRegister} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#24312e] mb-1">
                          Full Name *
                        </label>
                        <div className="relative">
                          <UserIcon className="w-4 h-4 absolute left-3 top-3 text-[#24312e]/40" />
                          <input
                            type="text"
                            required
                            value={regFullName}
                            onChange={(e) => setRegFullName(e.target.value)}
                            placeholder="Sarah Jenkins"
                            className="w-full pl-9 pr-3 py-2 min-h-[42px] text-xs rounded border border-[#c9b896] bg-white text-[#24312e]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#24312e] mb-1">
                          Work Email *
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 absolute left-3 top-3 text-[#24312e]/40" />
                          <input
                            type="email"
                            required
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="sarah@acme.com"
                            className="w-full pl-9 pr-3 py-2 min-h-[42px] text-xs rounded border border-[#c9b896] bg-white text-[#24312e]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[#24312e] mb-1">
                          Company / Workspace Name *
                        </label>
                        <div className="relative">
                          <Building2 className="w-4 h-4 absolute left-3 top-3 text-[#24312e]/40" />
                          <input
                            type="text"
                            required
                            value={regWorkspaceName}
                            onChange={(e) => setRegWorkspaceName(e.target.value)}
                            placeholder="Acme Global Logistics"
                            className="w-full pl-9 pr-3 py-2 min-h-[42px] text-xs rounded border border-[#c9b896] bg-white text-[#24312e]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#24312e] mb-1">
                          Currency
                        </label>
                        <select
                          value={regCurrency}
                          onChange={(e) => setRegCurrency(e.target.value)}
                          className="w-full px-3 py-2 min-h-[42px] text-xs font-mono rounded border border-[#c9b896] bg-white text-[#24312e]"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="EUR">EUR (€)</option>
                          <option value="GBP">GBP (£)</option>
                          <option value="CAD">CAD ($)</option>
                          <option value="AUD">AUD ($)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#24312e] mb-1">
                          Password *
                        </label>
                        <input
                          type="password"
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="At least 6 characters"
                          className="w-full px-3 py-2 min-h-[42px] text-xs rounded border border-[#c9b896] bg-white text-[#24312e]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#24312e] mb-1">
                          Confirm Password *
                        </label>
                        <input
                          type="password"
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full px-3 py-2 min-h-[42px] text-xs rounded border border-[#c9b896] bg-white text-[#24312e]"
                        />
                      </div>
                    </div>

                    <label className="flex items-start gap-2 text-xs text-[#24312e]/80 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={regAgreed}
                        onChange={(e) => setRegAgreed(e.target.checked)}
                        className="rounded accent-[#008371] mt-0.5 min-h-[16px] min-w-[16px]"
                      />
                      <span>
                        I agree to the <strong>Terms of Service</strong>, Privacy Policy, and immutable audit logging policies.
                      </span>
                    </label>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 min-h-[44px] bg-[#008371] hover:bg-[#006b5b] text-white text-xs font-semibold rounded shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
                    >
                      {loading ? (
                        <span>Provisioning new workspace...</span>
                      ) : (
                        <>
                          <span>Create Workspace & Enter</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            /* Mandatory MFA Step for Privileged Accounts */
            <div className="space-y-4">
              <div>
                <div className="w-10 h-10 rounded-full bg-[#008371]/10 text-[#008371] flex items-center justify-center mb-3">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#24312e] tracking-tight">
                  Verify it’s you
                </h1>
                <p className="text-xs text-[#24312e]/70 mt-1">
                  MFA is mandatory for privileged accounts. Enter the 6-digit code from your authenticator app for{' '}
                  <strong>{selectedUserForMfa?.email}</strong>.
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-md bg-[#b42318]/10 border border-[#b42318]/30 text-[#b42318] text-xs">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleMfaSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#24312e] mb-1.5">
                    Authenticator 6-Digit Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 748201"
                    className="w-full px-3 py-2.5 text-center tracking-widest font-mono text-lg font-bold rounded border border-[#c9b896] bg-[#fffdf9] focus:outline-none focus:ring-2 focus:ring-[#008371] text-[#24312e]"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMfaCode('748201')}
                    className="text-xs px-2.5 py-1.5 min-h-[36px] rounded bg-[#e8dcc8] text-[#24312e] hover:bg-[#c9b896]/60 font-mono font-semibold"
                  >
                    Auto-fill demo code: 748201
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 min-h-[44px] bg-[#008371] hover:bg-[#006b5b] text-white text-xs font-semibold rounded shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  Verify and Sign in
                </button>

                <button
                  type="button"
                  onClick={() => setIsMfaStep(false)}
                  className="w-full py-1 min-h-[36px] text-xs text-[#24312e]/60 hover:text-[#24312e]"
                >
                  ← Back to email sign in
                </button>
              </form>
            </div>
          )}

          {/* Footer Notice */}
          <div className="mt-6 pt-3.5 border-t border-[#c9b896]/40 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#24312e]/60">
            <span>© 2026 Invoice Workspace Inc.</span>
            <div className="flex items-center gap-3">
              <span className="hover:underline cursor-pointer">Terms</span>
              <span>·</span>
              <span className="hover:underline cursor-pointer">Privacy</span>
              <span>·</span>
              <span className="hover:underline cursor-pointer">Security ASVS L2</span>
            </div>
          </div>
        </div>
      </main>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-[#fffdf9] border border-[#c9b896] rounded-xl max-w-md w-full p-5 sm:p-6 shadow-xl space-y-3">
            <h3 className="text-base font-bold text-[#24312e]">Reset your password</h3>
            <p className="text-xs text-[#24312e]/70">
              Enter your work email address. To prevent user enumeration, responses are generic and do not disclose account existence.
            </p>

            {resetSuccess ? (
              <div className="mt-4 p-3 bg-[#008371]/10 border border-[#008371]/30 rounded text-xs text-[#006b5b] flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#008371] mt-0.5" />
                <div>
                  <strong>Request Dispatched:</strong> If an account is registered with this address, a single-use secure reset link has been dispatched. Links expire in 15 minutes.
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setResetSuccess(true);
                }}
                className="mt-4 space-y-3"
              >
                <div>
                  <label className="block text-xs font-semibold text-[#24312e] mb-1">
                    Work email
                  </label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full px-3 py-2 min-h-[44px] text-xs rounded border border-[#c9b896] bg-white text-[#24312e]"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotModalOpen(false);
                      setResetSuccess(false);
                    }}
                    className="px-3.5 py-2 min-h-[40px] text-xs text-[#24312e]/70 hover:text-[#24312e]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 min-h-[40px] bg-[#008371] hover:bg-[#006b5b] text-white text-xs font-medium rounded transition-colors"
                  >
                    Send reset instructions
                  </button>
                </div>
              </form>
            )}

            {resetSuccess && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setForgotModalOpen(false);
                    setResetSuccess(false);
                  }}
                  className="px-4 py-2 min-h-[40px] bg-[#008371] text-white text-xs font-semibold rounded"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Accept Invitation Modal */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-[#fffdf9] border border-[#c9b896] rounded-xl max-w-md w-full p-5 sm:p-6 shadow-xl space-y-3">
            <h3 className="text-base font-bold text-[#24312e]">Accept Workspace Invitation</h3>
            <p className="text-xs text-[#24312e]/70">
              Paste the single-use invite token received via email to join your organization's workspace.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                // Match sample invitation
                const sampleUser = INITIAL_USERS[2]; // Elena / Claire
                login(sampleUser);
              }}
              className="mt-4 space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-[#24312e] mb-1">
                  Invitation Token
                </label>
                <input
                  type="text"
                  required
                  value={inviteToken}
                  onChange={(e) => setInviteToken(e.target.value)}
                  className="w-full px-3 py-2 min-h-[44px] text-xs font-mono rounded border border-[#c9b896] bg-white text-[#24312e]"
                />
              </div>

              <div className="p-2.5 bg-[#e8dcc8]/40 border border-[#c9b896]/40 rounded text-[11px] text-[#24312e]/80">
                Workspace: <strong>Catalyst Studio</strong> · Target: <strong>claire.morrison@catalyststudio.io</strong> (Role: Finance)
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-3.5 py-2 min-h-[40px] text-xs text-[#24312e]/70 hover:text-[#24312e]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 min-h-[40px] bg-[#008371] hover:bg-[#006b5b] text-white text-xs font-medium rounded"
                >
                  Accept & Enter Workspace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
