import { CheckCircle2, Clock3, XCircle } from "lucide-react";

export function formatCurrency(value: string | number | undefined, currency = "NGN") {
  const amount = typeof value === "string" ? Number.parseFloat(value) : value ?? 0;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function statusTone(status: string) {
  if (status === "VERIFIED" || status === "COMPLETED" || status === "SUCCESS") {
    return { color: "#12A37B", bg: "rgba(18,163,123,0.08)", border: "rgba(18,163,123,0.18)", icon: CheckCircle2 };
  }

  if (status === "PROCESSING" || status === "PENDING" || status === "PENDING_PAYMENT" || status === "QUEUED") {
    return { color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.18)", icon: Clock3 };
  }

  return { color: "#EF4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.18)", icon: XCircle };
}
