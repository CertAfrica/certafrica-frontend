import { readStoredAuth } from "./auth";
import type {
  AuthResponse,
  BillingHistoryItem,
  BulkPricing,
  BulkScanResponse,
  PaymentCheckoutResponse,
  PagedScans,
  Scan,
  ScanUsageSummary,
  ScanSubmissionResponse,
  Wallet,
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: Record<string, unknown> | FormData | string | undefined;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const auth = readStoredAuth();
  const headers = new Headers(options.headers);

  if (auth?.accessToken) {
    headers.set("Authorization", `Bearer ${auth.accessToken}`);
  }

  let body = options.body;
  if (body && !(body instanceof FormData) && typeof body !== "string") {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    body,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const responsePayload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : await response.text().catch(() => "");

  if (!response.ok) {
    const message =
      (typeof responsePayload === "object" && responsePayload && "message" in responsePayload && String((responsePayload as { message?: unknown }).message)) ||
      (typeof responsePayload === "object" && responsePayload && "error" in responsePayload && String((responsePayload as { error?: unknown }).error)) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, responsePayload);
  }

  return responsePayload as T;
}

export const api = {
  signup: (payload: { name: string; email: string; password: string }) =>
    apiRequest<AuthResponse>("/api/auth/signup", { method: "POST", body: payload }),

  login: (payload: { email: string; password: string }) =>
    apiRequest<AuthResponse>("/api/auth/login", { method: "POST", body: payload }),

  refresh: (payload: { refreshToken: string }) =>
    apiRequest<{ accessToken: string; refreshToken: string }>("/api/auth/refresh", { method: "POST", body: payload }),

  resendVerification: (payload: { email: string }) =>
    apiRequest<{ sent: boolean }>("/api/auth/resend-verification", { method: "POST", body: payload }),

  verifyEmail: (payload: { email: string; token: string }) =>
    apiRequest<{ verified: boolean }>("/api/auth/verify-email", { method: "POST", body: payload }),

  getWallet: () => apiRequest<Wallet>("/api/wallet", { method: "GET" }),

  topupWallet: (amount: number) =>
    apiRequest<PaymentCheckoutResponse>("/api/wallet/topup", { method: "POST", body: { amount } }),

  submitScan: (file: File) => {
    const formData = new FormData();
    formData.append("certificate", file);
    return apiRequest<ScanSubmissionResponse>("/api/scans/verify", {
      method: "POST",
      body: formData,
    });
  },

  getScanUsage: () => apiRequest<ScanUsageSummary>("/api/scans/usage", { method: "GET" }),

  getBulkPricing: (count: number) => apiRequest<BulkPricing>(`/api/scans/bulk-pricing?count=${count}`, { method: "GET" }),

  submitBulkScans: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("certificates", file));
    return apiRequest<BulkScanResponse>("/api/scans/bulk-verify", { method: "POST", body: formData });
  },

  getScans: (page = 1, limit = 20) =>
    apiRequest<PagedScans>(`/api/scans?page=${page}&limit=${limit}`, { method: "GET" }),

  getScan: (id: string) => apiRequest<Scan>(`/api/scans/${id}`, { method: "GET" }),

  initializePayment: (payload: { type: "scan" | "wallet_topup"; scanId?: string; amount?: number; plan?: "STARTER" | "PRO" }) =>
    apiRequest<PaymentCheckoutResponse>("/api/payments/initialize", { method: "POST", body: payload }),

  verifyPayment: (transactionRef: string) =>
    apiRequest<{ processed: boolean; alreadyProcessed?: boolean; paymentStatus?: string }>(`/api/payments/verify/${transactionRef}`, { method: "GET" }),

  upgradeSubscription: (plan: "STARTER" | "PRO") =>
    apiRequest<PaymentCheckoutResponse>("/api/subscriptions/upgrade", { method: "POST", body: { plan } }),

  getBillingHistory: () => apiRequest<{ items: BillingHistoryItem[] }>("/api/billing/history", { method: "GET" }),

  inviteTeamMember: (payload: { email: string; role?: "OWNER" | "ADMIN" | "REVIEWER" }) =>
    apiRequest<{ organization: Record<string, unknown>; member: Record<string, unknown> }>("/api/team/invite", { method: "POST", body: payload }),
};

export function extractCheckoutUrl(checkout: Record<string, unknown> | null | undefined) {
  if (!checkout || typeof checkout !== "object") return null;

  const candidates = [
    "authorization_url",
    "authorizationUrl",
    "checkout_url",
    "checkoutUrl",
    "url",
    "paymentUrl",
    "payment_url",
  ];

  // Search the top level, then a nested `data` object (Squad nests it there).
  const scopes: Record<string, unknown>[] = [checkout];
  const data = checkout["data"];
  if (data && typeof data === "object") {
    scopes.push(data as Record<string, unknown>);
  }

  for (const scope of scopes) {
    for (const key of candidates) {
      const value = scope[key];
      if (typeof value === "string" && value.length > 0) return value;
    }
  }

  return null;
}