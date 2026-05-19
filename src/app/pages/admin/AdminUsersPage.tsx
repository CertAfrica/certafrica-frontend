import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Users, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import type { AdminUserRecord } from "../../lib/types";
import { AdminShell } from "./AdminShell";

export function AdminUsersPage() {
  const [items, setItems] = useState<AdminUserRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const result = await api.getAdminUsers(1, 20);
        if (!mounted) return;
        setItems(result.items);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load users.");
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
      title="User registry"
      subtitle="Inspect recent signups, account roles, and plan adoption across the platform."
      eyebrow="USERS"
    >
      <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">Accounts</div>
            <h2 className="mt-2 text-xl font-semibold text-slate-50">Recent users</h2>
          </div>
          <Users size={16} className="text-emerald-400" />
        </div>

        <div className="mt-6 overflow-hidden rounded-3xl border border-white/8">
          <div className="grid grid-cols-[1.4fr_0.9fr_0.8fr_0.9fr] gap-4 bg-black/20 px-5 py-3 text-[10px] uppercase tracking-[0.2em] text-white/30">
            <span>User</span>
            <span>Role</span>
            <span>Plan</span>
            <span>Joined</span>
          </div>
          <div className="divide-y divide-white/6 bg-black/15">
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="grid grid-cols-[1.4fr_0.9fr_0.8fr_0.9fr] gap-4 px-5 py-4">
                    <div className="h-5 animate-pulse rounded bg-white/5" />
                    <div className="h-5 animate-pulse rounded bg-white/5" />
                    <div className="h-5 animate-pulse rounded bg-white/5" />
                    <div className="h-5 animate-pulse rounded bg-white/5" />
                  </div>
                ))
              : items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1.4fr_0.9fr_0.8fr_0.9fr] gap-4 px-5 py-4 text-sm text-slate-200/85">
                    <div>
                      <div className="font-medium text-slate-50">{item.name}</div>
                      <div className="mt-1 text-xs text-slate-300/55">{item.email}</div>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300/70">
                      <ShieldCheck size={14} className="text-emerald-400" />
                      {item.role}
                    </div>
                    <div className="text-emerald-300">{item.plan}</div>
                    <div className="text-slate-300/60">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</div>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
