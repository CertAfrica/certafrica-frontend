import { Link } from "react-router";
import { ArrowUpRight, CheckCircle2, FileText, Search, Sparkles, Upload, Zap } from "lucide-react";
import type { Scan, ScanUsageSummary } from "../../lib/types";
import { DashboardSummary, EmptyState, ProgressBar, ScanRow, StatCard } from "./shared";

interface Props {
  usage: ScanUsageSummary | null;
  scans: Scan[];
  filtered: Scan[];
  search: string;
  setSearch: (value: string) => void;
}

export function FreeDashboard({ usage, scans, filtered, search, setSearch }: Props) {
  const summary = DashboardSummary(scans);
  const used = usage?.monthlyUsed ?? 0;
  const limit = usage?.monthlyLimit ?? 0;

  return (
    <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
      <div className="space-y-6">
        {/* Hero card with usage ring */}
        <div
          className="rounded-3xl p-7 certafrica-fade-in"
          style={{
            background: "linear-gradient(160deg, rgba(18,163,123,0.14), rgba(255,255,255,0.03))",
            border: "1px solid rgba(18,163,123,0.18)",
          }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
            style={{ background: "rgba(18,163,123,0.12)", border: "1px solid rgba(18,163,123,0.22)" }}
          >
            <Sparkles size={13} color="#12A37B" />
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "10px",
                color: "#12A37B",
                letterSpacing: "0.08em",
              }}
            >
              FREE PLAN
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
            {usage ? `${usage.monthlyRemaining} verifications left this month` : "Free verifications every month"}
          </h2>
          <p style={{ color: "rgba(176,196,222,0.68)", maxWidth: "60ch", lineHeight: 1.7, marginBottom: "24px" }}>
            After your free scans run out, each verification costs ₦500. Quota resets on the first of each month.
          </p>

          <ProgressBar
            value={used}
            max={limit || 1}
            label={`Used ${used} of ${limit}`}
            rightLabel={usage?.resetAt ? `Resets ${new Date(usage.resetAt).toLocaleDateString()}` : ""}
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
              Upgrade plan
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Verified" value={String(summary.verified)} icon={CheckCircle2} accent="#12A37B" />
          <StatCard label="In queue" value={String(summary.processing)} icon={FileText} accent="#F59E0B" />
          <StatCard label="Flagged" value={String(summary.flagged)} icon={FileText} accent="#EF4444" />
        </div>

        {/* What's next */}
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
                NEXT STEPS
              </div>
              <div style={{ color: "#F0F6FF", marginTop: "4px" }}>Make the most of free</div>
            </div>
            <ArrowUpRight size={16} color="#12A37B" />
          </div>
          <div className="space-y-3">
            {[
              "Use remaining free scans before the reset date.",
              "Pay ₦500 per scan when you exceed your quota.",
              "Upgrade to Starter or Pro for wallet access and lower per-scan pricing.",
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl p-4"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <CheckCircle2 size={14} color="#12A37B" className="mt-0.5" />
                <span style={{ color: "rgba(176,196,222,0.72)", fontSize: "13px", lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right column */}
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
            {filtered.slice(0, 5).map((scan, index) => (
              <ScanRow key={scan.id} scan={scan} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}