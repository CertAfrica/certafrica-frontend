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

export interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  role: Role;
  plan: PlanType;
  createdAt: string;
  wallet?: Wallet | null;
  subscriptions?: Array<{
    id: string;
    plan?: PlanType;
    status?: string;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
  }>;
}

export interface AdminScanRecord {
  id: string;
  scanCode: string;
  fileName: string;
  status: ScanStatus;
  paymentStatus: PaymentStatus;
  verificationStatus: VerificationStatus;
  trustScore?: number | null;
  flagged: boolean;
  createdAt: string;
  updatedAt: string;
  user?: Pick<AuthUser, "id" | "name" | "email" | "plan"> | null;
  transaction?: Transaction | null;
  refund?: Refund | null;
}

export interface AdminRefundRecord {
  id: string;
  amount: string | number;
  status: Refund["status"];
  reason: string;
  createdAt: string;
  updatedAt: string;
  user?: Pick<AuthUser, "id" | "name" | "email" | "plan"> | null;
  scan?: Pick<Scan, "id" | "scanCode" | "fileName" | "verificationStatus"> | null;
}

export interface PagedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface TrainingStatsResponse {
  samples_per_label: Record<string, number>;
  total_samples: number;
  visual_references_per_label: Record<string, number>;
  total_visual_references: number;
  last_trained_at: string | null;
  model_exists: boolean;
}

export interface TrainingUploadResponse {
  sample_id: string;
  label: string;
  extracted_text_preview: string;
  total_samples_for_label: number;
  retrained: boolean;
  visual_indexed: boolean;
}

export interface RetrainResponse {
  trained: boolean;
  reason?: string;
  total_samples?: number;
  label_distribution?: Record<string, number>;
}
