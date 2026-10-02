export type WorkspaceRole = 'owner' | 'admin' | 'finance' | 'preparer' | 'viewer';

export type PlatformRole = 'support_operator' | 'ops_admin' | 'security_admin' | 'break_glass';

export type DocumentStatus = 'draft' | 'issued' | 'void';
export type DeliveryStatus = 'not_sent' | 'queued' | 'sent' | 'failed';
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid';

export interface Workspace {
  id: string;
  name: string;
  legalName: string;
  taxId: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  invoicePrefix: string;
  nextSequenceNumber: number;
  defaultPaymentTerms: 'due_on_receipt' | 'net15' | 'net30' | 'net60';
  defaultTaxRate: number;
  paymentInstructions: string;
  createdAt: string;
}

export interface User {
  id: string;
  workspaceId: string;
  email: string;
  fullName: string;
  role: WorkspaceRole;
  avatarUrl?: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  status: 'active' | 'deactivated';
  title?: string;
}

export interface PlatformUser {
  id: string;
  email: string;
  fullName: string;
  role: PlatformRole;
  mfaVerified: boolean;
}

export interface Customer {
  id: string;
  workspaceId: string;
  name: string;
  legalName: string;
  email: string;
  phone: string;
  address: string;
  taxId?: string;
  status: 'active' | 'archived';
  notes?: string;
  createdAt: string;
}

export interface CatalogItem {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  unit: 'hour' | 'day' | 'item' | 'service' | 'month';
  defaultRate: number;
  defaultTaxRate: number;
  createdAt: string;
}

export interface InvoiceLineItem {
  id: string;
  catalogItemId?: string;
  description: string;
  unit: string;
  quantity: number;
  unitRate: number;
  discountPercent: number;
  taxPercent: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  lineTotal: number;
}

export interface DeliveryAttempt {
  id: string;
  sentAt: string;
  recipient: string;
  status: 'sent' | 'failed' | 'queued';
  errorMessage?: string;
  providerMessageId?: string;
}

export interface Invoice {
  id: string;
  workspaceId: string;
  invoiceNumber: string; // assigned upon issue, e.g. "INV-2026-001" or "DRAFT-XXXX"
  referencePo?: string;
  customerId: string;
  customerSnapshot: {
    name: string;
    legalName: string;
    email: string;
    address: string;
    taxId?: string;
    phone?: string;
  };
  companySnapshot: {
    legalName: string;
    taxId: string;
    email: string;
    phone: string;
    address: string;
    paymentInstructions: string;
  };
  issueDate: string; // YYYY-MM-DD
  dueDate: string;   // YYYY-MM-DD
  currency: string;
  items: InvoiceLineItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  amountPaid: number;
  balanceDue: number;
  documentStatus: DocumentStatus;
  deliveryStatus: DeliveryStatus;
  deliveryAttempts: DeliveryAttempt[];
  paymentStatus: PaymentStatus;
  notes?: string;
  terms?: string;
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
  issuedAt?: string;
  issuedBy?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentRecord {
  id: string;
  workspaceId: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'bank_transfer' | 'credit_card' | 'check' | 'ach' | 'other';
  reference: string;
  actorId: string;
  actorName: string;
  notes?: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  workspaceId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetType: 'invoice' | 'payment' | 'customer' | 'catalog' | 'member' | 'settings' | 'security';
  targetId: string;
  summary: string;
  details?: string;
  timestamp: string; // UTC ISO string
}

export interface WorkspaceInvitation {
  id: string;
  workspaceId: string;
  email: string;
  role: WorkspaceRole;
  invitedBy: string;
  token: string;
  status: 'pending' | 'accepted' | 'revoked';
  expiresAt: string;
  createdAt: string;
}

export interface SupportSession {
  id: string;
  ticketId: string;
  targetWorkspaceId: string;
  operatorId: string;
  operatorName: string;
  reason: string;
  startedAt: string;
  expiresAt: string;
  active: boolean;
}
