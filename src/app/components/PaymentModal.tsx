import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export interface PaymentModalProps {
  isOpen: boolean;
  checkoutUrl: string | null;
  transactionRef: string | null;
  amount?: number;
  type?: "scan" | "wallet_topup" | "subscription";
  isAutoVerifying?: boolean;
  onClose: () => void;
  onVerify: (transactionRef: string) => Promise<boolean>;
  onSuccess?: () => void | Promise<void>;
}

export function PaymentModal({
  isOpen,
  checkoutUrl,
  transactionRef,
  amount,
  type = "scan",
  isAutoVerifying = false,
  onClose,
  onVerify,
  onSuccess,
}: PaymentModalProps) {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerifyPayment = async () => {
    if (!transactionRef) return;

    setVerifying(true);
    setError(null);

    try {
      const success = await onVerify(transactionRef);
      if (success) {
        setVerified(true);
        toast.success("Payment verified successfully!");
        setFinalizing(true);
        await onSuccess?.();
        onClose();
      } else {
        setError("Payment not completed yet. Please complete the transaction on Squad.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verification failed";
      setError(message);
      toast.error(message);
    } finally {
      setVerifying(false);
    }
  };

  const typeLabel = {
    scan: "Certificate Verification",
    wallet_topup: "Wallet Top-up",
    subscription: "Plan Subscription",
  }[type];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
          >
            <div
              className="relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
              style={{ background: "#08111E", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <div>
                  <h2 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.4)", letterSpacing: "0.08em", marginBottom: "4px" }}>
                    PAYMENT CHECKOUT
                  </h2>
                  <h1 style={{ fontSize: "1.1rem", color: "#F0F6FF", margin: 0 }}>{typeLabel}</h1>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-white/5 rounded-lg transition-colors"
                  style={{ color: "rgba(176,196,222,0.6)" }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {amount && (
                  <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: "rgba(18,163,123,0.1)", border: "1px solid rgba(18,163,123,0.2)" }}>
                    <span style={{ color: "rgba(176,196,222,0.7)" }}>Amount</span>
                    <span style={{ fontSize: "1.2rem", color: "#12A37B", fontWeight: 600 }}>₦{amount.toLocaleString()}</span>
                  </div>
                )}

                {verified ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-8 text-center"
                  >
                    {finalizing ? (
                      <>
                        <Loader2 size={32} className="animate-spin mb-4" color="#12A37B" />
                        <h3 style={{ color: "#F0F6FF", fontSize: "1rem", marginBottom: "4px" }}>Updating your plan</h3>
                        <p style={{ color: "rgba(176,196,222,0.6)", fontSize: "13px", margin: 0 }}>
                          We&apos;re polling `GET /me` until your new subscription shows up.
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="mb-4 rounded-full p-3" style={{ background: "rgba(18,163,123,0.15)" }}>
                          <CheckCircle2 size={32} color="#12A37B" />
                        </div>
                        <h3 style={{ color: "#F0F6FF", fontSize: "1rem", marginBottom: "4px" }}>Payment Verified</h3>
                        <p style={{ color: "rgba(176,196,222,0.6)", fontSize: "13px", margin: 0 }}>Your transaction has been confirmed by Squad.</p>
                      </>
                    )}
                  </motion.div>
                ) : checkoutUrl ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl text-sm" style={{ background: "rgba(59,139,212,0.1)", border: "1px solid rgba(59,139,212,0.2)" }}>
                      <p style={{ color: "rgba(176,196,222,0.7)", margin: 0, lineHeight: 1.6 }}>
                        Click <strong>"Pay on Squad"</strong> to open the payment page in a new window. Complete payment and return here to verify.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        window.open(checkoutUrl, "_blank", "noopener,noreferrer,width=800,height=600");
                      }}
                      className="w-full py-3 rounded-xl transition-opacity hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #0F6E56, #12A37B)", color: "white", fontWeight: 600, border: "none", cursor: "pointer" }}
                    >
                      Pay on Squad →
                    </button>

                    {error && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}>
                        <AlertCircle size={16} color="#EF4444" className="mt-0.5 flex-shrink-0" />
                        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.82)", margin: 0 }}>{error}</p>
                      </motion.div>
                    )}

                    <button
                      type="button"
                      onClick={handleVerifyPayment}
                      disabled={verifying || isAutoVerifying}
                      className="w-full py-3 rounded-xl transition-opacity disabled:opacity-60"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(176,196,222,0.9)", fontWeight: 500, cursor: "pointer" }}
                    >
                      {verifying || isAutoVerifying ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 size={16} className="animate-spin" /> Verifying transaction…
                        </span>
                      ) : (
                        "Verify Payment"
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Loader2 size={32} className="animate-spin mb-3" color="#12A37B" />
                    <p style={{ color: "rgba(176,196,222,0.7)" }}>Loading checkout…</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                <button
                  onClick={onClose}
                  disabled={finalizing}
                  className="w-full py-2 rounded-lg transition-colors"
                  style={{ background: "rgba(255,255,255,0.04)", color: "rgba(176,196,222,0.7)", border: "none", cursor: finalizing ? "wait" : "pointer", opacity: finalizing ? 0.7 : 1 }}
                >
                  {verified ? (finalizing ? "Updating…" : "Close") : "Cancel"}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
