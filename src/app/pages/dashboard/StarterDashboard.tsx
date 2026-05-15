import { Link } from "react-router";
import { CreditCard, Loader2, Search, Sparkles, Upload, Wallet, Zap } from "lucide-react";
import type { Scan, ScanUsageSummary, Wallet as WalletType } from "../../lib/types";
import { formatFriendlyDate } from "../../lib/date";
import { DashboardSummary, EmptyState, ProgressBar, ScanRow, StatCard, formatCurrency } from "./shared";

interface Props {
  wallet: WalletType | null;
  usage: ScanUsageSummary | null;
  scans: Scan[];
  filtered: Scan[];
  search: string;
  setSearch: (value: string) => void;
  topupAmount: string;
  setTopupAmount: (value: string) => void;
  topupBusy: boolean;
  handleTopup: () => Promise<void>;
}

export function StarterDashboard({
  wallet,
  usage,
  scans,
  filtered,
  search,
  setSearch,
  topupAmount,
  setTopupAmount,
  topupBusy,
  handleTopup,
}: Props) {
  const summary = DashboardSummary(scans);
  const used = usage?.monthlyUsed ?? 0;
  const limit = usage?.monthlyLimit ?? 0;
  const walletBalance = wallet ? Number(wallet.balance) : 0;

  return (
    <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6 items-start">
      <div className="space-y-6">
        {/* Hero */}
        <div
          className="rounded-3xl p-7 certafrica-fade-in"
          style={{
            background: "linear-gradient(160deg, rgba(59,139,212,0.14), rgba(255,255,255,0.03))",
            border: "1px solid rgba(59,139,212,0.18)",
          }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{ background: "rgba(59,139,212,0.12)", border: "1px solid rgba(59,139,212,0.22)" }}
          >
            <Sparkles size={13} color="#3B8BD4" />
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "10px",
                color: "#3B8BD4",
                letterSpacing: "0.08em",
              }}
            >
              STARTER PLAN
            </span>
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(1.6rem, 3vw, 2.2rem)",
              color: "#F0F6FF",
              lineHeight: 1.15,
              marginBottom: "10px",
            }}
          >
            {usage ? `${usage.monthlyRemaining} scans left this month` : "Starter workspace"}
          </h2>
          <p style={{ color: "rgba(176,196,222,0.68)", maxWidth: "60ch", lineHeight: 1.7, marginBottom: "24px" }}>
            Use your monthly quota first. After that, ₦400 per scan comes out of your wallet automatically.
          </p>

          <ProgressBar
            value={used}
            max={limit || 1}
            color="#3B8BD4"
            label={`Used ${used} of ${limit}`}
            rightLabel={usage?.resetAt ? `Resets ${formatFriendlyDate(usage.resetAt)}` : ""}
          />

          <div className="flex flex-wrap gap-3 mt-6">
            <Link
              to="/verify"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-3 no-underline"
              style={{
                background: "linear-gradient(135deg, #0F6E56, #12A37B)",
                color: "white",
                fontWeight: 600,
              }}
            >
              <Upload size={16} />
              Verify a document
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-3 no-underline"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#F0F6FF",
              }}
            >
              <Zap size={16} />
              Upgrade to Pro
            </Link>
          </div>
        </div>

        {/* Wallet */}
        <div
          className="rounded-3xl p-6"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "10px",
                  color: "rgba(176,196,222,0.38)",
                  letterSpacing: "0.08em",
                }}
              >
                WALLET
              </div>
              <div style={{ color: "#F0F6FF", marginTop: "4px", fontSize: "1.2rem" }}>
                {wallet ? formatCurrency(wallet.balance, wallet.currency) : "No wallet data"}
              </div>
              {walletBalance < 1000 && (
                <div style={{ color: "#F59E0B", fontSize: "11px", marginTop: "4px" }}>
                  Low balance. Top up to keep verifying.
                </div>
              )}
            </div>
            <Wallet size={16} color="#12A37B" />
          </div>
          <div className="flex gap-2">
            <input
              value={topupAmount}
              onChange={(event) => setTopupAmount(event.target.value)}
              className="flex-1 rounded-xl px-4 py-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#F0F6FF",
              }}
              placeholder="Amount in NGN"
            />
            <button
              type="button"
              onClick={() => void handleTopup()}
              disabled={topupBusy}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-3 transition-opacity disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #0F6E56, #12A37B)",
                color: "white",
                fontWeight: 600,
              }}
            >
              {topupBusy ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              Top up
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Verified" value={String(summary.verified)} icon={Sparkles} accent="#12A37B" />
          <StatCard label="In queue" value={String(summary.processing)} icon={Sparkles} accent="#F59E0B" />
          <StatCard label="Flagged" value={String(summary.flagged)} icon={Sparkles} accent="#EF4444" />
        </div>
      </div>

      {/* Right */}
      <div
        className="rounded-3xl p-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "10px",
                color: "rgba(176,196,222,0.38)",
                letterSpacing: "0.08em",
              }}
            >
              RECENT SCANS
            </div>
            <div style={{ color: "#F0F6FF", marginTop: "4px" }}>{filtered.length} records</div>
          </div>
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Search size={13} color="rgba(176,196,222,0.5)" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search scans"
              className="bg-transparent outline-none"
              style={{ color: "#F0F6FF", fontSize: "12px", width: "160px" }}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No scans yet"
            description="Upload your first certificate to see results here."
            action={{ label: "Start verifying", to: "/verify" }}
          />
        ) : (
          <div className="space-y-3">
            {filtered.slice(0, 6).map((scan, index) => (
              <ScanRow key={scan.id} scan={scan} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}