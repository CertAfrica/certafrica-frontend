import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import PlanBadge from "../components/PlanBadge";
import { Wallet as WalletIcon, CreditCard, ArrowUpRight } from "lucide-react";

export function AccountPage() {
  const { user } = useAuth();
  const [wallet, setWallet] = useState<{ balance: number } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const w = await api.getWallet();
        if (mounted) setWallet(w);
      } catch {
        if (mounted) setWallet(null);
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
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 style={{ color: "#F0F6FF", fontSize: 22, margin: 0 }}>Account</h1>
          <p style={{ color: "rgba(176,196,222,0.6)", marginTop: 6 }}>Manage your plan, wallet and billing.</p>
        </div>
        <div className="flex items-center gap-3">
          <PlanBadge plan={user?.plan} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 12 }}>
          <h3 style={{ color: "#F0F6FF", margin: 0, fontSize: 13 }}>Wallet</h3>
          <div className="mt-3 flex items-center justify-between">
            <div style={{ color: "rgba(176,196,222,0.8)" }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{wallet ? `₦${wallet.balance.toLocaleString()}` : "—"}</div>
              <div style={{ fontSize: 12, color: "rgba(176,196,222,0.5)" }}>Available balance</div>
            </div>
            <div className="flex flex-col items-end">
              <button
                className="py-2 px-3 rounded-lg"
                style={{ background: "linear-gradient(135deg, #0F6E56 0%, #12A37B 100%)", color: "white", fontWeight: 600 }}
                onClick={() => window.location.assign("/wallet")}
              >
                <WalletIcon size={14} style={{ marginRight: 8 }} /> Top up
              </button>
            </div>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 12 }}>
          <h3 style={{ color: "#F0F6FF", margin: 0, fontSize: 13 }}>Billing</h3>
          <div className="mt-3">
            <p style={{ color: "rgba(176,196,222,0.7)", marginBottom: 8 }}>Manage invoices, payment methods and billing details.</p>
            <div className="flex gap-2">
              <button
                onClick={() => (window.location.href = "/billing")}
                className="py-2 px-3 rounded-lg"
                style={{ background: "rgba(255,255,255,0.04)", color: "rgba(176,196,222,0.9)" }}
              >
                View Billing
              </button>
              <button
                onClick={() => (window.location.href = "/pricing")}
                className="py-2 px-3 rounded-lg"
                style={{ background: "rgba(255,255,255,0.04)", color: "rgba(176,196,222,0.9)" }}
              >
                Upgrade Plan <ArrowUpRight size={14} style={{ marginLeft: 8 }} />
              </button>
            </div>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 12 }}>
          <h3 style={{ color: "#F0F6FF", margin: 0, fontSize: 13 }}>Payment Methods</h3>
          <div className="mt-3" style={{ color: "rgba(176,196,222,0.7)" }}>
            <p>No saved cards</p>
            <div className="mt-3">
              <button
                onClick={() => (window.location.href = "/billing")}
                className="py-2 px-3 rounded-lg"
                style={{ background: "rgba(255,255,255,0.04)", color: "rgba(176,196,222,0.9)" }}
              >
                Add Payment Method
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccountPage;
