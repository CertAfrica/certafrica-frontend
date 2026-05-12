export type Role = "USER" | "ADMIN";
export type PlanType = "FREE" | "STARTER" | "PRO";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  plan: PlanType;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface StoredAuth extends AuthResponse {
  savedAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  balance: string | number;
  currency: string;
  accountNumber?: string | null;
  bankName?: string | null;
  providerCustomerId?: string | null;
  transactions?: WalletTransaction[];
  createdAt: string;
  updatedAt: string;
}

export type WalletTransactionType = "TOPUP" | "SCAN_DEDUCTION" | "REFUND" | "ROLLOVER_ADJUSTMENT" | "BULK_SCAN_CHARGE";

export interface WalletTransaction {
  id: string;
  walletId: string;
  userId: string;
  scanId?: string | null;
  type: WalletTransactionType;
  amount: string | number;
  currency: string;
  balanceBefore: string | number;
  balanceAfter: string | number;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export type ScanStatus = "PENDING_PAYMENT" | "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "REFUNDED";
export type PaymentStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
export type VerificationStatus = "PENDING" | "PROCESSING" | "VERIFIED" | "FAILED" | "INCONCLUSIVE" | "FLAGGED";
export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
export type TransactionType = "SCAN_PURCHASE" | "WALLET_TOPUP" | "SUBSCRIPTION" | "BULK_SCAN" | "REFUND";

export interface Transaction {
  id: string;
  userId: string;
  scanId?: string | null;
  type: TransactionType;
  status: TransactionStatus;
  reference: string;
  amount: string | number;
  currency: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Refund {
  id: string;
  userId: string;
  scanId: string;
  transactionId?: string | null;
  amount: string | number;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  reason: string;
  providerReference?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Scan {
  id: string;
  scanCode: string;
  userId: string;
  fileUrl: string;
  fileName: string;
  fileMimeType: string;
  status: ScanStatus;
  paymentStatus: PaymentStatus;
  verificationStatus: VerificationStatus;
  trustScore?: number | null;
  ocrData?: Record<string, unknown> | null;
  anomalyData?: Record<string, unknown> | null;
  heatmapUrl?: string | null;
  reportUrl?: string | null;
  paymentRequired: boolean;
  price: string | number;
  refunded: boolean;
  flagged: boolean;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  transaction?: Transaction | null;
  refund?: Refund | null;
}

export interface PagedScans {
  items: Scan[];
  total: number;
  page: number;
  limit: number;
}

export interface ScanSubmissionResponse {
  scan: Scan;
  paymentRequired: boolean;
  transaction: Transaction | null;
  pricing: {
    plan: PlanType;
    price: number;
    currency: string;
    walletBalance: number;
    monthlyUsed: number;
    monthlyLimit: number;
    rolloverBalance: number;
    monthKey: string;
    resetAt: string;
  };
}

export interface ScanUsageSummary {
  plan: PlanType;
  monthKey: string;
  monthlyLimit: number;
  monthlyUsed: number;
  monthlyRemaining: number;
  rolloverBalance: number;
  rolloverUsed: number;
  paidScans: number;
  resetAt: string;
}

export interface BulkPricing {
  unitPrice: number;
  discountRate: number;
  total: number;
}

export interface BulkScanResponse {
  bulkTransaction: {
    id: string;
    totalScans: number;
    unitPrice: number;
    totalAmount: number;
    status: TransactionStatus;
  };
  paymentRequired: boolean;
  transaction: Transaction | null;
  checkout?: Record<string, unknown> | null;
  pricing: {
    unitPrice: number;
    discountRate: number;
    total: number;
    paidCount: number;
  };
  scansCreated: number;
}

export interface BillingHistoryItem {
  id: string;
  plan: PlanType;
  amount: string | number;
  currency: string;
  status: TransactionStatus;
  providerReference?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface PaymentCheckoutResponse {
  transaction: Transaction;
  checkout: Record<string, unknown>;
  plan?: PlanType;
  amount?: number;
}
