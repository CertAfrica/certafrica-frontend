import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { FileScan, Flame } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import type { AdminScanRecord } from "../../lib/types";
import { AdminShell } from "./AdminShell";

export function AdminScansPage() {
  const [items, setItems] = useState<AdminScanRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const result = await api.getAdminScans(1, 20);
        if (!mounted) return;
        setItems(result.items);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load scans.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <AdminShell
      title="Scan operations"
      subtitle="Monitor live scan status, verification confidence, and model flags across the platform."
      eyebrow="SCANS"
    >
      <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">Processing</div>
            <h2 className="mt-2 text-xl font-semibold text-slate-50">Recent scan activity</h2>
          </div>
          <FileScan size={16} className="text-cyan-400" />
        </div>

        <div className="mt-6 space-y-4">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="rounded-3xl border border-white/8 bg-black/20 p-5">
                  <div className="h-20 animate-pulse rounded-2xl bg-white/5" />
                </div>
              ))
            : items.map((item) => (
                <div key={item.id} className="rounded-3xl border border-white/8 bg-black/20 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="font-medium text-slate-50">{item.fileName}</div>
                      <div className="mt-1 text-xs text-slate-300/55">{item.scanCode}</div>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-amber-200">
                      <Flame size={12} />
                      {item.verificationStatus}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-4 text-sm text-slate-200/80">
                    <div className="rounded-2xl border border-white/8 bg-white/4 p-3">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">Status</div>
                      <div className="mt-1 text-slate-50">{item.status}</div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/4 p-3">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">Payment</div>
                      <div className="mt-1 text-slate-50">{item.paymentStatus}</div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/4 p-3">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">Trust score</div>
                      <div className="mt-1 text-slate-50">{item.trustScore ?? "—"}</div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/4 p-3">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">Updated</div>
                      <div className="mt-1 text-slate-50">{formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}</div>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-slate-300/60">
                    {item.user?.name ?? "Unknown user"} · {item.user?.plan ?? "FREE"} · {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </div>
                </div>
              ))}
        </div>
      </div>
    </AdminShell>
  );
}
