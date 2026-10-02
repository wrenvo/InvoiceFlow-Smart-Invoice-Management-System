import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Workspace,
  User,
  WorkspaceRole,
  Customer,
  CatalogItem,
  Invoice,
  PaymentRecord,
  AuditEvent,
  WorkspaceInvitation,
  PlatformUser,
  SupportSession,
  DeliveryAttempt,
  PaymentStatus,
} from '../types';
import {
  INITIAL_WORKSPACES,
  INITIAL_USERS,
  PLATFORM_OPERATOR,
  INITIAL_CUSTOMERS,
  INITIAL_CATALOG,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_AUDIT_EVENTS,
  INITIAL_INVITATIONS,
} from '../data/mockData';
import { calculateInvoiceTotals, isInvoiceOverdue, round2 } from '../utils/calculations';

interface WorkspaceContextType {
  // State
  currentWorkspace: Workspace;
  workspaces: Workspace[];
  currentUser: User | null;
  platformUser: PlatformUser;
  inControlPlane: boolean;
  activeSupportSession: SupportSession | null;
  users: User[];
  customers: Customer[];
  catalog: CatalogItem[];
  invoices: Invoice[];
  payments: PaymentRecord[];
  auditEvents: AuditEvent[];
  invitations: WorkspaceInvitation[];

  // Permissions helpers
  canCreateInvoice: boolean;
  canIssueInvoice: boolean;
  canRecordPayment: boolean;
  canVoidInvoice: boolean;
  canManageMembers: boolean;
  canManageSettings: boolean;
  canExportData: boolean;
  canTransferOwnership: boolean;

  // Actions
  login: (user: User) => void;
  logout: () => void;
  registerWorkspace: (data: {
    fullName: string;
    email: string;
    workspaceName: string;
    currency: string;
  }) => User;
  switchWorkspace: (workspaceId: string) => void;
  switchUserRole: (role: WorkspaceRole) => void;
  selectPersona: (userId: string) => void;
  enterControlPlane: () => void;
  exitControlPlane: () => void;
  startSupportSession: (ticketId: string, reason: string) => void;
  endSupportSession: () => void;

  // Invoices
  saveInvoiceDraft: (draft: Partial<Invoice> & { id?: string }) => Invoice;
  issueInvoice: (invoiceId: string) => { success: boolean; invoice?: Invoice; error?: string };
  sendInvoiceEmail: (invoiceId: string, recipientEmail?: string, simulateFailure?: boolean) => Promise<{ success: boolean; message: string }>;
  retryInvoiceDelivery: (invoiceId: string) => Promise<{ success: boolean }>;
  recordPayment: (invoiceId: string, amount: number, paymentMethod: PaymentRecord['paymentMethod'], reference: string, notes?: string) => { success: boolean; error?: string };
  voidInvoice: (invoiceId: string, reason: string) => { success: boolean; error?: string };
  deleteDraft: (invoiceId: string) => { success: boolean; error?: string };

  // Customers
  addCustomer: (data: Omit<Customer, 'id' | 'workspaceId' | 'createdAt'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  archiveCustomer: (id: string) => void;
  unarchiveCustomer: (id: string) => void;

  // Catalog
  addCatalogItem: (data: Omit<CatalogItem, 'id' | 'workspaceId' | 'createdAt'>) => CatalogItem;
  updateCatalogItem: (id: string, data: Partial<CatalogItem>) => void;
  deleteCatalogItem: (id: string) => void;

  // Settings & Team
  updateWorkspaceSettings: (settings: Partial<Workspace>) => void;
  inviteMember: (email: string, role: WorkspaceRole) => { success: boolean; invitation?: WorkspaceInvitation; error?: string };
  updateMemberRole: (userId: string, newRole: WorkspaceRole) => { success: boolean; error?: string };
  toggleMemberStatus: (userId: string) => { success: boolean; error?: string };
  transferOwnership: (newOwnerId: string) => { success: boolean; error?: string };
  logAuditEvent: (action: string, targetType: AuditEvent['targetType'], targetId: string, summary: string, details?: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize from localStorage or defaults
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const saved = localStorage.getItem('iw_workspaces');
    return saved ? JSON.parse(saved) : INITIAL_WORKSPACES;
  });

  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>(() => {
    const saved = localStorage.getItem('iw_curr_ws');
    return saved || 'ws-catalyst';
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('iw_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    const saved = localStorage.getItem('iw_curr_user_id');
    return saved || null;
  });

  const [inControlPlane, setInControlPlane] = useState<boolean>(() => {
    return localStorage.getItem('iw_in_control') === 'true';
  });

  const [activeSupportSession, setActiveSupportSession] = useState<SupportSession | null>(() => {
    const saved = localStorage.getItem('iw_support_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('iw_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [catalog, setCatalog] = useState<CatalogItem[]>(() => {
    const saved = localStorage.getItem('iw_catalog');
    return saved ? JSON.parse(saved) : INITIAL_CATALOG;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('iw_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('iw_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(() => {
    const saved = localStorage.getItem('iw_audit_events');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_EVENTS;
  });

  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>(() => {
    const saved = localStorage.getItem('iw_invitations');
    return saved ? JSON.parse(saved) : INITIAL_INVITATIONS;
  });

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('iw_workspaces', JSON.stringify(workspaces));
  }, [workspaces]);

  useEffect(() => {
    localStorage.setItem('iw_curr_ws', currentWorkspaceId);
  }, [currentWorkspaceId]);

  useEffect(() => {
    localStorage.setItem('iw_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUserId) {
      localStorage.setItem('iw_curr_user_id', currentUserId);
    } else {
      localStorage.removeItem('iw_curr_user_id');
    }
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('iw_in_control', inControlPlane ? 'true' : 'false');
  }, [inControlPlane]);

  useEffect(() => {
    if (activeSupportSession) {
      localStorage.setItem('iw_support_session', JSON.stringify(activeSupportSession));
    } else {
      localStorage.removeItem('iw_support_session');
    }
  }, [activeSupportSession]);

  useEffect(() => {
    localStorage.setItem('iw_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('iw_catalog', JSON.stringify(catalog));
  }, [catalog]);

  useEffect(() => {
    localStorage.setItem('iw_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('iw_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('iw_audit_events', JSON.stringify(auditEvents));
  }, [auditEvents]);

  useEffect(() => {
    localStorage.setItem('iw_invitations', JSON.stringify(invitations));
  }, [invitations]);

  // Derived current workspace & user
  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId) || workspaces[0];
  const currentUser = users.find((u) => u.id === currentUserId) || null;
  const platformUser = PLATFORM_OPERATOR;

  // Filter scoped data to the current active workspace (Tenant isolation defense)
  const scopedCustomers = customers.filter((c) => c.workspaceId === currentWorkspace.id);
  const scopedCatalog = catalog.filter((ci) => ci.workspaceId === currentWorkspace.id);
  const scopedInvoices = invoices.filter((inv) => inv.workspaceId === currentWorkspace.id);
  const scopedPayments = payments.filter((p) => p.workspaceId === currentWorkspace.id);
  const scopedAuditEvents = auditEvents.filter((a) => a.workspaceId === currentWorkspace.id);
  const scopedInvitations = invitations.filter((inv) => inv.workspaceId === currentWorkspace.id);
  const scopedUsers = users.filter((u) => u.workspaceId === currentWorkspace.id);

  // Role permissions based on PRD Section 1.10
  const userRole: WorkspaceRole = currentUser?.role || 'viewer';
  const isSupportActive = !!activeSupportSession;

  // Platform support in active session has read-only access (no silent editing)
  const canCreateInvoice = !isSupportActive && (userRole === 'owner' || userRole === 'admin' || userRole === 'finance' || userRole === 'preparer');
  const canIssueInvoice = !isSupportActive && (userRole === 'owner' || userRole === 'admin' || userRole === 'finance');
  const canRecordPayment = !isSupportActive && (userRole === 'owner' || userRole === 'admin' || userRole === 'finance');
  const canVoidInvoice = !isSupportActive && (userRole === 'owner' || userRole === 'admin' || userRole === 'finance');
  const canManageMembers = !isSupportActive && (userRole === 'owner' || userRole === 'admin');
  const canManageSettings = !isSupportActive && (userRole === 'owner' || userRole === 'admin');
  const canExportData = true; // All authenticated roles can export data within scope
  const canTransferOwnership = !isSupportActive && userRole === 'owner';

  // Audit logging helper
  const logAuditEvent = (action: string, targetType: AuditEvent['targetType'], targetId: string, summary: string, details?: string) => {
    const actorName = isSupportActive
      ? `[Support] ${platformUser.fullName} (Ref: ${activeSupportSession?.ticketId})`
      : currentUser?.fullName || 'System';
    const actorId = isSupportActive ? platformUser.id : currentUser?.id || 'sys-actor';
    const actorRole = isSupportActive ? 'support_operator' : currentUser?.role || 'system';

    const newEvent: AuditEvent = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      workspaceId: currentWorkspace.id,
      actorId,
      actorName,
      actorRole,
      action,
      targetType,
      targetId,
      summary,
      details,
      timestamp: new Date().toISOString(),
    };

    setAuditEvents((prev) => [newEvent, ...prev]);
  };

  const login = (user: User) => {
    setCurrentUserId(user.id);
    setCurrentWorkspaceId(user.workspaceId);
    setInControlPlane(false);
  };

  const logout = () => {
    setCurrentUserId(null);
    setInControlPlane(false);
    setActiveSupportSession(null);
  };

  const registerWorkspace = (data: {
    fullName: string;
    email: string;
    workspaceName: string;
    currency: string;
  }): User => {
    const wsId = `ws-${Date.now()}`;
    const cleanWsName = data.workspaceName.trim() || 'My Business';
    const newWs: Workspace = {
      id: wsId,
      name: cleanWsName,
      legalName: `${cleanWsName} Inc.`,
      taxId: `US-94-${Math.floor(1000000 + Math.random() * 9000000)}`,
      email: data.email.trim(),
      phone: '+1 (555) 019-2834',
      address: '100 Enterprise Way, Suite 400, San Francisco, CA 94105',
      currency: data.currency || 'USD',
      invoicePrefix: `${cleanWsName.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'INV'}-`,
      nextSequenceNumber: 101,
      defaultPaymentTerms: 'net30',
      defaultTaxRate: 8.5,
      paymentInstructions: 'Bank of America · Routing: 026009593 · Acct: 994827164',
      createdAt: new Date().toISOString(),
    };

    const userId = `user-${Date.now()}`;
    const newUser: User = {
      id: userId,
      workspaceId: wsId,
      fullName: data.fullName.trim() || 'Workspace Owner',
      email: data.email.trim(),
      role: 'owner',
      emailVerified: true,
      status: 'active',
      title: 'Founder & Owner',
      mfaEnabled: false,
    };

    // Seed default customer & catalog item so newly created workspace is ready to use immediately
    const demoCust: Customer = {
      id: `cust-${Date.now()}`,
      workspaceId: wsId,
      name: 'Acme Global Ventures',
      legalName: 'Acme Global Ventures LLC',
      email: 'billing@acmeglobal.com',
      phone: '+1 (555) 432-1098',
      address: '742 Evergreen Terrace, Springfield, OR',
      taxId: 'US-94-3829102',
      status: 'active',
      createdAt: new Date().toISOString(),
    };

    const demoItem: CatalogItem = {
      id: `item-${Date.now()}`,
      workspaceId: wsId,
      name: 'Strategic Advisory & Consulting',
      description: 'Executive advisory and digital transformation services.',
      unit: 'hour',
      defaultRate: 200,
      defaultTaxRate: 8.5,
      createdAt: new Date().toISOString(),
    };

    setWorkspaces((prev) => [...prev, newWs]);
    setUsers((prev) => [...prev, newUser]);
    setCustomers((prev) => [...prev, demoCust]);
    setCatalog((prev) => [...prev, demoItem]);

    setCurrentWorkspaceId(wsId);
    setCurrentUserId(userId);
    setInControlPlane(false);

    return newUser;
  };

  const switchWorkspace = (wsId: string) => {
    const ws = workspaces.find((w) => w.id === wsId);
    if (!ws) return;
    setCurrentWorkspaceId(ws.id);
    // Find an appropriate user in that workspace or create/pick one
    const userInWs = users.find((u) => u.workspaceId === ws.id);
    if (userInWs) {
      setCurrentUserId(userInWs.id);
    }
  };

  const switchUserRole = (role: WorkspaceRole) => {
    if (!currentUser) return;
    const updatedUsers = users.map((u) => (u.id === currentUser.id ? { ...u, role } : u));
    setUsers(updatedUsers);
  };

  const selectPersona = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (targetUser) {
      setCurrentUserId(targetUser.id);
      setCurrentWorkspaceId(targetUser.workspaceId);
      setInControlPlane(false);
    }
  };

  const enterControlPlane = () => {
    setInControlPlane(true);
  };

  const exitControlPlane = () => {
    setInControlPlane(false);
  };

  const startSupportSession = (ticketId: string, reason: string) => {
    const session: SupportSession = {
      id: `sup-${Date.now()}`,
      ticketId,
      targetWorkspaceId: currentWorkspace.id,
      operatorId: platformUser.id,
      operatorName: platformUser.fullName,
      reason,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour time-limit
      active: true,
    };
    setActiveSupportSession(session);
    setInControlPlane(false);

    logAuditEvent(
      'SUPPORT_SESSION_AUTHORIZED',
      'security',
      session.id,
      `Support session initiated by ${platformUser.fullName} for ticket #${ticketId}. Reason: ${reason}`
    );
  };

  const endSupportSession = () => {
    if (activeSupportSession) {
      logAuditEvent(
        'SUPPORT_SESSION_TERMINATED',
        'security',
        activeSupportSession.id,
        `Support session #${activeSupportSession.ticketId} concluded by ${platformUser.fullName}`
      );
    }
    setActiveSupportSession(null);
  };

  // INVOICE ACTIONS
  const saveInvoiceDraft = (draft: Partial<Invoice> & { id?: string }): Invoice => {
    if (!canCreateInvoice) {
      throw new Error('Unauthorized: Current role cannot create or edit invoice drafts.');
    }

    const items = draft.items || [];
    const totals = calculateInvoiceTotals(items);
    const existing = draft.id ? invoices.find((inv) => inv.id === draft.id && inv.workspaceId === currentWorkspace.id) : null;

    if (existing && existing.documentStatus !== 'draft') {
      throw new Error('Issued or Void invoices are immutable financial records and cannot be edited.');
    }

    const customer = customers.find((c) => c.id === draft.customerId);

    const savedInvoice: Invoice = {
      id: draft.id || `inv-${Date.now()}`,
      workspaceId: currentWorkspace.id,
      invoiceNumber: existing ? existing.invoiceNumber : `DRAFT-${currentWorkspace.nextSequenceNumber}`,
      referencePo: draft.referencePo || '',
      customerId: draft.customerId || '',
      customerSnapshot: customer
        ? {
            name: customer.name,
            legalName: customer.legalName,
            email: customer.email,
            address: customer.address,
            taxId: customer.taxId,
            phone: customer.phone,
          }
        : draft.customerSnapshot || {
            name: 'Unspecified Client',
            legalName: '',
            email: '',
            address: '',
          },
      companySnapshot: {
        legalName: currentWorkspace.legalName,
        taxId: currentWorkspace.taxId,
        email: currentWorkspace.email,
        phone: currentWorkspace.phone,
        address: currentWorkspace.address,
        paymentInstructions: currentWorkspace.paymentInstructions,
      },
      issueDate: draft.issueDate || new Date().toISOString().split('T')[0],
      dueDate: draft.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: draft.currency || currentWorkspace.currency,
      items,
      subtotal: totals.subtotal,
      totalDiscount: totals.totalDiscount,
      totalTax: totals.totalTax,
      grandTotal: totals.grandTotal,
      amountPaid: existing ? existing.amountPaid : 0,
      balanceDue: round2(totals.grandTotal - (existing ? existing.amountPaid : 0)),
      documentStatus: 'draft',
      deliveryStatus: existing ? existing.deliveryStatus : 'not_sent',
      deliveryAttempts: existing ? existing.deliveryAttempts : [],
      paymentStatus: existing ? existing.paymentStatus : 'unpaid',
      notes: draft.notes || '',
      terms: draft.terms || `Payment due within 30 days. Wire details in payment instructions.`,
      createdBy: existing ? existing.createdBy : currentUser?.fullName || 'User',
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setInvoices((prev) => {
      const idx = prev.findIndex((i) => i.id === savedInvoice.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedInvoice;
        return copy;
      }
      return [savedInvoice, ...prev];
    });

    logAuditEvent(
      existing ? 'DRAFT_UPDATED' : 'DRAFT_CREATED',
      'invoice',
      savedInvoice.id,
      `${existing ? 'Updated' : 'Created'} draft invoice ${savedInvoice.invoiceNumber} for ${savedInvoice.customerSnapshot.name}`
    );

    return savedInvoice;
  };

  const issueInvoice = (invoiceId: string): { success: boolean; invoice?: Invoice; error?: string } => {
    if (!canIssueInvoice) {
      return { success: false, error: 'Unauthorized: Preparers and Viewers cannot issue invoices.' };
    }

    const target = invoices.find((inv) => inv.id === invoiceId && inv.workspaceId === currentWorkspace.id);
    if (!target) {
      return { success: false, error: 'Invoice not found in current workspace.' };
    }
    if (target.documentStatus !== 'draft') {
      return { success: false, error: `Invoice is already in state: ${target.documentStatus}.` };
    }
    if (target.items.length === 0) {
      return { success: false, error: 'Cannot issue an invoice with zero line items.' };
    }

    // Allocate immutable sequential number atomically
    const sequentialNum = `${currentWorkspace.invoicePrefix}${currentWorkspace.nextSequenceNumber}`;
    const nextSeq = currentWorkspace.nextSequenceNumber + 1;

    // Update workspace sequence
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === currentWorkspace.id ? { ...w, nextSequenceNumber: nextSeq } : w))
    );

    const issued: Invoice = {
      ...target,
      invoiceNumber: sequentialNum,
      documentStatus: 'issued',
      issuedAt: new Date().toISOString(),
      issuedBy: currentUser?.fullName || 'User',
      updatedAt: new Date().toISOString(),
    };

    setInvoices((prev) => prev.map((i) => (i.id === invoiceId ? issued : i)));

    logAuditEvent(
      'INVOICE_ISSUED',
      'invoice',
      issued.id,
      `Allocated sequential number ${sequentialNum} and issued invoice for ${issued.customerSnapshot.name} ($${issued.grandTotal.toFixed(2)})`,
      `Locked document snapshot. Sequential counter incremented to ${nextSeq}.`
    );

    return { success: true, invoice: issued };
  };

  const sendInvoiceEmail = async (
    invoiceId: string,
    recipientEmail?: string,
    simulateFailure = false
  ): Promise<{ success: boolean; message: string }> => {
    const target = invoices.find((inv) => inv.id === invoiceId && inv.workspaceId === currentWorkspace.id);
    if (!target) {
      return { success: false, message: 'Invoice not found.' };
    }

    const recipient = recipientEmail || target.customerSnapshot.email;
    if (!recipient) {
      return { success: false, message: 'Recipient email address is required.' };
    }

    // Set state to queued
    setInvoices((prev) =>
      prev.map((i) => (i.id === invoiceId ? { ...i, deliveryStatus: 'queued' } : i))
    );

    // Simulate network provider call
    await new Promise((resolve) => setTimeout(resolve, 800));

    const attemptId = `del-${Date.now()}`;
    const nowIso = new Date().toISOString();

    if (simulateFailure) {
      const failedAttempt: DeliveryAttempt = {
        id: attemptId,
        sentAt: nowIso,
        recipient,
        status: 'failed',
        errorMessage: 'SMTP 550 5.1.1: Recipient mailbox unavailable or bounced.',
      };

      setInvoices((prev) =>
        prev.map((i) =>
          i.id === invoiceId
            ? {
                ...i,
                deliveryStatus: 'failed',
                deliveryAttempts: [failedAttempt, ...(i.deliveryAttempts || [])],
              }
            : i
        )
      );

      logAuditEvent(
        'INVOICE_DELIVERY_FAILED',
        'invoice',
        invoiceId,
        `Delivery of ${target.invoiceNumber} failed to ${recipient}: SMTP 550 5.1.1`
      );

      return { success: false, message: 'Delivery failed: Recipient mailbox unavailable or bounced.' };
    }

    const successfulAttempt: DeliveryAttempt = {
      id: attemptId,
      sentAt: nowIso,
      recipient,
      status: 'sent',
      providerMessageId: `msg_${Math.random().toString(36).substring(2, 10)}`,
    };

    setInvoices((prev) =>
      prev.map((i) =>
        i.id === invoiceId
          ? {
              ...i,
              deliveryStatus: 'sent',
              deliveryAttempts: [successfulAttempt, ...(i.deliveryAttempts || [])],
            }
          : i
      )
    );

    logAuditEvent(
      'INVOICE_DELIVERED',
      'invoice',
      invoiceId,
      `Dispatched invoice ${target.invoiceNumber} via email to ${recipient}`
    );

    return { success: true, message: `Invoice sent successfully to ${recipient}.` };
  };

  const retryInvoiceDelivery = async (invoiceId: string) => {
    return sendInvoiceEmail(invoiceId, undefined, false);
  };

  const recordPayment = (
    invoiceId: string,
    amount: number,
    paymentMethod: PaymentRecord['paymentMethod'],
    reference: string,
    notes?: string
  ): { success: boolean; error?: string } => {
    if (!canRecordPayment) {
      return { success: false, error: 'Unauthorized: Current role cannot record payments.' };
    }

    const target = invoices.find((inv) => inv.id === invoiceId && inv.workspaceId === currentWorkspace.id);
    if (!target) {
      return { success: false, error: 'Invoice not found.' };
    }
    if (target.documentStatus !== 'issued') {
      return { success: false, error: 'Payments can only be applied to issued financial invoices.' };
    }

    const parsedAmount = round2(amount);
    if (parsedAmount <= 0) {
      return { success: false, error: 'Payment amount must be greater than zero.' };
    }
    if (parsedAmount > target.balanceDue + 0.001) {
      return {
        success: false,
        error: `Payment amount ($${parsedAmount.toFixed(2)}) cannot exceed outstanding balance ($${target.balanceDue.toFixed(2)}).`,
      };
    }

    const newAmountPaid = round2(target.amountPaid + parsedAmount);
    const newBalanceDue = round2(Math.max(0, target.grandTotal - newAmountPaid));
    const newPaymentStatus: PaymentStatus = newBalanceDue <= 0.001 ? 'paid' : 'partially_paid';

    // Append payment record
    const paymentRecord: PaymentRecord = {
      id: `pay-${Date.now()}`,
      workspaceId: currentWorkspace.id,
      invoiceId: target.id,
      invoiceNumber: target.invoiceNumber,
      amount: parsedAmount,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod,
      reference: reference || 'N/A',
      actorId: currentUser?.id || 'user',
      actorName: currentUser?.fullName || 'User',
      notes,
      createdAt: new Date().toISOString(),
    };

    setPayments((prev) => [paymentRecord, ...prev]);

    // Update invoice balance and status
    setInvoices((prev) =>
      prev.map((i) =>
        i.id === invoiceId
          ? {
              ...i,
              amountPaid: newAmountPaid,
              balanceDue: newBalanceDue,
              paymentStatus: newPaymentStatus,
              updatedAt: new Date().toISOString(),
            }
          : i
      )
    );

    logAuditEvent(
      'PAYMENT_RECORDED',
      'payment',
      paymentRecord.id,
      `Recorded ${newPaymentStatus === 'paid' ? 'full' : 'partial'} payment of $${parsedAmount.toFixed(2)} for ${target.invoiceNumber} (Ref: ${paymentRecord.reference})`,
      `Remaining balance: $${newBalanceDue.toFixed(2)}`
    );

    return { success: true };
  };

  const voidInvoice = (invoiceId: string, reason: string): { success: boolean; error?: string } => {
    if (!canVoidInvoice) {
      return { success: false, error: 'Unauthorized: Current role is not authorized to void issued invoices.' };
    }
    if (!reason || reason.trim().length < 5) {
      return { success: false, error: 'A clear business reason (at least 5 characters) is mandatory to void an invoice.' };
    }

    const target = invoices.find((inv) => inv.id === invoiceId && inv.workspaceId === currentWorkspace.id);
    if (!target) {
      return { success: false, error: 'Invoice not found.' };
    }
    if (target.documentStatus === 'void') {
      return { success: false, error: 'This invoice has already been voided.' };
    }

    const voided: Invoice = {
      ...target,
      documentStatus: 'void',
      balanceDue: 0.00, // Balance cleared on void
      voidReason: reason.trim(),
      voidedAt: new Date().toISOString(),
      voidedBy: currentUser?.fullName || 'User',
      updatedAt: new Date().toISOString(),
    };

    setInvoices((prev) => prev.map((i) => (i.id === invoiceId ? voided : i)));

    logAuditEvent(
      'INVOICE_VOIDED',
      'invoice',
      target.id,
      `Voided invoice ${target.invoiceNumber} ($${target.grandTotal.toFixed(2)}). Reason: ${reason.trim()}`,
      `Original line snapshots and sequential invoice number are permanently preserved for audit.`
    );

    return { success: true };
  };

  const deleteDraft = (invoiceId: string): { success: boolean; error?: string } => {
    const target = invoices.find((inv) => inv.id === invoiceId && inv.workspaceId === currentWorkspace.id);
    if (!target) return { success: false, error: 'Draft not found.' };
    if (target.documentStatus !== 'draft') {
      return { success: false, error: 'Issued and voided invoices cannot be deleted.' };
    }

    setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));

    logAuditEvent(
      'DRAFT_DELETED',
      'invoice',
      invoiceId,
      `Discarded unissued draft ${target.invoiceNumber}`
    );

    return { success: true };
  };

  // CUSTOMER ACTIONS
  const addCustomer = (data: Omit<Customer, 'id' | 'workspaceId' | 'createdAt'>): Customer => {
    const newCust: Customer = {
      ...data,
      id: `cust-${Date.now()}`,
      workspaceId: currentWorkspace.id,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [newCust, ...prev]);

    logAuditEvent('CUSTOMER_CREATED', 'customer', newCust.id, `Created customer record for ${newCust.name}`);
    return newCust;
  };

  const updateCustomer = (id: string, data: Partial<Customer>) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id && c.workspaceId === currentWorkspace.id ? { ...c, ...data } : c))
    );
    logAuditEvent('CUSTOMER_UPDATED', 'customer', id, `Updated customer profile`);
  };

  const archiveCustomer = (id: string) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id && c.workspaceId === currentWorkspace.id ? { ...c, status: 'archived' } : c))
    );
    logAuditEvent('CUSTOMER_ARCHIVED', 'customer', id, `Archived customer. Historical invoice data preserved.`);
  };

  const unarchiveCustomer = (id: string) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === id && c.workspaceId === currentWorkspace.id ? { ...c, status: 'active' } : c))
    );
    logAuditEvent('CUSTOMER_RESTORED', 'customer', id, `Restored customer to active status`);
  };

  // CATALOG ACTIONS
  const addCatalogItem = (data: Omit<CatalogItem, 'id' | 'workspaceId' | 'createdAt'>): CatalogItem => {
    const item: CatalogItem = {
      ...data,
      id: `cat-${Date.now()}`,
      workspaceId: currentWorkspace.id,
      createdAt: new Date().toISOString(),
    };
    setCatalog((prev) => [item, ...prev]);
    logAuditEvent('CATALOG_ITEM_CREATED', 'catalog', item.id, `Added catalog item: ${item.name}`);
    return item;
  };

  const updateCatalogItem = (id: string, data: Partial<CatalogItem>) => {
    setCatalog((prev) =>
      prev.map((i) => (i.id === id && i.workspaceId === currentWorkspace.id ? { ...i, ...data } : i))
    );
    logAuditEvent('CATALOG_ITEM_UPDATED', 'catalog', id, `Updated catalog item`);
  };

  const deleteCatalogItem = (id: string) => {
    setCatalog((prev) => prev.filter((i) => !(i.id === id && i.workspaceId === currentWorkspace.id)));
    logAuditEvent('CATALOG_ITEM_DELETED', 'catalog', id, `Removed item from catalog`);
  };

  // SETTINGS & TEAM ACTIONS
  const updateWorkspaceSettings = (settings: Partial<Workspace>) => {
    if (!canManageSettings) return;
    setWorkspaces((prev) =>
      prev.map((w) => (w.id === currentWorkspace.id ? { ...w, ...settings } : w))
    );
    logAuditEvent('WORKSPACE_SETTINGS_UPDATED', 'settings', currentWorkspace.id, `Updated company configuration and invoice defaults`);
  };

  const inviteMember = (email: string, role: WorkspaceRole): { success: boolean; invitation?: WorkspaceInvitation; error?: string } => {
    if (!canManageMembers) {
      return { success: false, error: 'Unauthorized to invite team members.' };
    }
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Valid email address is required.' };
    }

    const invitation: WorkspaceInvitation = {
      id: `inv-tok-${Date.now()}`,
      workspaceId: currentWorkspace.id,
      email: email.trim().toLowerCase(),
      role,
      invitedBy: currentUser?.fullName || 'Admin',
      token: `sec_tok_${Math.random().toString(36).substring(2, 10)}`,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
    };

    setInvitations((prev) => [invitation, ...prev]);

    logAuditEvent(
      'MEMBER_INVITED',
      'member',
      invitation.id,
      `Sent workspace invitation to ${invitation.email} for role: ${role.toUpperCase()}`
    );

    return { success: true, invitation };
  };

  const updateMemberRole = (userId: string, newRole: WorkspaceRole): { success: boolean; error?: string } => {
    if (!canManageMembers) {
      return { success: false, error: 'Unauthorized to modify member roles.' };
    }

    const targetUser = users.find((u) => u.id === userId && u.workspaceId === currentWorkspace.id);
    if (!targetUser) return { success: false, error: 'Member not found.' };

    if (targetUser.role === 'owner' && newRole !== 'owner') {
      return { success: false, error: 'The primary owner role cannot be demoted directly. Use ownership transfer.' };
    }

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
    );

    logAuditEvent(
      'MEMBER_ROLE_CHANGED',
      'member',
      userId,
      `Changed role for ${targetUser.fullName} from ${targetUser.role} to ${newRole}`
    );

    return { success: true };
  };

  const toggleMemberStatus = (userId: string): { success: boolean; error?: string } => {
    if (!canManageMembers) {
      return { success: false, error: 'Unauthorized to modify member status.' };
    }

    const targetUser = users.find((u) => u.id === userId && u.workspaceId === currentWorkspace.id);
    if (!targetUser) return { success: false, error: 'Member not found.' };

    if (targetUser.role === 'owner') {
      return { success: false, error: 'Cannot deactivate the primary workspace owner.' };
    }

    const newStatus = targetUser.status === 'active' ? 'deactivated' : 'active';
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );

    logAuditEvent(
      newStatus === 'deactivated' ? 'MEMBER_DEACTIVATED' : 'MEMBER_REACTIVATED',
      'member',
      userId,
      `${newStatus === 'deactivated' ? 'Deactivated' : 'Reactivated'} member access for ${targetUser.fullName}`
    );

    return { success: true };
  };

  const transferOwnership = (newOwnerId: string): { success: boolean; error?: string } => {
    if (!canTransferOwnership) {
      return { success: false, error: 'Only the current workspace owner can initiate ownership transfer.' };
    }

    const newOwner = users.find((u) => u.id === newOwnerId && u.workspaceId === currentWorkspace.id);
    if (!newOwner) return { success: false, error: 'Target user not found.' };

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === currentUser?.id) return { ...u, role: 'admin' as WorkspaceRole };
        if (u.id === newOwnerId) return { ...u, role: 'owner' as WorkspaceRole };
        return u;
      })
    );

    logAuditEvent(
      'OWNERSHIP_TRANSFERRED',
      'security',
      currentWorkspace.id,
      `Workspace ownership transferred from ${currentUser?.fullName} to ${newOwner.fullName}`
    );

    return { success: true };
  };

  return (
    <WorkspaceContext.Provider
      value={{
        currentWorkspace,
        workspaces,
        currentUser,
        platformUser,
        inControlPlane,
        activeSupportSession,
        users: scopedUsers,
        customers: scopedCustomers,
        catalog: scopedCatalog,
        invoices: scopedInvoices,
        payments: scopedPayments,
        auditEvents: scopedAuditEvents,
        invitations: scopedInvitations,
        canCreateInvoice,
        canIssueInvoice,
        canRecordPayment,
        canVoidInvoice,
        canManageMembers,
        canManageSettings,
        canExportData,
        canTransferOwnership,
        login,
        logout,
        registerWorkspace,
        switchWorkspace,
        switchUserRole,
        selectPersona,
        enterControlPlane,
        exitControlPlane,
        startSupportSession,
        endSupportSession,
        saveInvoiceDraft,
        issueInvoice,
        sendInvoiceEmail,
        retryInvoiceDelivery,
        recordPayment,
        voidInvoice,
        deleteDraft,
        addCustomer,
        updateCustomer,
        archiveCustomer,
        unarchiveCustomer,
        addCatalogItem,
        updateCatalogItem,
        deleteCatalogItem,
        updateWorkspaceSettings,
        inviteMember,
        updateMemberRole,
        toggleMemberStatus,
        transferOwnership,
        logAuditEvent,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
