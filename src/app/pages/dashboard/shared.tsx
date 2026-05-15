import { LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { CheckCircle2, ChevronRight, Clock3, FileText, XCircle } from "lucide-react";
import { motion } from "motion/react";
import type { Scan } from "../../lib/types";

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
  if (
    status === "PROCESSING" ||
    status === "PENDING" ||
    status === "PENDING_PAYMENT" ||
    status === "QUEUED"
  ) {
    return { color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.18)", icon: Clock3 };
  }
  return { color: "#EF4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.18)", icon: XCircle };
}

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = "#12A37B",
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  accent?: string;
  hint?: string;
}) {
  return (
    <div
      className="rounded-3xl p-5"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon size={16} color={accent} />
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "9px",
            color: "rgba(176,196,222,0.34)",
            letterSpacing: "0.08em",
          }}
        >
          LIVE
        </span>
      </div>
      <div
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "1.8rem",
          color: accent,
          lineHeight: 1,
          marginBottom: "6px",
        }}
      >
        {value}
      </div>
      <div style={{ color: "#F0F6FF", fontSize: "12.5px", fontWeight: 600 }}>{label}</div>
      {hint && (
        <div style={{ color: "rgba(176,196,222,0.55)", fontSize: "11px", marginTop: "4px" }}>{hint}</div>
      )}
    </div>
  );
}

export function ProgressBar({
  value,
  max,
  color = "#12A37B",
  label,
  rightLabel,
}: {
  value: number;
  max: number;
  color?: string;
  label?: string;
  rightLabel?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div>
      {(label || rightLabel) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span style={{ color: "rgba(176,196,222,0.7)", fontSize: "12px" }}>{label}</span>
          )}
          {rightLabel && (
            <span style={{ color: "#F0F6FF", fontSize: "12px", fontWeight: 600 }}>{rightLabel}</span>
          )}
        </div>
      )}
      <div
        style={{
          height: "6px",
          borderRadius: "999px",
          background: "rgba(255,255,255,0.05)",
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ height: "100%", borderRadius: "inherit", background: color }}
        />
      </div>
    </div>
  );
}

export function ScanRow({ scan, index = 0 }: { scan: Scan; index?: number }) {
  const tone = statusTone(scan.verificationStatus);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="rounded-2xl p-4"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex-1 min-w-[220px]">
          <div className="flex items-center gap-2 mb-2">
            <FileText size={14} color="#12A37B" />
            <div style={{ color: "#F0F6FF", fontSize: "13px", fontWeight: 600 }}>{scan.fileName}</div>
          </div>
          <div className="text-xs space-y-1" style={{ color: "rgba(176,196,222,0.56)" }}>
            <div>Scan code: {scan.scanCode}</div>
            <div>Payment: {scan.paymentStatus}</div>
          </div>
        </div>
        <div className="text-right">
          <div
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5"
            style={{
              background: tone.bg,
              border: `1px solid ${tone.border}`,
              color: tone.color,
              fontSize: "10px",
              letterSpacing: "0.08em",
            }}
          >
            <tone.icon size={10} />
            {scan.verificationStatus}
          </div>
          <div style={{ color: "rgba(176,196,222,0.45)", fontSize: "10px", marginTop: "8px" }}>
            {new Date(scan.createdAt).toLocaleString()}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 mt-4">
        <div style={{ color: "rgba(176,196,222,0.6)", fontSize: "12px" }}>
          {scan.trustScore !== null && scan.trustScore !== undefined
            ? `Trust score ${Math.round(scan.trustScore)}`
            : "Awaiting analysis"}
        </div>
        <Link
          to={`/results/${scan.id}`}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 no-underline"
          style={{
            background: "rgba(18,163,123,0.1)",
            border: "1px solid rgba(18,163,123,0.18)",
            color: "#12A37B",
            fontSize: "12px",
          }}
        >
          Open report
          <ChevronRight size={14} />
        </Link>
      </div>
    </motion.div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { label: string; to: string };
}) {
  return (
    <div
      className="rounded-2xl p-6 text-center"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.08)" }}
    >
      <div style={{ color: "#F0F6FF", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>
        {title}
      </div>
      <p style={{ color: "rgba(176,196,222,0.62)", fontSize: "12.5px", marginBottom: action ? "16px" : 0 }}>
        {description}
      </p>
      {action && (
        <Link
          to={action.to}
          className="inline-flex items-center gap-2 rounded-xl px-4 py-2 no-underline"
          style={{
            background: "rgba(18,163,123,0.1)",
            border: "1px solid rgba(18,163,123,0.18)",
            color: "#12A37B",
            fontSize: "12px",
          }}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function DashboardSummary(scans: Scan[]) {
  const verified = scans.filter((s) => s.verificationStatus === "VERIFIED").length;
  const flagged = scans.filter((s) => s.verificationStatus === "FLAGGED" || s.verificationStatus === "FAILED").length;
  const processing = scans.filter((s) => s.status === "QUEUED" || s.status === "PROCESSING").length;
  const average = scans.length
    ? Math.round(
        scans.reduce((total, scan) => total + (typeof scan.trustScore === "number" ? scan.trustScore : 0), 0) /
          scans.length,
      )
    : 0;
  return { verified, flagged, processing, average };
}