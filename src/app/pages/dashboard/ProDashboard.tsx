import { Link } from "react-router";
import {
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  Loader2,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { BillingHistoryItem, Scan, ScanUsageSummary, Wallet as WalletType } from "../../lib/types";
import { formatFriendlyDate } from "../../lib/date";
import { DashboardSummary, EmptyState, ProgressBar, ScanRow, StatCard, formatCurrency } from "./shared";

interface Props {
  userName: string;
  wallet: WalletType | null;
  usage: ScanUsageSummary | null;
  billing: BillingHistoryItem[];
  scans: Scan[];
  filtered: Scan[];
  search: string;
  setSearch: (value: string) => void;
  loading: boolean;
  topupAmount: string;
  setTopupAmount: (value: string) => void;
  topupBusy: boolean;
  handleTopup: () => Promise<void>;
}

export function ProDashboard({
  userName,
  wallet,
  usage,
  billing,
  scans,
  filtered,
  search,
  setSearch,
  loading,
  topupAmount,
  setTopupAmount,
  topupBusy,
  handleTopup,
}: Props) {
  const summary = DashboardSummary(scans);
  const used = usage?.monthlyUsed ?? 0;
  const limit = usage?.monthlyLimit ?? 0;

  return (
    <div className="grid xl:grid-cols-[0.9fr_1.1fr] gap-6 items-start">
      <div className="space-y-6">
        {/* Stat grid */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
          <StatCard
            label="Wallet balance"
            value={wallet ? formatCurrency(wallet.balance, wallet.currency) : "—"}
            icon={Wallet}
            accent="#12A37B"
          />
          <StatCard
            label="Rollover scans"
            value={usage ? String(usage.rolloverBalance) : "—"}
            icon={Sparkles}
            accent="#12A37B"
          />
          <StatCard
            label="Verified"
            value={String(summary.verified)}
            icon={CheckCircle2}
            accent="#12A37B"
          />
          <StatCard
            label="Processing"
            value={String(summary.processing)}
            icon={Clock3}
            accent="#F59E0B"
          />
        </div>

        {/* Usage panel */}
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
                MONTHLY USAGE
              </div>
              <div style={{ color: "#F0F6FF", marginTop: "4px" }}>
                {usage?.resetAt ? `Resets ${formatFriendlyDate(usage.resetAt)}` : "—"}
              </div>
            </div>
            <TrendingUp size={16} color="#12A37B" />
          </div>
          <ProgressBar
            value={used}
            max={limit || 1}
            label={`${used} of ${limit} scans used`}
            rightLabel={`${usage?.monthlyRemaining ?? 0} remaining`}
          />
        </div>

        {/* Wallet management */}
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
              <div style={{ color: "#F0F6FF", marginTop: "4px" }}>
                {wallet ? formatCurrency(wallet.balance, wallet.currency) : "No wallet data"}
              </div>
            </div>
            <CreditCard size={16} color="#12A37B" />
          </div>
          <div className="space-y-2 mb-4 text-sm" style={{ color: "rgba(176,196,222,0.72)" }}>
            <div className="flex items-center justify-between">
              <span>User</span>
              <span style={{ color: "#F0F6FF" }}>{userName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Plan</span>
              <span style={{ color: "#12A37B" }}>PRO</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Risk flags</span>
              <span style={{ color: summary.flagged ? "#EF4444" : "#12A37B" }}>{summary.flagged}</span>
            </div>
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
              placeholder="Top-up amount"
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

        {/* Quick actions */}
        <div
          className="rounded-3xl p-6"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "10px",
              color: "rgba(176,196,222,0.38)",
              letterSpacing: "0.08em",
              marginBottom: "12px",
            }}
          >
            QUICK ACTIONS
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              to="/bulk"
              className="rounded-xl px-4 py-3 no-underline flex items-center gap-2"
              style={{
                background: "rgba(18,163,123,0.08)",
                border: "1px solid rgba(18,163,123,0.18)",
                color: "#12A37B",
                fontSize: "13px",
              }}
            >
              <FileText size={14} />
              Bulk upload
            </Link>
            <Link
              to="/team"
              className="rounded-xl px-4 py-3 no-underline flex items-center gap-2"
              style={{
                background: "rgba(59,139,212,0.08)",
                border: "1px solid rgba(59,139,212,0.18)",
                color: "#3B8BD4",
                fontSize: "13px",
              }}
            >
              <Users size={14} />
              Invite team
            </Link>
          </div>
        </div>
      </div>

      {/* Right column */}
      <div className="space-y-6">
        {/* Billing */}
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
                BILLING HISTORY
              </div>
              <div style={{ color: "#F0F6FF", marginTop: "4px" }}>Latest subscription charges</div>
            </div>
            <CreditCard size={16} color="#12A37B" />
          </div>
          <div className="space-y-3">
            {billing.length === 0 ? (
              <EmptyState
                title="No billing history yet"
                description="Your next renewal will appear here."
              />
            ) : (
              billing.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-2xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div>
                    <div style={{ color: "#F0F6FF", fontSize: "13px", fontWeight: 600 }}>
                      {item.plan} subscription
                    </div>
                    <div style={{ color: "rgba(176,196,222,0.6)", fontSize: "11px" }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ color: "#12A37B", fontWeight: 600 }}>{formatCurrency(item.amount)}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Scan history */}
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
                SCAN HISTORY
              </div>
              <div style={{ color: "#F0F6FF", marginTop: "4px" }}>{filtered.length} records</div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <Search size={13} color="rgba(176,196,222,0.5)" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search scans"
                  className="bg-transparent outline-none"
                  style={{ color: "#F0F6FF", fontSize: "12px", width: "170px" }}
                />
              </div>
              {loading && <Loader2 size={16} className="animate-spin" color="#12A37B" />}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="No scans found"
              description="Start a new verification or adjust your search."
              action={{ label: "New verification", to: "/verify" }}
            />
          ) : (
            <div className="space-y-3">
              {filtered.map((scan, index) => (
                <ScanRow key={scan.id} scan={scan} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}