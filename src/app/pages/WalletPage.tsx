import { useEffect, useState } from "react";
import { CreditCard, Loader2, Wallet as WalletIcon } from "lucide-react";
import { toast } from "sonner";
import { api, extractCheckoutUrl } from "../lib/api";
import type { Wallet as WalletType, WalletTransaction } from "../lib/types";

function formatCurrency(value: string | number | undefined, currency = "NGN") {
  const amount = typeof value === "string" ? Number.parseFloat(value) : value ?? 0;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0);
}

export function WalletPage() {
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [loading, setLoading] = useState(false);
  const [topupAmount, setTopupAmount] = useState("2500");
  const [topupBusy, setTopupBusy] = useState(false);

  const loadWallet = async () => {
    setLoading(true);
    try {
      const result = await api.getWallet();
      setWallet(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load wallet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadWallet();
  }, []);

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
      await loadWallet();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start the wallet top-up.");
    } finally {
      setTopupBusy(false);
    }
  };

  const transactions: WalletTransaction[] = wallet?.transactions ?? [];

  return (
    <div className="min-h-screen pt-16 px-6 md:px-10 py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div style={{ color: "rgba(176,196,222,0.5)", fontSize: "11px", letterSpacing: "0.08em" }}>WALLET</div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#F0F6FF", fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>Wallet balance</h1>
          </div>
          {loading ? <Loader2 size={16} className="animate-spin" color="#12A37B" /> : <WalletIcon size={18} color="#12A37B" />}
        </div>

        <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.38)", letterSpacing: "0.08em" }}>AVAILABLE</div>
              <div style={{ color: "#F0F6FF", marginTop: "4px", fontSize: "1.3rem" }}>{wallet ? formatCurrency(wallet.balance, wallet.currency) : "—"}</div>
            </div>
            <CreditCard size={16} color="#12A37B" />
          </div>
          <div className="flex gap-3">
            <input value={topupAmount} onChange={(event) => setTopupAmount(event.target.value)} className="flex-1 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F0F6FF" }} placeholder="Top-up amount" />
            <button type="button" onClick={() => void handleTopup()} disabled={topupBusy} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 transition-opacity disabled:opacity-60" style={{ background: "linear-gradient(135deg, #0F6E56, #12A37B)", color: "white", fontWeight: 600 }}>
              {topupBusy ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              Fund wallet
            </button>
          </div>
        </div>

        <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.38)", letterSpacing: "0.08em" }}>TRANSACTIONS</div>
              <div style={{ color: "#F0F6FF", marginTop: "4px" }}>Latest wallet movements</div>
            </div>
          </div>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="rounded-2xl p-4 text-sm" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(176,196,222,0.65)" }}>
                No wallet transactions yet.
              </div>
            ) : (
              transactions.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div>
                    <div style={{ color: "#F0F6FF", fontSize: "13px", fontWeight: 600 }}>{item.type.replaceAll("_", " ")}</div>
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
