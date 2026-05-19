import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { RefreshCcw, Receipt, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import type { AdminRefundRecord } from "../../lib/types";
import { AdminShell } from "./AdminShell";

export function AdminRefundsPage() {
  const [items, setItems] = useState<AdminRefundRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const result = await api.getAdminRefunds(1, 20);
        if (!mounted) return;
        setItems(result.items);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load refunds.");
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
      title="Refund control room"
      subtitle="Review automatic refunds, manual exceptions, and scans that failed verification or confidence thresholds."
      eyebrow="REFUNDS"
    >
      <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">Payouts</div>
            <h2 className="mt-2 text-xl font-semibold text-slate-50">Refund queue</h2>
          </div>
          <Receipt size={16} className="text-amber-300" />
        </div>

        <div className="mt-6 space-y-4">
          {loading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="rounded-3xl border border-white/8 bg-black/20 p-5">
                  <div className="h-18 animate-pulse rounded-2xl bg-white/5" />
                </div>
              ))
            : items.map((item) => (
                <div key={item.id} className="rounded-3xl border border-white/8 bg-black/20 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="font-medium text-slate-50">₦{Number(item.amount).toLocaleString()}</div>
                      <div className="mt-1 text-xs text-slate-300/55">{item.reason}</div>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-red-200">
                      <ShieldAlert size={12} />
                      {item.status}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3 text-sm text-slate-200/80">
                    <div className="rounded-2xl border border-white/8 bg-white/4 p-3">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">User</div>
                      <div className="mt-1 text-slate-50">{item.user?.name ?? "Unknown user"}</div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/4 p-3">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">Scan</div>
                      <div className="mt-1 text-slate-50">{item.scan?.scanCode ?? "—"}</div>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/4 p-3">
                      <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">Updated</div>
                      <div className="mt-1 text-slate-50">{formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}</div>
                    </div>
                  </div>

                  <div className="mt-4 text-xs text-slate-300/60">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/4 px-2.5 py-1">
                      <RefreshCcw size={11} />
                      Auto refund pipeline
                    </span>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </AdminShell>
  );
}
