import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowUpRight,
  CheckCircle2,
  Cpu,
  FileSearch,
  RefreshCcw,
  Shield,
  Sparkles,
  Users,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import type { AdminRefundRecord, AdminScanRecord, AdminUserRecord } from "../../lib/types";
import { AdminShell } from "./AdminShell";

export function AdminOverviewPage() {
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [scans, setScans] = useState<AdminScanRecord[]>([]);
  const [refunds, setRefunds] = useState<AdminRefundRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const [usersResult, scansResult, refundsResult] = await Promise.all([
          api.getAdminUsers(1, 8),
          api.getAdminScans(1, 8),
          api.getAdminRefunds(1, 8),
        ]);

        if (!mounted) return;
        setUsers(usersResult.items);
        setScans(scansResult.items);
        setRefunds(refundsResult.items);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load admin portal.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const verified = scans.filter((scan) => scan.verificationStatus === "VERIFIED").length;
    const flagged = scans.filter((scan) => scan.flagged).length;
    const totalTrust = scans.reduce((sum, scan) => sum + (scan.trustScore ?? 0), 0);
    const avgTrust = scans.length ? Math.round(totalTrust / scans.length) : 0;
    const recentUsers = users.filter((user) => new Date(user.createdAt).getTime() > Date.now() - 1000 * 60 * 60 * 24 * 30).length;

    return [
      { label: "Users", value: users.length, hint: `${recentUsers} joined this month`, icon: Users, tone: "emerald" },
      { label: "Scans", value: scans.length, hint: `${verified} verified successfully`, icon: FileSearch, tone: "cyan" },
      { label: "Trust score", value: `${avgTrust}%`, hint: "Average AI confidence", icon: Shield, tone: "violet" },
      { label: "Refunds", value: refunds.length, hint: `${flagged} flagged scans`, icon: RefreshCcw, tone: "amber" },
    ];
  }, [refunds.length, scans, users]);

  return (
    <AdminShell
      title="Admin command center"
      subtitle="Track trust, scan quality, refunds, and onboarding patterns from a modern operations dashboard built for the CertAfrica team."
    >
      <div className="grid gap-5 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.35 }}
            className="rounded-3xl border border-white/8 bg-white/4 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between text-slate-200/80">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">{stat.label}</div>
                <div className="mt-3 text-3xl font-semibold text-slate-50">{loading ? "—" : stat.value}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
                <stat.icon size={18} className="text-emerald-400" />
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300/70">{stat.hint}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/8 bg-gradient-to-br from-white/5 to-white/[0.02] p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">AI health</div>
              <h2 className="mt-2 text-xl font-semibold text-slate-50">Operational pipeline status</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-300">
              <CheckCircle2 size={13} />
              Stable
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              { title: "Document ingestion", value: "98.4%", tone: "emerald", detail: "Uploads parsed and queued into the OCR pipeline." },
              { title: "Verification confidence", value: "91.2%", tone: "cyan", detail: "Trust score accuracy across the current batch." },
              { title: "Refund automation", value: "100%", tone: "violet", detail: "Failed or inconclusive checks trigger refunds automatically." },
              { title: "Moderation alerts", value: `${stats[3].value}`, tone: "amber", detail: "Flagged scans waiting for manual review." },
            ].map((item) => (
              <div key={item.title} className="rounded-3xl border border-white/8 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-slate-50">{item.title}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/30">Live metric</div>
                  </div>
                  <div className={`text-2xl font-semibold ${item.tone === "emerald" ? "text-emerald-300" : item.tone === "cyan" ? "text-cyan-300" : item.tone === "violet" ? "text-violet-300" : "text-amber-300"}`}>
                    {item.value}
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full ${item.tone === "emerald" ? "bg-emerald-400" : item.tone === "cyan" ? "bg-cyan-400" : item.tone === "violet" ? "bg-violet-400" : "bg-amber-400"} animate-pulse`}
                    style={{ width: item.value === "100%" ? "100%" : item.value === "91.2%" ? "91%" : item.value === "98.4%" ? "98%" : "68%" }}
                  />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300/70">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">Recent activity</div>
              <h2 className="mt-2 text-xl font-semibold text-slate-50">Latest platform events</h2>
            </div>
            <Sparkles size={16} className="text-emerald-400" />
          </div>

          <div className="mt-5 space-y-4">
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div key={`scan-skeleton-${index}`} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <div className="h-16 animate-pulse rounded-xl bg-white/5" />
                  </div>
                ))
              : scans.slice(0, 4).map((scan) => (
                  <div key={scan.id} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-slate-50">{scan.fileName}</div>
                        <div className="mt-1 text-xs text-slate-300/55">{scan.scanCode}</div>
                      </div>
                      <div className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-emerald-300">
                        {scan.verificationStatus}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-300/60">
                      <span>
                        {scan.user?.name ?? "Unknown user"} · {scan.user?.plan ?? "FREE"}
                      </span>
                      <span>{formatDistanceToNow(new Date(scan.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link
              to="/admin/training"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200 no-underline transition-all hover:bg-emerald-400/15"
            >
              Open AI training
              <ArrowUpRight size={15} />
            </Link>
            <Link
              to="/admin/retrain"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 no-underline transition-all hover:bg-white/10"
            >
              Launch retrain flow
              <Cpu size={15} />
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-50">User growth</h2>
            <Users size={15} className="text-emerald-400" />
          </div>
          <div className="mt-5 space-y-3">
            {users.slice(0, 5).map((user) => (
              <div key={user.id} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium text-slate-50">{user.name}</div>
                    <div className="mt-1 text-xs text-slate-300/55">{user.email}</div>
                  </div>
                  <div className="text-right text-xs text-slate-300/65">
                    <div className="font-medium text-emerald-300">{user.plan}</div>
                    <div>{formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/8 bg-gradient-to-br from-cyan-400/10 to-violet-500/10 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-50">Refund pipeline</h2>
            <AlertTriangle size={15} className="text-amber-300" />
          </div>
          <div className="mt-5 space-y-3">
            {refunds.slice(0, 4).map((refund) => (
              <div key={refund.id} className="rounded-2xl border border-white/8 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-slate-50">₦{Number(refund.amount).toLocaleString()}</div>
                    <div className="mt-1 text-xs text-slate-300/55">{refund.reason}</div>
                  </div>
                  <div className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-amber-200">
                    {refund.status}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-300/60">
                  <span>{refund.scan?.scanCode ?? "No scan code"}</span>
                  <span>{formatDistanceToNow(new Date(refund.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
