import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  FileText,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Upload,
  Wallet,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { api, extractCheckoutUrl } from "../lib/api";
import QuickActions from "../components/QuickActions";
import type { BillingHistoryItem, Scan, ScanUsageSummary, Wallet as WalletType } from "../lib/types";

function formatCurrency(value: string | number | undefined, currency = "NGN") {
  const amount = typeof value === "string" ? Number.parseFloat(value) : value ?? 0;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function statusTone(status: string) {
  if (status === "VERIFIED" || status === "COMPLETED" || status === "SUCCESS") {
    return { color: "#12A37B", bg: "rgba(18,163,123,0.08)", border: "rgba(18,163,123,0.18)", icon: CheckCircle2 };
  }

  if (status === "PROCESSING" || status === "PENDING" || status === "PENDING_PAYMENT" || status === "QUEUED") {
    return { color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.18)", icon: Clock3 };
  }

  return { color: "#EF4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.18)", icon: XCircle };
}

function isProPlan(plan?: string | null) {
  return plan === "PRO";
}

function isStarterPlan(plan?: string | null) {
  return plan === "STARTER";
}

export function DashboardPage() {
  const { isAuthenticated, user, status } = useAuth();
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [usage, setUsage] = useState<ScanUsageSummary | null>(null);
  const [billing, setBilling] = useState<BillingHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [topupAmount, setTopupAmount] = useState("2500");
  const [topupBusy, setTopupBusy] = useState(false);

  const loadDashboard = async () => {
    if (!isAuthenticated) return;
    const canAccessWallet = user?.plan !== "FREE";

    setLoading(true);
    try {
      const [walletResult, scansResult, usageResult, billingResult] = await Promise.allSettled([
        canAccessWallet ? api.getWallet() : Promise.resolve(null),
        api.getScans(1, 25),
        api.getScanUsage(),
        api.getBillingHistory(),
      ]);

      setWallet(walletResult.status === "fulfilled" ? walletResult.value : null);
      setScans(scansResult.status === "fulfilled" ? scansResult.value.items : []);
      setUsage(usageResult.status === "fulfilled" ? usageResult.value : null);
      setBilling(billingResult.status === "fulfilled" ? billingResult.value.items ?? [] : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    try {
      const rows = scans.map((s) => ({
        scanCode: s.scanCode,
        fileName: s.fileName,
        status: s.status,
        verificationStatus: s.verificationStatus,
        paymentStatus: s.paymentStatus,
        trustScore: typeof s.trustScore === "number" ? s.trustScore : "",
        createdAt: s.createdAt,
      }));

      const header = Object.keys(rows[0] ?? {}).join(",") + "\n";
      const body = rows.map((r) => Object.values(r).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const csv = header + body;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certafrica_scans_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Export started");
    } catch (err) {
      toast.error("Unable to export CSV");
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      void loadDashboard();
    }
  }, [isAuthenticated]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return scans;

    return scans.filter((scan) =>
      [scan.fileName, scan.scanCode, scan.status, scan.paymentStatus, scan.verificationStatus].some((value) => value.toLowerCase().includes(query)),
    );
  }, [search, scans]);

  const summary = useMemo(() => {
    const verified = scans.filter((scan) => scan.verificationStatus === "VERIFIED").length;
    const flagged = scans.filter((scan) => scan.verificationStatus === "FLAGGED" || scan.verificationStatus === "FAILED").length;
    const processing = scans.filter((scan) => scan.status === "QUEUED" || scan.status === "PROCESSING").length;
    const average = scans.length ? Math.round(scans.reduce((total, scan) => total + (typeof scan.trustScore === "number" ? scan.trustScore : 0), 0) / scans.length) : 0;

    return { verified, flagged, processing, average };
  }, [scans]);

  const handleTopup = async () => {
    const amount = Number.parseFloat(topupAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid top-up amount.");
      return;
    }

    setTopupBusy(true);
    try {
      const result = await api.topupWallet(amount);
      const checkoutUrl = extractCheckoutUrl(result.checkout);
      toast.success("Top-up checkout created.");
      if (checkoutUrl) {
        window.open(checkoutUrl, "_blank", "noopener,noreferrer");
      }
      await loadDashboard();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start the wallet top-up.");
    } finally {
      setTopupBusy(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-[calc(100vh-64px)] pt-16 flex items-center justify-center">
        <Loader2 className="animate-spin" size={28} color="#12A37B" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-16 px-6 md:px-10 py-12">
        <div className="max-w-4xl mx-auto rounded-3xl p-8 md:p-10" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5" style={{ background: "rgba(18,163,123,0.12)", border: "1px solid rgba(18,163,123,0.24)" }}>
            <ShieldCheck size={14} color="#12A37B" />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#12A37B", letterSpacing: "0.08em" }}>AUTH REQUIRED</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4vw, 2.8rem)", color: "#F0F6FF", lineHeight: 1.1, marginBottom: "10px" }}>Dashboard locked until sign in.</h1>
          <p style={{ color: "rgba(176,196,222,0.7)", maxWidth: "62ch", lineHeight: 1.7 }}>
            The backend protects scan history, wallet data, and payment verification with bearer token auth. Sign in from the verification page first.
          </p>
          <Link to="/verify" className="inline-flex items-center gap-2 rounded-xl px-4 py-3 no-underline mt-4" style={{ background: "linear-gradient(135deg, #0F6E56, #12A37B)", color: "white", fontWeight: 600 }}>
            <Upload size={16} />
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  const proPlan = isProPlan(user?.plan);
  const starterPlan = isStarterPlan(user?.plan);
  const freePlan = !proPlan && !starterPlan;
  const planLabel = proPlan ? "Pro workspace" : starterPlan ? "Starter workspace" : "Free workspace";
  const planBadge = proPlan ? "PRO" : starterPlan ? "STARTER" : "FREE";

  return (
    <div className="min-h-screen pt-16 px-6 md:px-10 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs" style={{ color: "rgba(176,196,222,0.45)", letterSpacing: "0.08em" }}>
              <Link to="/" className="no-underline" style={{ color: "inherit" }}>Home</Link>
              <ChevronRight size={10} />
              <span style={{ color: "#12A37B" }}>Dashboard</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3" style={{ background: proPlan ? "rgba(18,163,123,0.12)" : "rgba(245,158,11,0.12)", border: `1px solid ${proPlan ? "rgba(18,163,123,0.25)" : "rgba(245,158,11,0.25)"}` }}>
              <Sparkles size={13} color={proPlan ? "#12A37B" : "#F59E0B"} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: proPlan ? "#12A37B" : "#F59E0B", letterSpacing: "0.08em" }}>{planBadge}</span>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.9rem, 4vw, 2.8rem)", color: "#F0F6FF", lineHeight: 1.1, marginBottom: "8px" }}>
              {planLabel}
            </h1>
            <p style={{ color: "rgba(176,196,222,0.65)", maxWidth: "58ch" }}>
              {proPlan
                ? "Monitor rollover scans, wallet deductions, and priority verification analytics."
                : starterPlan
                  ? "Track monthly scan usage, wallet funding, and discounted scan pricing."
                  : "Use your free scans each month or pay per verification when you run out."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => void loadDashboard()} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(176,196,222,0.82)" }}>
              <TrendingUp size={14} />
              Refresh data
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <QuickActions
          onUpload={() => (window.location.href = "/verify")}
          onBulk={() => (window.location.href = "/bulk")}
          onExport={exportCsv}
          onInvite={() => (window.location.href = "/team")}
          onTopup={() => (window.location.href = "/wallet")}
        />

        {proPlan ? (
          <ProDashboard
            userName={user?.name ?? "Workspace"}
            wallet={wallet}
            usage={usage}
            billing={billing}
            scans={scans}
            filtered={filtered}
            search={search}
            setSearch={setSearch}
            summary={summary}
            loading={loading}
            topupAmount={topupAmount}
            setTopupAmount={setTopupAmount}
            topupBusy={topupBusy}
            handleTopup={handleTopup}
          />
        ) : starterPlan ? (
          <StarterDashboard
            userName={user?.name ?? "Workspace"}
            wallet={wallet}
            usage={usage}
            scans={scans}
            filtered={filtered}
            search={search}
            setSearch={setSearch}
            summary={summary}
            loading={loading}
            topupAmount={topupAmount}
            setTopupAmount={setTopupAmount}
            topupBusy={topupBusy}
            handleTopup={handleTopup}
          />
        ) : (
          <FreeDashboard
            userName={user?.name ?? "Workspace"}
            usage={usage}
            scans={scans}
            filtered={filtered}
            search={search}
            setSearch={setSearch}
            summary={summary}
            loading={loading}
          />
        )}
      </div>
    </div>
  );
}

function ProDashboard({
  userName,
  wallet,
  usage,
  billing,
  scans,
  filtered,
  search,
  setSearch,
  summary,
  loading,
  topupAmount,
  setTopupAmount,
  topupBusy,
  handleTopup,
}: {
  userName: string;
  wallet: WalletType | null;
  usage: ScanUsageSummary | null;
  billing: BillingHistoryItem[];
  scans: Scan[];
  filtered: Scan[];
  search: string;
  setSearch: (value: string) => void;
  summary: { verified: number; flagged: number; processing: number; average: number };
  loading: boolean;
  topupAmount: string;
  setTopupAmount: (value: string) => void;
  topupBusy: boolean;
  handleTopup: () => Promise<void>;
}) {
  return (
    <div className="grid xl:grid-cols-[0.9fr_1.1fr] gap-6 items-start">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Wallet balance", value: wallet ? formatCurrency(wallet.balance, wallet.currency) : "—", icon: Wallet, accent: "#12A37B" },
            { label: "Rollover scans", value: usage ? String(usage.rolloverBalance) : "—", icon: Sparkles, accent: "#12A37B" },
            { label: "Monthly remaining", value: usage ? String(usage.monthlyRemaining) : "—", icon: FileText, accent: "#3B8BD4" },
            { label: "Verified scans", value: String(summary.verified), icon: CheckCircle2, accent: "#12A37B" },
            { label: "Processing", value: String(summary.processing), icon: Clock3, accent: "#F59E0B" },
          ].map((card) => (
            <div key={card.label} className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center justify-between mb-3"><card.icon size={16} color={card.accent} /><span style={{ fontSize: "9px", color: "rgba(176,196,222,0.34)", letterSpacing: "0.08em" }}>LIVE</span></div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", color: card.accent, lineHeight: 1, marginBottom: "6px" }}>{card.value}</div>
              <div style={{ color: "#F0F6FF", fontSize: "12.5px", fontWeight: 600 }}>{card.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.38)", letterSpacing: "0.08em" }}>WALLET</div>
              <div style={{ color: "#F0F6FF", marginTop: "4px" }}>{wallet ? formatCurrency(wallet.balance, wallet.currency) : "No wallet data"}</div>
            </div>
            <CreditCard size={16} color="#12A37B" />
          </div>
          <div className="space-y-3 mb-5" style={{ color: "rgba(176,196,222,0.72)" }}>
            <div className="flex items-center justify-between"><span>User</span><span style={{ color: "#F0F6FF" }}>{userName}</span></div>
            <div className="flex items-center justify-between"><span>Plan</span><span style={{ color: "#F0F6FF" }}>PRO</span></div>
            <div className="flex items-center justify-between"><span>Monthly reset</span><span style={{ color: "#F0F6FF" }}>{usage?.resetAt ? new Date(usage.resetAt).toLocaleDateString() : "—"}</span></div>
            <div className="flex items-center justify-between"><span>Risk flags</span><span style={{ color: summary.flagged ? "#EF4444" : "#12A37B" }}>{summary.flagged}</span></div>
          </div>
          <div className="flex gap-3">
            <input value={topupAmount} onChange={(event) => setTopupAmount(event.target.value)} className="flex-1 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F0F6FF" }} placeholder="Top-up amount" />
            <button type="button" onClick={() => void handleTopup()} disabled={topupBusy} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 transition-opacity disabled:opacity-60" style={{ background: "linear-gradient(135deg, #0F6E56, #12A37B)", color: "white", fontWeight: 600 }}>
              {topupBusy ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              Top up
            </button>
          </div>
        </div>

        <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.38)", letterSpacing: "0.08em" }}>WORKFLOW</div>
              <div style={{ color: "#F0F6FF", marginTop: "4px" }}>Current backend status</div>
            </div>
            {loading && <Loader2 size={16} className="animate-spin" color="#12A37B" />}
          </div>
          <div className="space-y-3">
            {[
              { label: "Scans queued", value: summary.processing, tone: "#F59E0B" },
              { label: "Verified", value: summary.verified, tone: "#12A37B" },
              { label: "Needs review", value: summary.flagged, tone: "#EF4444" },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span style={{ color: "rgba(176,196,222,0.68)", fontSize: "12px" }}>{item.label}</span>
                  <span style={{ color: item.tone, fontSize: "12px", fontWeight: 600 }}>{item.value}</span>
                </div>
                <div style={{ height: "6px", borderRadius: "999px", background: "rgba(255,255,255,0.05)" }}>
                  <div style={{ width: `${Math.min(100, item.value * 12 + 8)}%`, height: "100%", borderRadius: "inherit", background: item.tone }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.38)", letterSpacing: "0.08em" }}>BILLING HISTORY</div>
              <div style={{ color: "#F0F6FF", marginTop: "4px" }}>Latest subscription charges</div>
            </div>
            <CreditCard size={16} color="#12A37B" />
          </div>
          <div className="space-y-3">
            {billing.length === 0 ? (
              <div className="rounded-2xl p-4 text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(176,196,222,0.65)" }}>
                No billing history yet. Your next renewal will appear here.
              </div>
            ) : (
              billing.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div>
                    <div style={{ color: "#F0F6FF", fontSize: "13px", fontWeight: 600 }}>{item.plan} subscription</div>
                    <div style={{ color: "rgba(176,196,222,0.6)", fontSize: "11px" }}>{new Date(item.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ color: "#12A37B", fontWeight: 600 }}>{formatCurrency(item.amount)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.38)", letterSpacing: "0.08em" }}>SCAN HISTORY</div>
              <div style={{ color: "#F0F6FF", marginTop: "4px" }}>{filtered.length} records</div>
            </div>
            <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Search size={13} color="rgba(176,196,222,0.5)" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search scans" className="bg-transparent outline-none" style={{ color: "#F0F6FF", fontSize: "12px", width: "170px" }} />
            </div>
          </div>

          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-2xl p-5 text-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(176,196,222,0.65)" }}>
                No scans found. Start a new verification to populate your dashboard.
              </div>
            ) : (
              filtered.map((scan, index) => {
                const tone = statusTone(scan.verificationStatus);
                return (
                  <motion.div key={scan.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
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
                        <div className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5" style={{ background: tone.bg, border: `1px solid ${tone.border}`, color: tone.color, fontSize: "10px", letterSpacing: "0.08em" }}>
                          <tone.icon size={10} />
                          {scan.verificationStatus}
                        </div>
                        <div style={{ color: "rgba(176,196,222,0.45)", fontSize: "10px", marginTop: "8px" }}>{new Date(scan.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 mt-4">
                      <div style={{ color: "rgba(176,196,222,0.6)", fontSize: "12px" }}>
                        {scan.trustScore !== null && scan.trustScore !== undefined ? `Trust score ${Math.round(scan.trustScore)}` : "Awaiting analysis"}
                      </div>
                      <Link to={`/results/${scan.id}`} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 no-underline" style={{ background: "rgba(18,163,123,0.1)", border: "1px solid rgba(18,163,123,0.18)", color: "#12A37B", fontSize: "12px" }}>
                        Open report
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StarterDashboard({
  userName,
  wallet,
  usage,
  scans,
  filtered,
  search,
  setSearch,
  summary,
  loading,
  topupAmount,
  setTopupAmount,
  topupBusy,
  handleTopup,
}: {
  userName: string;
  wallet: WalletType | null;
  usage: ScanUsageSummary | null;
  scans: Scan[];
  filtered: Scan[];
  search: string;
  setSearch: (value: string) => void;
  summary: { verified: number; flagged: number; processing: number; average: number };
  loading: boolean;
  topupAmount: string;
  setTopupAmount: (value: string) => void;
  topupBusy: boolean;
  handleTopup: () => Promise<void>;
}) {
  const shownScans = scans.slice(0, 5);

  return (
    <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6 items-start">
      <div className="space-y-6">
        <div className="rounded-3xl p-7" style={{ background: "linear-gradient(160deg, rgba(245,158,11,0.12), rgba(255,255,255,0.03))", border: "1px solid rgba(245,158,11,0.18)" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(59,139,212,0.12)", border: "1px solid rgba(59,139,212,0.22)" }}>
            <Sparkles size={13} color="#F59E0B" />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#3B8BD4", letterSpacing: "0.08em" }}>STARTER PLAN</span>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: "#F0F6FF", lineHeight: 1.15, marginBottom: "10px" }}>
            Built for quick checks and a clean upgrade path.
          </h2>
          <p style={{ color: "rgba(176,196,222,0.68)", maxWidth: "60ch", lineHeight: 1.7 }}>
            Starter users get monthly scans from the usage endpoint plus discounted pricing when you exceed your quota. Wallet balance can cover extra scans before card checkout.
          </p>

          <div className="grid sm:grid-cols-3 gap-3 mt-6">
            {[
              { label: "Recent scans", value: String(scans.length) },
              { label: "Monthly quota", value: usage ? `${usage.monthlyLimit} scans` : "—" },
              { label: "Remaining", value: usage ? `${usage.monthlyRemaining}` : "—" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: "rgba(176,196,222,0.36)", letterSpacing: "0.08em", marginBottom: "4px" }}>{item.label.toUpperCase()}</div>
                <div style={{ color: "#F0F6FF", fontSize: "13px", fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.38)", letterSpacing: "0.08em" }}>WALLET</div>
              <div style={{ color: "#F0F6FF", marginTop: "4px" }}>{wallet ? formatCurrency(wallet.balance, wallet.currency) : "No wallet data"}</div>
            </div>
            <Wallet size={16} color="#12A37B" />
          </div>
          <div className="flex items-center justify-between text-xs mb-4" style={{ color: "rgba(176,196,222,0.7)" }}>
            <span>Monthly reset</span>
            <span style={{ color: "#F0F6FF" }}>{usage?.resetAt ? new Date(usage.resetAt).toLocaleDateString() : "—"}</span>
          </div>
          <div className="flex gap-3">
            <input value={topupAmount} onChange={(event) => setTopupAmount(event.target.value)} className="flex-1 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F0F6FF" }} placeholder="Top-up amount" />
            <button type="button" onClick={() => void handleTopup()} disabled={topupBusy} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 transition-opacity disabled:opacity-60" style={{ background: "linear-gradient(135deg, #0F6E56, #12A37B)", color: "white", fontWeight: 600 }}>
              {topupBusy ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              Fund wallet
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Verified", value: String(summary.verified), color: "#12A37B" },
            { label: "Queued", value: String(summary.processing), color: "#F59E0B" },
            { label: "Flags", value: String(summary.flagged), color: "#EF4444" },
          ].map((card) => (
            <div key={card.label} className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", color: card.color, lineHeight: 1, marginBottom: "6px" }}>{card.value}</div>
              <div style={{ color: "#F0F6FF", fontSize: "12.5px", fontWeight: 600 }}>{card.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.38)", letterSpacing: "0.08em" }}>QUICK START</div>
              <div style={{ color: "#F0F6FF", marginTop: "4px" }}>What you can do next</div>
            </div>
            <ArrowRight size={16} color="#F59E0B" />
          </div>
          <div className="space-y-3">
            {[
              "Upload a certificate from the verification page.",
              "Monthly scans reset automatically at the next billing cycle.",
              "Top up wallet to cover extra scans after the quota.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <CheckCircle2 size={14} color="#12A37B" className="mt-0.5" />
                <span style={{ color: "rgba(176,196,222,0.72)", fontSize: "13px", lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
          <Link to="/verify" className="inline-flex items-center gap-2 rounded-xl px-4 py-3 no-underline mt-5" style={{ background: "linear-gradient(135deg, #0F6E56, #12A37B)", color: "white", fontWeight: 600 }}>
            <Upload size={16} />
            Upload certificate
          </Link>
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.38)", letterSpacing: "0.08em" }}>RECENT SCANS</div>
            <div style={{ color: "#F0F6FF", marginTop: "4px" }}>{filtered.length} records</div>
          </div>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <Search size={13} color="rgba(176,196,222,0.5)" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search scans" className="bg-transparent outline-none" style={{ color: "#F0F6FF", fontSize: "12px", width: "160px" }} />
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-2xl p-5 text-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(176,196,222,0.65)" }}>
              Your first uploaded scan will show up here.
            </div>
          ) : (
            shownScans.map((scan, index) => {
              const tone = statusTone(scan.verificationStatus);
              return (
                <motion.div key={scan.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div style={{ color: "#F0F6FF", fontSize: "13px", fontWeight: 600, marginBottom: "3px" }}>{scan.fileName}</div>
                      <div style={{ color: "rgba(176,196,222,0.52)", fontSize: "11px" }}>{scan.scanCode}</div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5" style={{ background: tone.bg, border: `1px solid ${tone.border}`, color: tone.color, fontSize: "10px", letterSpacing: "0.08em" }}>
                      <tone.icon size={10} />
                      {scan.verificationStatus}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-4">
                    <div style={{ color: "rgba(176,196,222,0.6)", fontSize: "12px" }}>
                      {scan.paymentStatus === "SUCCESS" ? "Payment complete" : `Payment ${scan.paymentStatus.toLowerCase()}`}
                    </div>
                    <Link to={`/results/${scan.id}`} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 no-underline" style={{ background: "rgba(18,163,123,0.1)", border: "1px solid rgba(18,163,123,0.18)", color: "#12A37B", fontSize: "12px" }}>
                      Open report
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function FreeDashboard({
  userName,
  usage,
  scans,
  filtered,
  search,
  setSearch,
  summary,
  loading,
}: {
  userName: string;
  usage: ScanUsageSummary | null;
  scans: Scan[];
  filtered: Scan[];
  search: string;
  setSearch: (value: string) => void;
  summary: { verified: number; flagged: number; processing: number; average: number };
  loading: boolean;
}) {
  return (
    <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6 items-start">
      <div className="space-y-6">
        <div className="rounded-3xl p-7" style={{ background: "linear-gradient(160deg, rgba(18,163,123,0.12), rgba(255,255,255,0.03))", border: "1px solid rgba(18,163,123,0.18)" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: "rgba(18,163,123,0.12)", border: "1px solid rgba(18,163,123,0.22)" }}>
            <Sparkles size={13} color="#12A37B" />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#12A37B", letterSpacing: "0.08em" }}>FREE PLAN</span>
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.6rem, 3vw, 2.4rem)", color: "#F0F6FF", lineHeight: 1.15, marginBottom: "10px" }}>
            {usage ? `${usage.monthlyLimit} free verifications every month.` : "Free verifications every month."}
          </h2>
          <p style={{ color: "rgba(176,196,222,0.68)", maxWidth: "60ch", lineHeight: 1.7 }}>
            After your free scans are used, each verification costs ₦500. Monthly scans reset automatically and unused scans do not roll over.
          </p>

          <div className="grid sm:grid-cols-3 gap-3 mt-6">
            {[
              { label: "Used", value: usage ? `${usage.monthlyUsed}` : "—" },
              { label: "Monthly quota", value: usage ? `${usage.monthlyLimit}` : "—" },
              { label: "Remaining", value: usage ? `${usage.monthlyRemaining}` : "—" },
              { label: "Monthly reset", value: usage?.resetAt ? new Date(usage.resetAt).toLocaleDateString() : "—" },
              { label: "Pay per scan", value: "₦500" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: "rgba(176,196,222,0.36)", letterSpacing: "0.08em", marginBottom: "4px" }}>{item.label.toUpperCase()}</div>
                <div style={{ color: "#F0F6FF", fontSize: "13px", fontWeight: 600 }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Verified", value: String(summary.verified), color: "#12A37B" },
            { label: "Queued", value: String(summary.processing), color: "#F59E0B" },
            { label: "Flags", value: String(summary.flagged), color: "#EF4444" },
          ].map((card) => (
            <div key={card.label} className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", color: card.color, lineHeight: 1, marginBottom: "6px" }}>{card.value}</div>
              <div style={{ color: "#F0F6FF", fontSize: "12.5px", fontWeight: 600 }}>{card.label}</div>
            </div>
          ))}
        </div>

        <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.38)", letterSpacing: "0.08em" }}>NEXT STEP</div>
              <div style={{ color: "#F0F6FF", marginTop: "4px" }}>Keep verifications running</div>
            </div>
            <AlertCircle size={16} color="#12A37B" />
          </div>
          <div className="space-y-3">
            {[
              "Use remaining free scans before the reset date.",
              "Pay ₦500 per scan after free scans are exhausted.",
              "Upgrade to Starter or Pro for discounted scans and wallet access.",
            ].map((item) => (
              <div key={item} className="flex items-start gap-3 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <CheckCircle2 size={14} color="#12A37B" className="mt-0.5" />
                <span style={{ color: "rgba(176,196,222,0.72)", fontSize: "13px", lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
          <Link to="/verify" className="inline-flex items-center gap-2 rounded-xl px-4 py-3 no-underline mt-5" style={{ background: "linear-gradient(135deg, #0F6E56, #12A37B)", color: "white", fontWeight: 600 }}>
            <Upload size={16} />
            Start verification
          </Link>
        </div>
      </div>

      <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.38)", letterSpacing: "0.08em" }}>RECENT SCANS</div>
            <div style={{ color: "#F0F6FF", marginTop: "4px" }}>{filtered.length} records</div>
          </div>
          <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <Search size={13} color="rgba(176,196,222,0.5)" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search scans" className="bg-transparent outline-none" style={{ color: "#F0F6FF", fontSize: "12px", width: "160px" }} />
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className="rounded-2xl p-5 text-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(176,196,222,0.65)" }}>
              Your first uploaded scan will show up here.
            </div>
          ) : (
            filtered.slice(0, 5).map((scan, index) => {
              const tone = statusTone(scan.verificationStatus);
              return (
                <motion.div key={scan.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div style={{ color: "#F0F6FF", fontSize: "13px", fontWeight: 600, marginBottom: "3px" }}>{scan.fileName}</div>
                      <div style={{ color: "rgba(176,196,222,0.52)", fontSize: "11px" }}>{scan.scanCode}</div>
                    </div>
                    <div className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5" style={{ background: tone.bg, border: `1px solid ${tone.border}`, color: tone.color, fontSize: "10px", letterSpacing: "0.08em" }}>
                      <tone.icon size={10} />
                      {scan.verificationStatus}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-4">
                    <div style={{ color: "rgba(176,196,222,0.6)", fontSize: "12px" }}>
                      {scan.paymentStatus === "SUCCESS" ? "Payment complete" : `Payment ${scan.paymentStatus.toLowerCase()}`}
                    </div>
                    <Link to={`/results/${scan.id}`} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 no-underline" style={{ background: "rgba(18,163,123,0.1)", border: "1px solid rgba(18,163,123,0.18)", color: "#12A37B", fontSize: "12px" }}>
                      Open report
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
