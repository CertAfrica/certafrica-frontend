import { useEffect, useState } from "react";
import { Link } from "react-router";
import { CreditCard, Loader2 } from "lucide-react";
import { api } from "../lib/api";
import type { BillingHistoryItem } from "../lib/types";
import { toast } from "sonner";

function formatCurrency(value: string | number, currency = "NGN") {
  const amount = typeof value === "string" ? Number.parseFloat(value) : value;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0);
}

export function BillingSettingsPage() {
  const [items, setItems] = useState<BillingHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const result = await api.getBillingHistory();
        setItems(result.items ?? []);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load billing history.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <div className="min-h-screen pt-16 px-6 md:px-10 py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div style={{ color: "rgba(176,196,222,0.5)", fontSize: "11px", letterSpacing: "0.08em" }}>BILLING</div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#F0F6FF", fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>Billing settings</h1>
          </div>
          <Link to="/pricing" className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 no-underline" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#F0F6FF" }}>
            View plans
          </Link>
        </div>

        <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.38)", letterSpacing: "0.08em" }}>BILLING HISTORY</div>
              <div style={{ color: "#F0F6FF", marginTop: "4px" }}>Latest subscription payments</div>
            </div>
            {loading ? <Loader2 size={16} className="animate-spin" color="#12A37B" /> : <CreditCard size={16} color="#12A37B" />}
          </div>
          <div className="space-y-3">
            {items.length === 0 ? (
              <div className="rounded-2xl p-4 text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(176,196,222,0.65)" }}>
                No billing history yet. Your next renewal will appear here.
              </div>
            ) : (
              items.map((item) => (
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
      </div>
    </div>
  );
}
