import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ChevronRight, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { api, extractCheckoutUrl } from "../lib/api";
import type { BillingHistoryItem, Scan, ScanUsageSummary, Wallet as WalletType } from "../lib/types";
import { SkeletonScanList, SkeletonStatGrid } from "../components/Skeletons";
import { FreeDashboard } from "./dashboard/FreeDashboard";
import { StarterDashboard } from "./dashboard/StarterDashboard";
import { ProDashboard } from "./dashboard/ProDashboard";

export function DashboardPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [scans, setScans] = useState<Scan[]>([]);
  const [usage, setUsage] = useState<ScanUsageSummary | null>(null);
  const [billing, setBilling] = useState<BillingHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [topupAmount, setTopupAmount] = useState("2500");
  const [topupBusy, setTopupBusy] = useState(false);

  const plan = user?.plan ?? "FREE";

  const loadDashboard = useCallback(async () => {
    const canAccessWallet = plan !== "FREE";
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
  }, [plan]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return scans;
    return scans.filter((scan) =>
      [scan.fileName, scan.scanCode, scan.status, scan.paymentStatus, scan.verificationStatus].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [search, scans]);

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

  const planLabel = plan === "PRO" ? "Pro workspace" : plan === "STARTER" ? "Starter workspace" : "Free workspace";
  const planBadgeColor = plan === "PRO" ? "#12A37B" : plan === "STARTER" ? "#3B8BD4" : "#F59E0B";
  const planSubtitle =
    plan === "PRO"
      ? "Monitor rollover scans, wallet deductions, and priority verification analytics."
      : plan === "STARTER"
        ? "Track monthly scan usage, wallet funding, and discounted scan pricing."
        : "Use your free scans each month or pay per verification when you run out.";

  return (
    <div className="min-h-screen pt-16 px-6 md:px-10 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
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
              <span style={{ color: "#12A37B" }}>Dashboard</span>
            </div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3"
              style={{
                background: `${planBadgeColor}1f`,
                border: `1px solid ${planBadgeColor}40`,
              }}
            >
              <Sparkles size={13} color={planBadgeColor} />
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "10px",
                  color: planBadgeColor,
                  letterSpacing: "0.08em",
                }}
              >
                {plan}
              </span>
            </div>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(1.9rem, 4vw, 2.8rem)",
                color: "#F0F6FF",
                lineHeight: 1.1,
                marginBottom: "8px",
              }}
            >
              {planLabel}
            </h1>
            <p style={{ color: "rgba(176,196,222,0.65)", maxWidth: "58ch" }}>{planSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 transition-opacity disabled:opacity-60"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(176,196,222,0.82)",
            }}
          >
            <TrendingUp size={14} />
            Refresh
          </button>
        </div>

        {/* Loading state */}
        {loading ? (
          <div className="space-y-6">
            <SkeletonStatGrid count={plan === "PRO" ? 4 : 3} />
            <SkeletonScanList count={4} />
          </div>
        ) : plan === "PRO" ? (
          <ProDashboard
            userName={user?.name ?? "Workspace"}
            wallet={wallet}
            usage={usage}
            billing={billing}
            scans={scans}
            filtered={filtered}
            search={search}
            setSearch={setSearch}
            loading={loading}
            topupAmount={topupAmount}
            setTopupAmount={setTopupAmount}
            topupBusy={topupBusy}
            handleTopup={handleTopup}
          />
        ) : plan === "STARTER" ? (
          <StarterDashboard
            wallet={wallet}
            usage={usage}
            scans={scans}
            filtered={filtered}
            search={search}
            setSearch={setSearch}
            topupAmount={topupAmount}
            setTopupAmount={setTopupAmount}
            topupBusy={topupBusy}
            handleTopup={handleTopup}
          />
        ) : (
          <FreeDashboard
            usage={usage}
            scans={scans}
            filtered={filtered}
            search={search}
            setSearch={setSearch}
          />
        )}
      </div>
    </div>
  );
}