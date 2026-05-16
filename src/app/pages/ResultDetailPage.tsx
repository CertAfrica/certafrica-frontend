import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  Copy,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  Layers,
  Loader2,
  MapPin,
  MoreHorizontal,
  RefreshCw,
  ScanLine,
  Share2,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ScoreRing } from "../components/ScoreRing";
import { SkeletonPanel } from "../components/Skeletons";
import { api } from "../lib/api";
import type { Scan } from "../lib/types";

// ---------------- helpers ----------------

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
  return 58;
}

/**
 * The backend's verificationStatus is authoritative. The numeric trustScore is
 * supporting context. Banding off the score alone produced contradictions like
 * "VERIFIED" + "Inconclusive band".
 */
function verdictFor(scan: Scan) {
  switch (scan.verificationStatus) {
    case "VERIFIED":
      return {
        key: "verified" as const,
        label: "Verified",
        headline: "Document passed verification.",
        sub: "Registry and signal checks were consistent with a genuine certificate.",
        color: "#12A37B",
        bg: "rgba(18,163,123,0.08)",
        border: "rgba(18,163,123,0.22)",
        icon: ShieldCheck,
      };
    case "INCONCLUSIVE":
      return {
        key: "inconclusive" as const,
        label: "Inconclusive",
        headline: "We could not conclusively verify this document.",
        sub: "Some signals are mixed. A human reviewer should look at the flagged regions below.",
        color: "#F59E0B",
        bg: "rgba(245,158,11,0.08)",
        border: "rgba(245,158,11,0.22)",
        icon: AlertTriangle,
      };
    case "FLAGGED":
      return {
        key: "flagged" as const,
        label: "Flagged",
        headline: "This document was flagged as likely forged.",
        sub: "Multiple signals indicate tampering or inconsistency with registry records.",
        color: "#EF4444",
        bg: "rgba(239,68,68,0.08)",
        border: "rgba(239,68,68,0.22)",
        icon: ShieldAlert,
      };
    case "FAILED":
      return {
        key: "failed" as const,
        label: "Failed",
        headline: "Verification could not be completed.",
        sub: "We hit an error during analysis. Try uploading again or contact support if it persists.",
        color: "#EF4444",
        bg: "rgba(239,68,68,0.08)",
        border: "rgba(239,68,68,0.22)",
        icon: XCircle,
      };
    default:
      return {
        key: "processing" as const,
        label: "Processing",
        headline: "Verification is still running.",
        sub: "We'll update this report as soon as analysis completes.",
        color: "#3B8BD4",
        bg: "rgba(59,139,212,0.08)",
        border: "rgba(59,139,212,0.22)",
        icon: Loader2,
      };
  }
}

type Severity = "high" | "medium" | "low";

function severityFor(value: number): Severity {
  if (value >= 75) return "high";
  if (value >= 45) return "medium";
  return "low";
}

function severityColor(level: Severity) {
  if (level === "high") return "#EF4444";
  if (level === "medium") return "#F59E0B";
  return "#3B8BD4";
}

interface AnomalyCategory {
  area: string;
  count: number;
  category: string;
}

interface AnomalyRegion {
  top: number;
  left: number;
  width: number;
  height: number;
  area: string;
  category: string;
  severity: number;
}

interface AnomalyData {
  score?: number;
  by_category?: AnomalyCategory[];
  top_regions?: AnomalyRegion[];
  total_regions?: number;
  high_severity_regions?: number;
}

interface OcrData {
  rawText?: string;
  language?: string;
  confidence?: number;
  extractedFields?: Record<string, unknown>;
}

/**
 * Derives a real per-signal breakdown from the data the backend already
 * returns. Replaces the previous Math.random() jitter, which made the bars
 * change on every render.
 */
function signalBreakdown(scan: Scan, anomaly: AnomalyData, ocr: OcrData) {
  const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

  // anomalyData.score behaves like a tamper-risk score (higher = worse),
  // so we invert it for the "visual integrity" signal.
  const anomalyScore = typeof anomaly.score === "number" ? anomaly.score : 50;
  const visualIntegrity = clamp(100 - anomalyScore);

  // Penalise the "security features" signal when tampering or moderate
  // anomalies show up in the by_category breakdown.
  const tamperCount =
    (anomaly.by_category ?? [])
      .filter((c) => /tampering|moderate anomaly/i.test(c.category))
      .reduce((sum, c) => sum + c.count, 0) ?? 0;
  const securityFeatures = clamp(90 - tamperCount * 12);

  // OCR confidence ranges 0..1.
  const ocrConfidence = clamp((ocr.confidence ?? 0.5) * 100);

  // Registry lookup: derive directly from the backend verdict.
  const registry =
    scan.verificationStatus === "VERIFIED"
      ? 92
      : scan.verificationStatus === "INCONCLUSIVE"
        ? 60
        : scan.verificationStatus === "FLAGGED"
          ? 25
          : scan.verificationStatus === "FAILED"
            ? 10
            : 55;

  // Document quality: how many "irregular text spacing" anomalies we picked up.
  const spacingCount =
    (anomaly.by_category ?? [])
      .filter((c) => /spacing|alignment|quality/i.test(c.category))
      .reduce((sum, c) => sum + c.count, 0) ?? 0;
  const docQuality = clamp(95 - spacingCount * 4);

  return [
    {
      label: "Visual integrity",
      weight: "35%",
      value: visualIntegrity,
      detail: `${anomaly.total_regions ?? 0} regions analyzed`,
      color: "#534AB7",
    },
    {
      label: "Security features",
      weight: "20%",
      value: securityFeatures,
      detail: tamperCount ? `${tamperCount} tampering signal${tamperCount === 1 ? "" : "s"}` : "No tampering signals",
      color: "#12A37B",
    },
    {
      label: "Text legibility (OCR)",
      weight: "15%",
      value: ocrConfidence,
      detail: `${(ocr.confidence ?? 0).toFixed(2)} confidence`,
      color: "#3B8BD4",
    },
    {
      label: "Registry cross-check",
      weight: "20%",
      value: registry,
      detail: scan.verificationStatus.replace("_", " ").toLowerCase(),
      color: "#BA7517",
    },
    {
      label: "Document quality",
      weight: "10%",
      value: docQuality,
      detail: spacingCount ? `${spacingCount} layout issue${spacingCount === 1 ? "" : "s"}` : "Clean layout",
      color: "#A32D2D",
    },
  ];
}

function groupAnomaliesByArea(by_category: AnomalyCategory[] = []) {
  const map = new Map<string, { area: string; total: number; categories: { name: string; count: number }[] }>();
  for (const item of by_category) {
    const bucket = map.get(item.area) ?? { area: item.area, total: 0, categories: [] };
    bucket.total += item.count;
    bucket.categories.push({ name: item.category, count: item.count });
    map.set(item.area, bucket);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

type Tab = "overview" | "evidence" | "data" | "payment";

// ---------------- main component ----------------

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

  // Auto-refresh while processing so the report fills in without manual reloads.
  useEffect(() => {
    if (!scan) return;
    const stillRunning =
      scan.status === "PROCESSING" ||
      scan.verificationStatus === "PROCESSING" ||
      (scan.verificationStatus !== "VERIFIED" &&
        scan.verificationStatus !== "INCONCLUSIVE" &&
        scan.verificationStatus !== "FLAGGED" &&
        scan.verificationStatus !== "FAILED");
    if (!stillRunning) return;
    const timer = setInterval(() => {
      void fetchScan();
    }, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scan?.status, scan?.verificationStatus]);

  const score = useMemo(() => (scan ? scoreForScan(scan) : 0), [scan]);
  const verdict = useMemo(() => (scan ? verdictFor(scan) : null), [scan]);
  const anomaly = (scan?.anomalyData ?? {}) as AnomalyData;
  const ocr = (scan?.ocrData ?? {}) as OcrData;
  const signals = useMemo(() => (scan ? signalBreakdown(scan, anomaly, ocr) : []), [scan, anomaly, ocr]);
  const isProcessing = verdict?.key === "processing";

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
        // user cancelled
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

  if (!scan || error || !verdict) {
    return <UnavailableState message={error ?? "We couldn't find that scan."} />;
  }

  return (
    <div className="min-h-screen pt-26 px-6 md:px-10 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <PageHeader
          scan={scan}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onCopy={handleCopyLink}
          onDownload={handleDownload}
          onShare={handleShare}
        />

        <HeroVerdictCard
          scan={scan}
          verdict={verdict}
          score={score}
          ocr={ocr}
          anomaly={anomaly}
          isProcessing={isProcessing}
        />

        {!isProcessing && (
          <>
            <TabBar tab={tab} onChange={setTab} hasEvidence={Boolean(scan.heatmapUrl) || (anomaly.top_regions?.length ?? 0) > 0} />
            <div className="certafrica-fade-in">
              {tab === "overview" && <OverviewTab scan={scan} signals={signals} anomaly={anomaly} verdict={verdict} />}
              {tab === "evidence" && <EvidenceTab scan={scan} anomaly={anomaly} />}
              {tab === "data" && <DataTab scan={scan} ocr={ocr} />}
              {tab === "payment" && <PaymentTab scan={scan} />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------- header + actions ----------------

function PageHeader({
  scan,
  refreshing,
  onRefresh,
  onCopy,
  onDownload,
  onShare,
}: {
  scan: Scan;
  refreshing: boolean;
  onRefresh: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onShare: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const baseButton =
    "inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[12.5px] font-medium transition-colors";

  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <div
          className="flex items-center gap-2 mb-2 text-xs"
          style={{ color: "rgba(176,196,222,0.45)", letterSpacing: "0.08em" }}
        >
          <Link to="/" className="no-underline hover:text-white" style={{ color: "inherit" }}>
            Home
          </Link>
          <ChevronRight size={10} />
          <Link to="/dashboard" className="no-underline hover:text-white" style={{ color: "inherit" }}>
            Dashboard
          </Link>
          <ChevronRight size={10} />
          <span style={{ color: "#12A37B", fontFamily: "'IBM Plex Mono', monospace" }}>{scan.scanCode}</span>
        </div>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(1.9rem, 4vw, 2.8rem)",
            color: "#F0F6FF",
            lineHeight: 1.1,
            marginBottom: "6px",
            wordBreak: "break-word",
          }}
        >
          {scan.fileName}
        </h1>
        <p style={{ color: "rgba(176,196,222,0.6)", fontSize: "13px" }}>
          Uploaded {new Date(scan.createdAt).toLocaleString()}
        </p>
      </div>

      {/* Desktop: full action row. Mobile: primary + overflow menu. */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className={`${baseButton} hidden sm:inline-flex`}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(176,196,222,0.82)",
          }}
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </button>
        <button
          type="button"
          onClick={onCopy}
          className={`${baseButton} hidden sm:inline-flex`}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(176,196,222,0.82)",
          }}
        >
          <Copy size={13} />
          Copy link
        </button>
        <button
          type="button"
          onClick={onDownload}
          className={`${baseButton} hidden md:inline-flex`}
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(176,196,222,0.82)",
          }}
        >
          <Download size={13} />
          Download PDF
        </button>
        <button
          type="button"
          onClick={onShare}
          className={baseButton}
          style={{
            background: "rgba(18,163,123,0.1)",
            border: "1px solid rgba(18,163,123,0.2)",
            color: "#12A37B",
          }}
        >
          <Share2 size={13} />
          Share
        </button>

        {/* Mobile overflow menu */}
        <div className="relative sm:hidden" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className={baseButton}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(176,196,222,0.82)",
            }}
          >
            <MoreHorizontal size={14} />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                role="menu"
                className="absolute right-0 mt-2 w-44 rounded-xl py-1 z-10"
                style={{
                  background: "rgba(15,18,26,0.96)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 12px 32px rgba(0,0,0,0.5)",
                }}
              >
                <MenuItem icon={RefreshCw} label="Refresh" onClick={() => { setMenuOpen(false); onRefresh(); }} />
                <MenuItem icon={Copy} label="Copy link" onClick={() => { setMenuOpen(false); onCopy(); }} />
                <MenuItem icon={Download} label="Download PDF" onClick={() => { setMenuOpen(false); onDownload(); }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick }: { icon: typeof RefreshCw; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 text-left"
      style={{ color: "#F0F6FF", fontSize: "13px" }}
    >
      <Icon size={13} color="rgba(176,196,222,0.7)" />
      {label}
    </button>
  );
}

// ---------------- hero ----------------

function HeroVerdictCard({
  scan,
  verdict,
  score,
  ocr,
  anomaly,
  isProcessing,
}: {
  scan: Scan;
  verdict: ReturnType<typeof verdictFor>;
  score: number;
  ocr: OcrData;
  anomaly: AnomalyData;
  isProcessing: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-6 md:p-8"
      style={{
        background: `linear-gradient(135deg, ${verdict.bg}, rgba(255,255,255,0.03))`,
        border: `1px solid ${verdict.border}`,
      }}
    >
      {isProcessing ? (
        <ProcessingHero scan={scan} />
      ) : (
        <div className="grid md:grid-cols-[200px_1fr] gap-6 md:gap-8 items-center">
          <div className="flex justify-center md:justify-start">
            <ScoreRing score={score} size={180} animate />
          </div>
          <div>
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
              style={{ background: `${verdict.color}1a`, border: `1px solid ${verdict.color}40` }}
            >
              <verdict.icon size={12} color={verdict.color} />
              <span
                style={{
                  color: verdict.color,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "10px",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                }}
              >
                {verdict.label.toUpperCase()}
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
              {verdict.headline}
            </h2>
            <p style={{ color: "rgba(176,196,222,0.7)", fontSize: "13.5px", lineHeight: 1.7 }}>{verdict.sub}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              <MiniStat label="Trust score" value={`${score}/100`} icon={Sparkles} />
              <MiniStat
                label="Flagged regions"
                value={`${anomaly.high_severity_regions ?? 0} / ${anomaly.total_regions ?? 0}`}
                icon={MapPin}
              />
              <MiniStat
                label="OCR confidence"
                value={typeof ocr.confidence === "number" ? `${Math.round(ocr.confidence * 100)}%` : "n/a"}
                icon={ScanLine}
              />
              <MiniStat label="Price" value={formatCurrency(scan.price)} icon={Wallet} />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ProcessingHero({ scan }: { scan: Scan }) {
  const checkpoints = ["Extracting document data", "Checking registry records", "Finalizing score"];
  return (
    <div className="grid md:grid-cols-[200px_1fr] gap-6 md:gap-8 items-center">
      <div className="flex justify-center md:justify-start">
        <div className="relative flex items-center justify-center" style={{ width: 180, height: 180 }}>
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.55, 0.92, 0.55] }}
            transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(18,163,123,0.22), transparent 68%)" }}
          />
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-2 rounded-full"
            style={{
              border: "1px solid rgba(18,163,123,0.2)",
              borderTopColor: "rgba(18,163,123,0.9)",
              borderRightColor: "rgba(18,163,123,0.45)",
            }}
          />
          <div className="relative text-center px-4">
            <Loader2 className="mx-auto mb-3 animate-spin" size={28} color="#12A37B" />
            <div style={{ color: "#F0F6FF", fontSize: "15px", fontWeight: 600, marginBottom: "2px" }}>
              Verification running
            </div>
            <div style={{ color: "rgba(176,196,222,0.6)", fontSize: "11px", lineHeight: 1.5 }}>
              This page refreshes automatically.
            </div>
          </div>
        </div>
      </div>

      <div>
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full mb-3"
          style={{ background: "rgba(59,139,212,0.1)", border: "1px solid rgba(59,139,212,0.22)" }}
        >
          <Loader2 size={12} color="#3B8BD4" className="animate-spin" />
          <span
            style={{
              color: "#3B8BD4",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.08em",
            }}
          >
            PROCESSING
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
          Analyzing your certificate
        </h2>
        <p style={{ color: "rgba(176,196,222,0.7)", fontSize: "13.5px", lineHeight: 1.7 }}>
          We're extracting text, validating registry matches, and calculating a trust score. No preliminary
          score is shown until analysis completes.
        </p>

        <div className="mt-5 grid gap-3">
          {checkpoints.map((checkpoint, index) => (
            <div
              key={checkpoint}
              className="flex items-center justify-between rounded-xl px-3 py-2.5"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div className="flex items-center gap-3">
                <motion.span
                  animate={{ opacity: [0.35, 1, 0.35] }}
                  transition={{ duration: 1.4, repeat: Infinity, delay: index * 0.18 }}
                  className="flex h-2.5 w-2.5 rounded-full"
                  style={{ background: ["#F59E0B", "#3B8BD4", "#12A37B"][index] }}
                />
                <span style={{ color: "#F0F6FF", fontSize: "12.5px" }}>{checkpoint}</span>
              </div>
              <span
                style={{
                  color: "rgba(176,196,222,0.55)",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "10px",
                  letterSpacing: "0.08em",
                }}
              >
                ACTIVE
              </span>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            ["Status", scan.status.replaceAll("_", " ")],
            ["Payment", scan.paymentStatus],
            ["Report", "pending"],
          ].map(([label, value]) => (
            <MiniStat key={label} label={label} value={value} icon={ShieldCheck} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------- tab bar ----------------

function TabBar({ tab, onChange, hasEvidence }: { tab: Tab; onChange: (next: Tab) => void; hasEvidence: boolean }) {
  const items: Array<{ id: Tab; label: string; show: boolean }> = [
    { id: "overview", label: "Overview", show: true },
    { id: "evidence", label: "Document evidence", show: hasEvidence },
    { id: "data", label: "Extracted data", show: true },
    { id: "payment", label: "Payment", show: true },
  ];

  return (
    <div
      className="flex items-center gap-1 rounded-2xl p-1.5 w-full max-w-2xl overflow-x-auto"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {items.filter((i) => i.show).map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className="flex-1 rounded-xl px-3 py-2 whitespace-nowrap"
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
  );
}

// ---------------- overview tab ----------------

function OverviewTab({
  scan,
  signals,
  anomaly,
  verdict,
}: {
  scan: Scan;
  signals: ReturnType<typeof signalBreakdown>;
  anomaly: AnomalyData;
  verdict: ReturnType<typeof verdictFor>;
}) {
  const groupedAreas = groupAnomaliesByArea(anomaly.by_category);
  const totalFlags = anomaly.total_regions ?? 0;
  const highSev = anomaly.high_severity_regions ?? 0;

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
              How we reached the score
            </h3>
          </div>
          <Eye size={16} color="#12A37B" />
        </div>

        <div className="space-y-4">
          {signals.map((signal, i) => (
            <div key={signal.label}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span style={{ color: "#F0F6FF", fontSize: "13px", fontWeight: 500 }}>{signal.label}</span>
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
              <div style={{ color: "rgba(176,196,222,0.5)", fontSize: "11px", marginTop: "4px" }}>
                {signal.detail}
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
          Each signal is weighted to produce the composite authenticity score. Registry weight increases when
          a successful institutional lookup is available.
        </p>
      </div>

      {/* Anomaly summary */}
      <div className="space-y-4">
        {totalFlags > 0 ? (
          <div
            className="rounded-3xl p-6"
            style={{
              background:
                verdict.key === "verified" ? "rgba(245,158,11,0.04)" : "rgba(239,68,68,0.04)",
              border:
                verdict.key === "verified"
                  ? "1px solid rgba(245,158,11,0.18)"
                  : "1px solid rgba(239,68,68,0.18)",
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} color={verdict.key === "verified" ? "#F59E0B" : "#EF4444"} />
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "10px",
                    color: verdict.key === "verified" ? "#F59E0B" : "#EF4444",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                  }}
                >
                  {totalFlags} REGION{totalFlags === 1 ? "" : "S"} FLAGGED
                </span>
              </div>
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "10px",
                  color: "rgba(176,196,222,0.5)",
                }}
              >
                {highSev} high severity
              </span>
            </div>

            <div className="space-y-2">
              {groupedAreas.map((group) => (
                <div
                  key={group.area}
                  className="rounded-xl px-3 py-2.5"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      style={{
                        color: "#F0F6FF",
                        fontSize: "12.5px",
                        fontWeight: 500,
                        textTransform: "capitalize",
                      }}
                    >
                      {group.area}
                    </span>
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "11px",
                        color: "#F0F6FF",
                        fontWeight: 600,
                      }}
                    >
                      {group.total}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.categories.map((cat) => (
                      <span
                        key={cat.name}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.06)",
                          color: "rgba(176,196,222,0.75)",
                          fontSize: "10.5px",
                        }}
                      >
                        {cat.name}
                        <span style={{ color: "rgba(176,196,222,0.45)", fontFamily: "'IBM Plex Mono', monospace" }}>
                          {cat.count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {verdict.key === "verified" && (
              <p
                style={{
                  color: "rgba(176,196,222,0.6)",
                  fontSize: "11.5px",
                  lineHeight: 1.6,
                  marginTop: "14px",
                }}
              >
                Flags exist but the document still passed registry verification. Open the Document evidence
                tab to inspect each region.
              </p>
            )}
          </div>
        ) : (
          <div
            className="rounded-3xl p-6 text-center"
            style={{ background: "rgba(18,163,123,0.04)", border: "1px solid rgba(18,163,123,0.16)" }}
          >
            <CheckCircle2 size={28} color="#12A37B" className="mx-auto mb-3" />
            <div style={{ color: "#F0F6FF", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
              No anomalies detected
            </div>
            <p style={{ color: "rgba(176,196,222,0.65)", fontSize: "12.5px", lineHeight: 1.6, margin: 0 }}>
              The analysis pipeline didn't find regions worth highlighting.
            </p>
          </div>
        )}

        {/* File links */}
        <div
          className="rounded-3xl p-5"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
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
            {scan.reportUrl && <FileLinkRow label="Generated PDF report" href={scan.reportUrl} icon={Download} />}
            {scan.heatmapUrl && <FileLinkRow label="Forgery heatmap" href={scan.heatmapUrl} icon={ImageIcon} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- evidence tab ----------------

function EvidenceTab({ scan, anomaly }: { scan: Scan; anomaly: AnomalyData }) {
  type ViewMode = "original" | "heatmap";
  const [mode, setMode] = useState<ViewMode>(scan.heatmapUrl ? "heatmap" : "original");
  const [overlay, setOverlay] = useState(true);
  const [focusedRegion, setFocusedRegion] = useState<number | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const regions = anomaly.top_regions ?? [];
  const handleImgLoad = () => {
    if (imgRef.current) {
      setNaturalSize({ w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight });
    }
  };

  const currentUrl = mode === "heatmap" ? scan.heatmapUrl : scan.fileUrl;

  return (
    <div className="grid lg:grid-cols-[1.3fr_0.7fr] gap-6 items-start">
      {/* Document viewer */}
      <div
        className="rounded-3xl p-4 md:p-5"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div
            className="flex items-center gap-1 rounded-xl p-1"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            {([["original", "Original", FileText], ["heatmap", "Heatmap", Layers]] as const).map(
              ([id, label, Icon]) => {
                const disabled = id === "heatmap" && !scan.heatmapUrl;
                const active = mode === id;
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setMode(id)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5"
                    style={{
                      background: active ? "rgba(18,163,123,0.14)" : "transparent",
                      border: active ? "1px solid rgba(18,163,123,0.28)" : "1px solid transparent",
                      color: active ? "#12A37B" : "rgba(176,196,222,0.7)",
                      fontSize: "12px",
                      fontWeight: 500,
                      cursor: disabled ? "not-allowed" : "pointer",
                      opacity: disabled ? 0.4 : 1,
                    }}
                  >
                    <Icon size={12} />
                    {label}
                  </button>
                );
              },
            )}
          </div>

          {regions.length > 0 && (
            <button
              type="button"
              onClick={() => setOverlay((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5"
              style={{
                background: overlay ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)",
                border: overlay ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(255,255,255,0.06)",
                color: overlay ? "#EF4444" : "rgba(176,196,222,0.7)",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {overlay ? <Eye size={12} /> : <EyeOff size={12} />}
              {overlay ? "Hide overlay" : "Show overlay"}
            </button>
          )}
        </div>

        {currentUrl ? (
          <div
            className="relative rounded-2xl overflow-hidden mx-auto"
            style={{
              background: "rgba(0,0,0,0.4)",
              border: "1px solid rgba(255,255,255,0.06)",
              maxWidth: "100%",
            }}
          >
            <img
              ref={imgRef}
              src={currentUrl}
              alt={mode === "heatmap" ? "Forgery heatmap" : "Original document"}
              loading="lazy"
              onLoad={handleImgLoad}
              style={{ display: "block", width: "100%", height: "auto" }}
            />
            {overlay && naturalSize && regions.length > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                {regions.map((region, idx) => {
                  const sev = severityFor(region.severity);
                  const color = severityColor(sev);
                  const isFocused = focusedRegion === idx;
                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: isFocused ? 1 : 0.85, scale: isFocused ? 1.02 : 1 }}
                      transition={{ duration: 0.25 }}
                      className="absolute rounded-sm"
                      style={{
                        top: `${(region.top / naturalSize.h) * 100}%`,
                        left: `${(region.left / naturalSize.w) * 100}%`,
                        width: `${(region.width / naturalSize.w) * 100}%`,
                        height: `${(region.height / naturalSize.h) * 100}%`,
                        border: `2px solid ${color}`,
                        background: isFocused ? `${color}33` : `${color}1a`,
                        boxShadow: isFocused ? `0 0 0 3px ${color}33` : "none",
                      }}
                    >
                      <span
                        className="absolute -top-5 left-0 px-1.5 py-0.5 rounded-sm"
                        style={{
                          background: color,
                          color: "white",
                          fontSize: "9px",
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontWeight: 600,
                          letterSpacing: "0.05em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        #{idx + 1}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div
            className="rounded-2xl p-10 text-center"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px dashed rgba(255,255,255,0.08)",
              color: "rgba(176,196,222,0.55)",
            }}
          >
            No document image available.
          </div>
        )}

        <p
          style={{
            color: "rgba(176,196,222,0.5)",
            fontSize: "11.5px",
            lineHeight: 1.6,
            marginTop: "12px",
          }}
        >
          {mode === "heatmap"
            ? "Brighter regions in the heatmap indicate areas where the forgery model has higher confidence in tampering."
            : "Toggle the overlay to see exactly where the model flagged content on the original."}
        </p>
      </div>

      {/* Region list */}
      <div
        className="rounded-3xl p-5"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "10px",
            color: "rgba(176,196,222,0.4)",
            letterSpacing: "0.08em",
            marginBottom: "14px",
          }}
        >
          TOP REGIONS BY SEVERITY
        </div>

        {regions.length === 0 ? (
          <div
            className="rounded-xl p-4 text-center text-sm"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px dashed rgba(255,255,255,0.08)",
              color: "rgba(176,196,222,0.55)",
            }}
          >
            No regions flagged.
          </div>
        ) : (
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {regions.map((region, idx) => {
              const sev = severityFor(region.severity);
              const color = severityColor(sev);
              const isFocused = focusedRegion === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onMouseEnter={() => setFocusedRegion(idx)}
                  onMouseLeave={() => setFocusedRegion(null)}
                  onFocus={() => setFocusedRegion(idx)}
                  onBlur={() => setFocusedRegion(null)}
                  className="w-full text-left rounded-xl px-3 py-2.5 transition-colors"
                  style={{
                    background: isFocused ? `${color}14` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isFocused ? `${color}40` : "rgba(255,255,255,0.05)"}`,
                    cursor: "pointer",
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center justify-center rounded-md"
                        style={{
                          width: 18,
                          height: 18,
                          background: color,
                          color: "white",
                          fontSize: "9px",
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontWeight: 700,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span
                        style={{
                          color: "#F0F6FF",
                          fontSize: "12.5px",
                          fontWeight: 500,
                          textTransform: "capitalize",
                        }}
                      >
                        {region.area}
                      </span>
                    </div>
                    <span
                      style={{
                        color,
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      {Math.round(region.severity)}
                    </span>
                  </div>
                  <div style={{ color: "rgba(176,196,222,0.75)", fontSize: "11.5px", lineHeight: 1.5 }}>
                    {region.category}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- data tab ----------------

function DataTab({ scan, ocr }: { scan: Scan; ocr: OcrData }) {
  const [showRaw, setShowRaw] = useState(false);
  const fields: Array<[string, string]> = [
    ["File name", scan.fileName],
    ["File type", scan.fileMimeType],
    ["Scan code", scan.scanCode],
    ["Verification status", scan.verificationStatus],
    ["Payment status", scan.paymentStatus],
    ["Created", new Date(scan.createdAt).toLocaleString()],
    ["Last updated", new Date(scan.updatedAt).toLocaleString()],
  ];

  const extractedEntries = ocr.extractedFields ? Object.entries(ocr.extractedFields) : [];
  const confidence = typeof ocr.confidence === "number" ? ocr.confidence : null;
  const lowConfidence = confidence !== null && confidence < 0.75;

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      {/* Submission metadata */}
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

      {/* OCR */}
      <div
        className="rounded-3xl p-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "10px",
              color: "rgba(176,196,222,0.4)",
              letterSpacing: "0.08em",
            }}
          >
            EXTRACTED FIELDS (OCR)
          </div>
          {confidence !== null && (
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
              style={{
                background: lowConfidence ? "rgba(245,158,11,0.1)" : "rgba(18,163,123,0.1)",
                border: lowConfidence ? "1px solid rgba(245,158,11,0.25)" : "1px solid rgba(18,163,123,0.25)",
              }}
            >
              <ScanLine size={11} color={lowConfidence ? "#F59E0B" : "#12A37B"} />
              <span
                style={{
                  color: lowConfidence ? "#F59E0B" : "#12A37B",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "10px",
                  fontWeight: 600,
                }}
              >
                {Math.round(confidence * 100)}% confidence
              </span>
            </div>
          )}
        </div>

        {lowConfidence && (
          <div
            className="rounded-xl p-3 mb-3"
            style={{
              background: "rgba(245,158,11,0.06)",
              border: "1px solid rgba(245,158,11,0.18)",
              color: "rgba(245,158,11,0.95)",
              fontSize: "12px",
              lineHeight: 1.6,
            }}
          >
            OCR confidence is below 75%. Treat extracted fields as approximate. Re-upload a clearer scan if
            accuracy matters.
          </div>
        )}

        {extractedEntries.length === 0 ? (
          <div
            className="rounded-xl p-4 text-center text-sm"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px dashed rgba(255,255,255,0.08)",
              color: "rgba(176,196,222,0.55)",
            }}
          >
            No structured fields were extracted.
          </div>
        ) : (
          <div className="space-y-2">
            {extractedEntries.map(([field, value]) => (
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
                    textTransform: "uppercase",
                  }}
                >
                  {field.replace(/_/g, " ")}
                </div>
                <div style={{ color: "#F0F6FF", fontSize: "12.5px", lineHeight: 1.5, wordBreak: "break-word" }}>
                  {typeof value === "string" ? value : JSON.stringify(value)}
                </div>
              </div>
            ))}
          </div>
        )}

        {ocr.rawText && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowRaw((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "rgba(176,196,222,0.75)",
                fontSize: "11.5px",
                cursor: "pointer",
              }}
              aria-expanded={showRaw}
            >
              <ChevronDown
                size={12}
                style={{ transform: showRaw ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
              />
              {showRaw ? "Hide raw text" : "Show raw text"}
            </button>
            <AnimatePresence>
              {showRaw && (
                <motion.pre
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 rounded-xl p-3 overflow-x-auto"
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    color: "rgba(176,196,222,0.85)",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "11px",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxHeight: "300px",
                    overflowY: "auto",
                  }}
                >
                  {ocr.rawText}
                </motion.pre>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- payment tab ----------------

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
            <h3 style={{ color: "#F0F6FF", fontSize: "1.1rem", marginTop: "4px" }}>Transaction record</h3>
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
            <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
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
                {scan.transaction.status === "PENDING" && (
                  <Clock3 size={11} color={txStatusColor(scan.transaction.status)} />
                )}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
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
            className="rounded-xl p-5 text-center"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px dashed rgba(255,255,255,0.08)",
            }}
          >
            <Wallet size={20} color="rgba(176,196,222,0.5)" className="mx-auto mb-2" />
            <div style={{ color: "#F0F6FF", fontSize: "13px", fontWeight: 500, marginBottom: "2px" }}>
              No transaction recorded
            </div>
            <div style={{ color: "rgba(176,196,222,0.6)", fontSize: "12px" }}>
              This scan may have been part of a bulk run or covered by a free tier.
            </div>
          </div>
        )}

        {scan.refund && (
          <div
            className="rounded-2xl p-4"
            style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)" }}
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
            <div style={{ color: "#F0F6FF", fontSize: "13px", marginBottom: "4px" }}>{scan.refund.reason}</div>
            <div style={{ color: "rgba(176,196,222,0.7)", fontSize: "12px" }}>
              {formatCurrency(scan.refund.amount)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------- shared bits ----------------

function MiniStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof ShieldCheck;
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
      <div style={{ color: "#F0F6FF", fontSize: "12.5px", fontWeight: 500 }}>{value}</div>
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
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon size={14} color="rgba(176,196,222,0.55)" />
        <span style={{ color: "#F0F6FF", fontSize: "13px" }} className="truncate">
          {label}
        </span>
      </div>
      <span style={{ color: "#12A37B", fontSize: "12px", whiteSpace: "nowrap" }}>Open →</span>
    </a>
  );
}

function UnavailableState({ message }: { message: string }) {
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
        <p style={{ color: "rgba(176,196,222,0.7)", lineHeight: 1.7, marginBottom: "20px" }}>{message}</p>
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