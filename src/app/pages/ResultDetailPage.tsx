import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { motion } from "motion/react";
import {
  Calendar,
  ChevronRight,
  Copy,
  CreditCard,
  Download,
  FileText,
  Globe,
  Hash,
  Loader2,
  RefreshCw,
  Share2,
  ShieldCheck,
  User,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ScoreRing } from "../components/ScoreRing";
import { api } from "../lib/api";
import type { Scan } from "../lib/types";

function formatCurrency(value: string | number | undefined, currency = "NGN") {
  const amount = typeof value === "string" ? Number.parseFloat(value) : value ?? 0;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0);
}

function label(value: string) {
  return value.replaceAll("_", " ");
}

function tone(value: string) {
  if (value === "VERIFIED" || value === "COMPLETED" || value === "SUCCESS") return { color: "#12A37B", bg: "rgba(18,163,123,0.08)", border: "rgba(18,163,123,0.18)" };
  if (value === "PROCESSING" || value === "PENDING" || value === "PENDING_PAYMENT" || value === "QUEUED") return { color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.18)" };
  return { color: "#EF4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.18)" };
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

function objectPairs(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [] as Array<[string, string]>;
  return Object.entries(value as Record<string, unknown>).slice(0, 10).map(([key, entry]) => [key, typeof entry === "string" ? entry : JSON.stringify(entry)] as [string, string]);
}

function fieldPairs(scan: Scan) {
  return [
    ["scan code", scan.scanCode],
    ["file name", scan.fileName],
    ["file type", scan.fileMimeType],
    ["status", scan.status],
    ["verification", scan.verificationStatus],
    ["payment", scan.paymentStatus],
    ["payment required", scan.paymentRequired ? "yes" : "no"],
    ["flagged", scan.flagged ? "yes" : "no"],
  ] as Array<[string, string]>;
}

export function ResultDetailPage() {
  const { id } = useParams();
  const [scan, setScan] = useState<Scan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!id) {
        setError("Missing scan ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await api.getScan(id);
        if (active) setScan(result);
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : "Unable to load the scan.";
        if (active) {
          setError(message);
          toast.error(message);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [id]);

  const score = useMemo(() => (scan ? scoreForScan(scan) : 0), [scan]);

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <Loader2 className="animate-spin" size={28} color="#12A37B" />
      </div>
    );
  }

  if (!scan || error) {
    return (
      <div className="min-h-screen pt-16 px-6 md:px-10 py-12">
        <div className="max-w-3xl mx-auto rounded-3xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#F0F6FF", marginBottom: "10px" }}>Result not available</h1>
          <p style={{ color: "rgba(176,196,222,0.7)", lineHeight: 1.7 }}>{error ?? "We couldn't find that scan."}</p>
          <Link to="/dashboard" className="inline-flex items-center gap-2 rounded-xl px-4 py-3 no-underline mt-4" style={{ background: "linear-gradient(135deg, #0F6E56, #12A37B)", color: "white", fontWeight: 600 }}>
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const status = tone(scan.verificationStatus);

  return (
    <div className="min-h-screen pt-16 px-6 md:px-10 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs" style={{ color: "rgba(176,196,222,0.45)", letterSpacing: "0.08em" }}>
              <Link to="/" className="no-underline" style={{ color: "inherit" }}>Home</Link>
              <ChevronRight size={10} />
              <Link to="/dashboard" className="no-underline" style={{ color: "inherit" }}>Dashboard</Link>
              <ChevronRight size={10} />
              <span style={{ color: "#12A37B" }}>{scan.scanCode}</span>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.9rem, 4vw, 2.8rem)", color: "#F0F6FF", lineHeight: 1.1, marginBottom: "8px" }}>
              Verification report
            </h1>
            <p style={{ color: "rgba(176,196,222,0.65)" }}>
              {scan.fileName} · uploaded {new Date(scan.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(176,196,222,0.78)" }}>
              <Copy size={13} />
              Copy
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(176,196,222,0.78)" }}>
              <Download size={13} />
              Export
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(176,196,222,0.78)" }}>
              <Share2 size={13} />
              Share
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.15fr] gap-6 items-start">
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${status.border}` }}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.4)", letterSpacing: "0.08em" }}>SCAN SCORE</div>
                  <div style={{ color: "#F0F6FF", marginTop: "4px" }}>{scan.verificationStatus}</div>
                </div>
                <ScoreRing score={score} size={150} animate />
              </div>

              <div className="space-y-3">
                {[
                  { label: "scan code", value: scan.scanCode, icon: Hash },
                  { label: "status", value: scan.status, icon: ShieldCheck },
                  { label: "payment", value: scan.paymentStatus, icon: Wallet },
                  { label: "price", value: formatCurrency(scan.price), icon: CreditCard },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <item.icon size={14} color="rgba(176,196,222,0.45)" className="mt-0.5" />
                    <div>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: "rgba(176,196,222,0.36)", letterSpacing: "0.08em", marginBottom: "2px" }}>{item.label.toUpperCase()}</div>
                      <div style={{ color: "#F0F6FF", fontSize: "13px" }}>{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.4)", letterSpacing: "0.08em", marginBottom: "12px" }}>FILE LINKS</div>
              <div className="space-y-3 text-sm" style={{ color: "rgba(176,196,222,0.72)" }}>
                <div className="flex items-center justify-between gap-3 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span>Original file</span>
                  <a href={scan.fileUrl} target="_blank" rel="noreferrer" style={{ color: "#12A37B" }}>Open</a>
                </div>
                {scan.reportUrl && (
                  <div className="flex items-center justify-between gap-3 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <span>Generated report</span>
                    <a href={scan.reportUrl} target="_blank" rel="noreferrer" style={{ color: "#12A37B" }}>Open</a>
                  </div>
                )}
                {scan.heatmapUrl && (
                  <div className="flex items-center justify-between gap-3 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <span>Heatmap</span>
                    <a href={scan.heatmapUrl} target="_blank" rel="noreferrer" style={{ color: "#12A37B" }}>Open</a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.4)", letterSpacing: "0.08em" }}>ANALYSIS SNAPSHOT</div>
                  <div style={{ color: "#F0F6FF", marginTop: "4px" }}>Backend scan payload</div>
                </div>
                <RefreshCw size={16} color="#12A37B" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {fieldPairs(scan).map(([field, value]) => (
                  <div key={field} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: "rgba(176,196,222,0.38)", letterSpacing: "0.08em", marginBottom: "4px" }}>{field.toUpperCase()}</div>
                    <div style={{ color: "#F0F6FF", fontSize: "13px", lineHeight: 1.5 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {scan.ocrData && objectPairs(scan.ocrData).length > 0 && (
              <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.4)", letterSpacing: "0.08em", marginBottom: "12px" }}>OCR DATA</div>
                <div className="space-y-3">
                  {objectPairs(scan.ocrData).map(([field, value]) => (
                    <div key={field} className="flex items-start justify-between gap-3 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ color: "rgba(176,196,222,0.66)", fontSize: "12px" }}>{field}</span>
                      <span style={{ color: "#F0F6FF", fontSize: "12px", textAlign: "right" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {scan.anomalyData && objectPairs(scan.anomalyData).length > 0 && (
              <div className="rounded-3xl p-6" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.14)" }}>
                <div className="flex items-center gap-2 mb-4"><XCircle size={14} color="#EF4444" /><span style={{ color: "#EF4444", letterSpacing: "0.08em", fontSize: "10px" }}>ANOMALY DATA</span></div>
                <div className="space-y-3">
                  {objectPairs(scan.anomalyData).map(([field, value]) => (
                    <div key={field} className="flex items-start justify-between gap-3 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ color: "rgba(176,196,222,0.66)", fontSize: "12px" }}>{field}</span>
                      <span style={{ color: "#F0F6FF", fontSize: "12px", textAlign: "right" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(scan.transaction || scan.refund) && (
              <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.4)", letterSpacing: "0.08em", marginBottom: "12px" }}>PAYMENT RECORD</div>
                {scan.transaction && (
                  <div className="rounded-2xl p-4 mb-3" style={{ background: scan.transaction.status === "SUCCESS" ? "rgba(18,163,123,0.08)" : "rgba(245,158,11,0.08)", border: `1px solid ${scan.transaction.status === "SUCCESS" ? "rgba(18,163,123,0.18)" : "rgba(245,158,11,0.18)"}` }}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span style={{ color: "#F0F6FF" }}>{scan.transaction.reference}</span>
                      <span style={{ color: scan.transaction.status === "SUCCESS" ? "#12A37B" : "#F59E0B", fontSize: "10px", letterSpacing: "0.08em" }}>{scan.transaction.status}</span>
                    </div>
                    <div style={{ color: "rgba(176,196,222,0.72)", fontSize: "12px" }}>{formatCurrency(scan.transaction.amount, scan.transaction.currency)}</div>
                  </div>
                )}
                {scan.refund && (
                  <div className="rounded-2xl p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span style={{ color: "#F0F6FF" }}>{scan.refund.reason}</span>
                      <span style={{ color: "#EF4444", fontSize: "10px", letterSpacing: "0.08em" }}>{scan.refund.status}</span>
                    </div>
                    <div style={{ color: "rgba(176,196,222,0.72)", fontSize: "12px" }}>{formatCurrency(scan.refund.amount)}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
