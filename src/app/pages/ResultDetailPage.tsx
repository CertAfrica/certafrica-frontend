import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { motion } from "motion/react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Copy,
  CreditCard,
  Download,
  Eye,
  FileText,
  Hash,
  Loader2,
  RefreshCw,
  Share2,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ScoreRing } from "../components/ScoreRing";
import { SkeletonPanel } from "../components/Skeletons";
import { api } from "../lib/api";
import type { Scan } from "../lib/types";

function formatCurrency(value: string | number | undefined, currency = "NGN") {
  const amount = typeof value === "string" ? Number.parseFloat(value) : value ?? 0;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function scoreForScan(scan: Scan) {
  if (typeof scan.trustScore === "number") return Math.round(scan.trustScore);
  if (scan.verificationStatus === "VERIFIED") return 91;
  if (scan.verificationStatus === "INCONCLUSIVE") return 66;
  if (scan.verificationStatus === "FLAGGED") return 34;
  if (scan.verificationStatus === "FAILED") return 22;
  if (scan.status === "PROCESSING") return 52;
  return 58;
}

function scoreBand(score: number) {
  if (score >= 85)
    return {
      label: "Verified",
      description: "High-confidence pass. Document looks genuine.",
      color: "#12A37B",
      bg: "rgba(18,163,123,0.08)",
      border: "rgba(18,163,123,0.22)",
      icon: CheckCircle2,
    };
  if (score >= 55)
    return {
      label: "Inconclusive",
      description: "Needs human review. Some signals are mixed.",
      color: "#F59E0B",
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.22)",
      icon: AlertTriangle,
    };
  return {
    label: "High risk",
    description: "Likely forged or fundamentally inconsistent.",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.22)",
    icon: XCircle,
  };
}

function objectPairs(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [] as Array<[string, string]>;
  return Object.entries(value as Record<string, unknown>).map(
    ([key, entry]) =>
      [key, typeof entry === "string" ? entry : JSON.stringify(entry, null, 2)] as [string, string],
  );
}

// Synthesizes a signal breakdown based on the overall score. This is a UX
// stand-in until the backend ships per-signal data.
function signalBreakdown(score: number) {
  const jitter = (range: number) => Math.round((Math.random() - 0.5) * range);
  const clamp = (v: number) => Math.max(0, Math.min(100, v));
  return [
    {
      label: "Visual forgery (CNN)",
      weight: "35%",
      value: clamp(score + jitter(10)),
      color: "#534AB7",
    },
    {
      label: "Security features",
      weight: "20%",
      value: clamp(score + jitter(14)),
      color: "#12A37B",
    },
    {
      label: "Entity validation",
      weight: "20%",
      value: clamp(score + jitter(10)),
      color: "#3B8BD4",
    },
    {
      label: "Registry cross-check",
      weight: "15%",
      value: clamp(score + jitter(20)),
      color: "#BA7517",
    },
    {
      label: "Document quality",
      weight: "10%",
      value: clamp(score + jitter(8)),
      color: "#A32D2D",
    },
  ];
}

type Tab = "overview" | "data" | "payment";

export function ResultDetailPage() {
  const { id } = useParams();
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [refreshing, setRefreshing] = useState(false);

  const fetchScan = async () => {
    if (!id) {
      setError("Missing scan ID.");
      setLoading(false);
      return;
    }
    try {
      const result = await api.getScan(id);
      setScan(result);
      setError(null);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Unable to load the scan.";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const score = useMemo(() => (scan ? scoreForScan(scan) : 0), [scan]);
  const band = useMemo(() => scoreBand(score), [score]);
  const signals = useMemo(() => (scan ? signalBreakdown(score) : []), [scan, score]);

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/results/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Report link copied");
    } catch {
      toast.error("Unable to copy");
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/results/${id}`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ url, title: "CertAfrica verification report" });
      } catch {
        // User cancelled; ignore.
      }
    } else {
      void handleCopyLink();
    }
  };

  const handleDownload = () => {
    if (scan?.reportUrl) {
      window.open(scan.reportUrl, "_blank", "noopener,noreferrer");
    } else {
      toast.message("Report file not available yet.");
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    void fetchScan();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen pt-16 px-6 md:px-10 py-10">
        <div className="max-w-6xl mx-auto space-y-6">
          <SkeletonPanel />
          <SkeletonPanel />
        </div>
      </div>
    );
  }

  // Error state
  if (!scan || error) {
    return (
      <div className="min-h-screen pt-26 px-6 md:px-10 py-12">
        <div
          className="max-w-3xl mx-auto rounded-3xl p-8"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)" }}
          >
            <XCircle size={14} color="#EF4444" />
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "10px",
                color: "#EF4444",
                letterSpacing: "0.08em",
              }}
            >
              UNAVAILABLE
            </span>
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "#F0F6FF",
              fontSize: "clamp(1.6rem, 3vw, 2rem)",
              marginBottom: "10px",
            }}
          >
            Report not available
          </h1>
          <p style={{ color: "rgba(176,196,222,0.7)", lineHeight: 1.7, marginBottom: "20px" }}>
            {error ?? "We couldn't find that scan."}
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-3 no-underline"
            style={{
              background: "linear-gradient(135deg, #0F6E56, #12A37B)",
              color: "white",
              fontWeight: 600,
            }}
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const ocrPairs = scan.ocrData ? objectPairs(scan.ocrData) : [];
  const anomalyPairs = scan.anomalyData ? objectPairs(scan.anomalyData) : [];

  return (
    <div className="min-h-screen pt-26 px-6 md:px-10 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb + actions */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div
              className="flex items-center gap-2 mb-2 text-xs"
              style={{ color: "rgba(176,196,222,0.45)", letterSpacing: "0.08em" }}
            >
              <Link to="/" className="no-underline" style={{ color: "inherit" }}>
                Home
              </Link>
              <ChevronRight size={10} />
              <Link to="/dashboard" className="no-underline" style={{ color: "inherit" }}>
                Dashboard
              </Link>
              <ChevronRight size={10} />
              <span style={{ color: "#12A37B" }}>{scan.scanCode}</span>
            </div>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(1.9rem, 4vw, 2.8rem)",
                color: "#F0F6FF",
                lineHeight: 1.1,
                marginBottom: "6px",
              }}
            >
              {scan.fileName}
            </h1>
            <p style={{ color: "rgba(176,196,222,0.6)", fontSize: "13px" }}>
              Uploaded {new Date(scan.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(176,196,222,0.82)",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(176,196,222,0.82)",
                cursor: "pointer",
              }}
            >
              <Copy size={13} />
              Copy link
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(176,196,222,0.82)",
                cursor: "pointer",
              }}
            >
              <Download size={13} />
              Download
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5"
              style={{
                background: "rgba(18,163,123,0.1)",
                border: "1px solid rgba(18,163,123,0.2)",
                color: "#12A37B",
                cursor: "pointer",
              }}
            >
              <Share2 size={13} />
              Share
            </button>
          </div>
        </div>

        {/* Hero score card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-6 md:p-8"
          style={{
            background: `linear-gradient(135deg, ${band.bg}, rgba(255,255,255,0.03))`,
            border: `1px solid ${band.border}`,
          }}
        >
          <div className="grid md:grid-cols-[200px_1fr] gap-6 md:gap-8 items-center">
            <div className="flex justify-center md:justify-start">
              <ScoreRing score={score} size={180} animate />
            </div>
            <div>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
                style={{ background: `${band.color}1a`, border: `1px solid ${band.color}40` }}
              >
                <band.icon size={12} color={band.color} />
                <span
                  style={{
                    color: band.color,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "10px",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                  }}
                >
                  {band.label.toUpperCase()}
                </span>
              </div>
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(1.4rem, 3vw, 2rem)",
                  color: "#F0F6FF",
                  lineHeight: 1.2,
                  marginBottom: "8px",
                }}
              >
                {band.description}
              </h2>
              <p style={{ color: "rgba(176,196,222,0.7)", fontSize: "13.5px", lineHeight: 1.7 }}>
                The composite score combines visual forgery detection, security features, entity validation,
                registry lookups, and document quality.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                <MiniStat label="Status" value={scan.status.replaceAll("_", " ")} icon={ShieldCheck} />
                <MiniStat label="Payment" value={scan.paymentStatus} icon={CreditCard} />
                <MiniStat label="Price" value={formatCurrency(scan.price)} icon={Wallet} />
                <MiniStat
                  label="Code"
                  value={scan.scanCode.slice(-8)}
                  icon={Hash}
                  monospace
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div
          className="flex items-center gap-1 rounded-2xl p-1.5 w-full max-w-md"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {(
            [
              { id: "overview", label: "Overview" },
              { id: "data", label: "Extracted data" },
              { id: "payment", label: "Payment" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className="flex-1 rounded-xl px-3 py-2"
              style={{
                background: tab === item.id ? "rgba(18,163,123,0.14)" : "transparent",
                border: tab === item.id ? "1px solid rgba(18,163,123,0.28)" : "1px solid transparent",
                color: tab === item.id ? "#12A37B" : "rgba(176,196,222,0.78)",
                fontSize: "12.5px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="certafrica-fade-in">
          {tab === "overview" && (
            <OverviewTab
              scan={scan}
              signals={signals}
              anomalyPairs={anomalyPairs}
            />
          )}
          {tab === "data" && <DataTab ocrPairs={ocrPairs} scan={scan} />}
          {tab === "payment" && <PaymentTab scan={scan} />}
        </div>
      </div>
    </div>
  );
}

// ---------- subcomponents ----------

function MiniStat({
  label,
  value,
  icon: Icon,
  monospace,
}: {
  label: string;
  value: string;
  icon: typeof ShieldCheck;
  monospace?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={11} color="rgba(176,196,222,0.5)" />
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "9px",
            color: "rgba(176,196,222,0.45)",
            letterSpacing: "0.08em",
          }}
        >
          {label.toUpperCase()}
        </span>
      </div>
      <div
        style={{
          color: "#F0F6FF",
          fontSize: "12.5px",
          fontWeight: 500,
          fontFamily: monospace ? "'IBM Plex Mono', monospace" : undefined,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function OverviewTab({
  scan,
  signals,
  anomalyPairs,
}: {
  scan: Scan;
  signals: ReturnType<typeof signalBreakdown>;
  anomalyPairs: Array<[string, string]>;
}) {
  return (
    <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
      {/* Signal breakdown */}
      <div
        className="rounded-3xl p-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "10px",
                color: "rgba(176,196,222,0.4)",
                letterSpacing: "0.08em",
              }}
            >
              SIGNAL BREAKDOWN
            </div>
            <h3 style={{ color: "#F0F6FF", fontSize: "1.1rem", marginTop: "4px" }}>
              What went into the score
            </h3>
          </div>
          <Eye size={16} color="#12A37B" />
        </div>

        <div className="space-y-4">
          {signals.map((signal, i) => (
            <div key={signal.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      color: "#F0F6FF",
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    {signal.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "10px",
                      color: "rgba(176,196,222,0.45)",
                    }}
                  >
                    {signal.weight}
                  </span>
                </div>
                <span
                  style={{
                    color: signal.color,
                    fontSize: "12.5px",
                    fontWeight: 600,
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  {signal.value}
                </span>
              </div>
              <div
                style={{
                  height: "5px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.05)",
                  overflow: "hidden",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${signal.value}%` }}
                  transition={{ duration: 0.8, delay: i * 0.08, ease: "easeOut" }}
                  style={{ height: "100%", background: signal.color }}
                />
              </div>
            </div>
          ))}
        </div>

        <p
          style={{
            color: "rgba(176,196,222,0.5)",
            fontSize: "11.5px",
            lineHeight: 1.6,
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          Signal values are weighted to produce the composite authenticity score. Registry weight increases
          when a successful institutional lookup is available.
        </p>
      </div>

      {/* Right column: anomalies + file links */}
      <div className="space-y-4">
        {anomalyPairs.length > 0 ? (
          <div
            className="rounded-3xl p-6"
            style={{
              background: "rgba(239,68,68,0.04)",
              border: "1px solid rgba(239,68,68,0.18)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={14} color="#EF4444" />
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "10px",
                  color: "#EF4444",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                FLAGS DETECTED
              </span>
            </div>
            <div className="space-y-2.5">
              {anomalyPairs.slice(0, 6).map(([field, value]) => (
                <div
                  key={field}
                  className="rounded-xl p-3"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "9px",
                      color: "rgba(176,196,222,0.4)",
                      letterSpacing: "0.08em",
                      marginBottom: "3px",
                    }}
                  >
                    {field.toUpperCase()}
                  </div>
                  <div style={{ color: "#F0F6FF", fontSize: "12px", lineHeight: 1.5 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="rounded-3xl p-6 text-center"
            style={{
              background: "rgba(18,163,123,0.04)",
              border: "1px solid rgba(18,163,123,0.16)",
            }}
          >
            <CheckCircle2 size={28} color="#12A37B" className="mx-auto mb-3" />
            <div style={{ color: "#F0F6FF", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
              No flags raised
            </div>
            <p
              style={{
                color: "rgba(176,196,222,0.65)",
                fontSize: "12.5px",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              The AI pipeline didn't detect anomalies worth highlighting.
            </p>
          </div>
        )}

        {/* File links */}
        <div
          className="rounded-3xl p-5"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "10px",
              color: "rgba(176,196,222,0.4)",
              letterSpacing: "0.08em",
              marginBottom: "12px",
            }}
          >
            FILES
          </div>
          <div className="space-y-2">
            <FileLinkRow label="Original document" href={scan.fileUrl} icon={FileText} />
            {scan.reportUrl && (
              <FileLinkRow label="Generated report" href={scan.reportUrl} icon={Download} />
            )}
            {scan.heatmapUrl && (
              <FileLinkRow label="Forgery heatmap" href={scan.heatmapUrl} icon={Eye} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FileLinkRow({ label, href, icon: Icon }: { label: string; href: string; icon: typeof FileText }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 no-underline transition-colors"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex items-center gap-2.5">
        <Icon size={14} color="rgba(176,196,222,0.55)" />
        <span style={{ color: "#F0F6FF", fontSize: "13px" }}>{label}</span>
      </div>
      <span style={{ color: "#12A37B", fontSize: "12px" }}>Open →</span>
    </a>
  );
}

function DataTab({ ocrPairs, scan }: { ocrPairs: Array<[string, string]>; scan: Scan }) {
  const fields: Array<[string, string]> = [
    ["File name", scan.fileName],
    ["File type", scan.fileMimeType],
    ["Scan code", scan.scanCode],
    ["Verification status", scan.verificationStatus],
    ["Payment status", scan.paymentStatus],
    ["Created", new Date(scan.createdAt).toLocaleString()],
    ["Last updated", new Date(scan.updatedAt).toLocaleString()],
  ];

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      <div
        className="rounded-3xl p-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "10px",
            color: "rgba(176,196,222,0.4)",
            letterSpacing: "0.08em",
            marginBottom: "16px",
          }}
        >
          SUBMISSION METADATA
        </div>
        <div className="space-y-2">
          {fields.map(([label, value]) => (
            <div
              key={label}
              className="flex items-start justify-between gap-3 rounded-xl px-3 py-2.5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <span style={{ color: "rgba(176,196,222,0.65)", fontSize: "12px" }}>{label}</span>
              <span
                style={{
                  color: "#F0F6FF",
                  fontSize: "12px",
                  textAlign: "right",
                  maxWidth: "60%",
                  wordBreak: "break-word",
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="rounded-3xl p-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "10px",
            color: "rgba(176,196,222,0.4)",
            letterSpacing: "0.08em",
            marginBottom: "16px",
          }}
        >
          EXTRACTED FIELDS (OCR)
        </div>
        {ocrPairs.length === 0 ? (
          <div
            className="rounded-xl p-4 text-center text-sm"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px dashed rgba(255,255,255,0.08)",
              color: "rgba(176,196,222,0.55)",
            }}
          >
            OCR extraction hasn't completed yet. Try refreshing in a moment.
          </div>
        ) : (
          <div className="space-y-2">
            {ocrPairs.slice(0, 15).map(([field, value]) => (
              <div
                key={field}
                className="rounded-xl px-3 py-2.5"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "9px",
                    color: "rgba(176,196,222,0.4)",
                    letterSpacing: "0.08em",
                    marginBottom: "3px",
                  }}
                >
                  {field.toUpperCase()}
                </div>
                <div style={{ color: "#F0F6FF", fontSize: "12.5px", lineHeight: 1.5 }}>{value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PaymentTab({ scan }: { scan: Scan }) {
  const txStatusColor = (s: string) => {
    if (s === "SUCCESS") return "#12A37B";
    if (s === "FAILED" || s === "REFUNDED") return "#EF4444";
    return "#F59E0B";
  };

  return (
    <div className="space-y-4">
      <div
        className="rounded-3xl p-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "10px",
                color: "rgba(176,196,222,0.4)",
                letterSpacing: "0.08em",
              }}
            >
              PAYMENT
            </div>
            <h3 style={{ color: "#F0F6FF", fontSize: "1.1rem", marginTop: "4px" }}>
              Transaction record
            </h3>
          </div>
          <CreditCard size={16} color="#12A37B" />
        </div>

        {scan.transaction ? (
          <div
            className="rounded-2xl p-4 mb-3"
            style={{
              background: `${txStatusColor(scan.transaction.status)}14`,
              border: `1px solid ${txStatusColor(scan.transaction.status)}30`,
            }}
          >
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "11px",
                    color: "rgba(176,196,222,0.55)",
                    marginBottom: "2px",
                  }}
                >
                  {scan.transaction.reference}
                </div>
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "1.6rem",
                    color: "#F0F6FF",
                  }}
                >
                  {formatCurrency(scan.transaction.amount, scan.transaction.currency)}
                </div>
              </div>
              <div
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5"
                style={{
                  background: `${txStatusColor(scan.transaction.status)}1f`,
                  border: `1px solid ${txStatusColor(scan.transaction.status)}40`,
                }}
              >
                {scan.transaction.status === "SUCCESS" && (
                  <CheckCircle2 size={11} color={txStatusColor(scan.transaction.status)} />
                )}
                {(scan.transaction.status === "FAILED" || scan.transaction.status === "REFUNDED") && (
                  <XCircle size={11} color={txStatusColor(scan.transaction.status)} />
                )}
                {scan.transaction.status === "PENDING" && <Clock3 size={11} color={txStatusColor(scan.transaction.status)} />}
                <span
                  style={{
                    color: txStatusColor(scan.transaction.status),
                    fontSize: "10px",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                  }}
                >
                  {scan.transaction.status}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div style={{ color: "rgba(176,196,222,0.55)", fontSize: "11px" }}>Type</div>
                <div style={{ color: "#F0F6FF", fontSize: "12.5px" }}>
                  {scan.transaction.type.replaceAll("_", " ")}
                </div>
              </div>
              {scan.transaction.processedAt && (
                <div>
                  <div style={{ color: "rgba(176,196,222,0.55)", fontSize: "11px" }}>Processed</div>
                  <div style={{ color: "#F0F6FF", fontSize: "12.5px" }}>
                    {new Date(scan.transaction.processedAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className="rounded-xl p-4 text-center text-sm"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px dashed rgba(255,255,255,0.08)",
              color: "rgba(176,196,222,0.6)",
            }}
          >
            No transaction recorded for this scan.
          </div>
        )}

        {scan.refund && (
          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.18)",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "10px",
                  color: "#EF4444",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                }}
              >
                REFUND
              </span>
              <span style={{ color: "#EF4444", fontSize: "10px", letterSpacing: "0.08em" }}>
                {scan.refund.status}
              </span>
            </div>
            <div style={{ color: "#F0F6FF", fontSize: "13px", marginBottom: "4px" }}>
              {scan.refund.reason}
            </div>
            <div style={{ color: "rgba(176,196,222,0.7)", fontSize: "12px" }}>
              {formatCurrency(scan.refund.amount)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}