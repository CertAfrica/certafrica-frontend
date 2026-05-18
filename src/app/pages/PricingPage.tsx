import { useState } from "react";
import { Link } from "react-router";
import { CheckCircle2, CreditCard, Sparkles, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, extractCheckoutUrl } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { PaymentModal } from "../components/PaymentModal";
import type { PaymentCheckoutResponse } from "../lib/types";

const plans = [
  {
    key: "FREE" as const,
    title: "Free",
    price: "₦0",
    period: "forever",
    description: "2 free verifications every month.",
    perks: [
      "2 free scans monthly",
      "₦500 per scan after free",
      "Monthly resets, no rollover",
      "No wallet access",
    ],
    accent: "#F59E0B",
    featured: false,
  },
  {
    key: "STARTER" as const,
    title: "Starter",
    price: "₦2,500",
    period: "per month",
    description: "10 monthly verifications plus discounted scan pricing.",
    perks: [
      "10 scans per month",
      "₦400 per scan after quota",
      "Wallet funding + auto-deduction",
      "Monthly auto-renew",
    ],
    accent: "#3B8BD4",
    featured: true,
  },
  {
    key: "PRO" as const,
    title: "Pro",
    price: "₦25,000",
    period: "per month",
    description: "100 monthly verifications, rollover, bulk pricing, and team tools.",
    perks: [
      "100 scans monthly + rollover",
      "₦300 per additional scan",
      "Bulk pricing & team tools",
      "Priority processing",
    ],
    accent: "#12A37B",
    featured: false,
  },
];

export function PricingPage() {
  const { isAuthenticated, user, refreshSession } = useAuth();
  const [busyPlan, setBusyPlan] = useState<string | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<PaymentCheckoutResponse | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<"STARTER" | "PRO" | null>(null);

  const handleUpgrade = async (plan: "STARTER" | "PRO") => {
    setBusyPlan(plan);
    try {
      const result = await api.upgradeSubscription(plan);
      const checkoutUrl = extractCheckoutUrl(result.checkout);

      setCheckoutResult(result);
      setPendingPlan(plan);
      setPaymentModalOpen(true);

      if (checkoutUrl) {
        window.open(checkoutUrl, "_blank", "noopener,noreferrer,width=900,height=700");
      }
      toast.message("Complete payment in the Squad window, then return to verify.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start upgrade.");
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <div className="min-h-screen pt-26 px-6 md:px-10 py-16">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto certafrica-fade-in">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
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
              PRICING
            </span>
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(2rem, 4vw, 3rem)",
              color: "#F0F6FF",
              lineHeight: 1.1,
              marginBottom: "12px",
            }}
          >
            Pick the plan that matches your volume.
          </h1>
          <p style={{ color: "rgba(176,196,222,0.7)", lineHeight: 1.7 }}>
            Plans reset monthly. Wallet deductions apply automatically once free scans are exhausted. Cancel
            anytime.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrent = isAuthenticated && user?.plan === plan.key;

            return (
              <div
                key={plan.key}
                className="relative rounded-3xl p-7 certafrica-fade-in"
                style={{
                  background: plan.featured
                    ? `linear-gradient(160deg, ${plan.accent}1f, rgba(255,255,255,0.03))`
                    : "rgba(255,255,255,0.03)",
                  border: plan.featured
                    ? `1px solid ${plan.accent}55`
                    : "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {plan.featured && (
                  <div
                    className="absolute top-0 right-6 -translate-y-1/2 px-3 py-1 rounded-full"
                    style={{
                      background: plan.accent,
                      color: "white",
                      fontSize: "10px",
                      fontFamily: "'IBM Plex Mono', monospace",
                      letterSpacing: "0.08em",
                      fontWeight: 600,
                    }}
                  >
                    POPULAR
                  </div>
                )}

                <div
                  style={{
                    color: plan.accent,
                    fontWeight: 600,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                    marginBottom: "8px",
                  }}
                >
                  {plan.title.toUpperCase()}
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <div
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "2.2rem",
                      color: "#F0F6FF",
                      lineHeight: 1,
                    }}
                  >
                    {plan.price}
                  </div>
                  <div style={{ color: "rgba(176,196,222,0.55)", fontSize: "12px" }}>{plan.period}</div>
                </div>

                <p
                  style={{
                    color: "rgba(176,196,222,0.7)",
                    fontSize: "13px",
                    lineHeight: 1.6,
                    marginBottom: "20px",
                    minHeight: "60px",
                  }}
                >
                  {plan.description}
                </p>

                <div
                  className="my-5 h-px"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                />

                <div className="space-y-3 mb-6">
                  {plan.perks.map((perk) => (
                    <div
                      key={perk}
                      className="flex items-start gap-2"
                      style={{ color: "rgba(176,196,222,0.78)", fontSize: "13px" }}
                    >
                      <CheckCircle2 size={14} color={plan.accent} className="mt-0.5 flex-shrink-0" />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>

                <div>
                  {isCurrent ? (
                    <div
                      className="w-full text-center rounded-xl px-4 py-3"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(176,196,222,0.65)",
                        fontWeight: 500,
                      }}
                    >
                      Current plan
                    </div>
                  ) : plan.key === "FREE" ? (
                    <Link
                      to="/verify"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 no-underline"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#F0F6FF",
                      }}
                    >
                      Continue free
                    </Link>
                  ) : isAuthenticated ? (
                    <button
                      type="button"
                      onClick={() => handleUpgrade(plan.key)}
                      disabled={busyPlan === plan.key}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 transition-opacity disabled:opacity-60"
                      style={{
                        background: plan.featured
                          ? `linear-gradient(135deg, ${plan.accent}, ${plan.accent}dd)`
                          : "linear-gradient(135deg, #0F6E56, #12A37B)",
                        color: "white",
                        fontWeight: 600,
                        cursor: "pointer",
                        border: "none",
                      }}
                    >
                      {busyPlan === plan.key ? (
                        <>
                          <Loader2 size={16} className="animate-spin" /> Starting checkout…
                        </>
                      ) : (
                        <>
                          <Zap size={16} />
                          Upgrade to {plan.title}
                        </>
                      )}
                    </button>
                  ) : (
                    <Link
                      to="/verify"
                      className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 no-underline"
                      style={{
                        background: "linear-gradient(135deg, #0F6E56, #12A37B)",
                        color: "white",
                        fontWeight: 600,
                      }}
                    >
                      Sign in to upgrade
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ-ish footer */}
        <div
          className="rounded-3xl p-6 md:p-8"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Cancel anytime",
                body: "No long-term contracts. Stop a paid plan at any time and you'll keep access until the end of the billing period.",
              },
              {
                title: "Wallet funds don't expire",
                body: "Money you add to your wallet stays there. Use it to pay for scans beyond your monthly quota.",
              },
              {
                title: "Need a custom plan?",
                body: "If you're verifying thousands of certificates a month, contact us for volume pricing and SLAs.",
              },
            ].map((item) => (
              <div key={item.title}>
                <div style={{ color: "#F0F6FF", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
                  {item.title}
                </div>
                <p style={{ color: "rgba(176,196,222,0.65)", fontSize: "13px", lineHeight: 1.65, margin: 0 }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={paymentModalOpen}
        checkoutUrl={checkoutResult ? extractCheckoutUrl(checkoutResult.checkout) : null}
        transactionRef={checkoutResult?.transaction?.reference ?? null}
        amount={checkoutResult?.transaction ? Number(checkoutResult.transaction.amount) : undefined}
        type="subscription"
        onClose={() => {
          setPaymentModalOpen(false);
          setPendingPlan(null);
        }}
        onVerify={async (ref) => {
          try {
            const result = await api.verifyPayment(ref);
            return result.processed === true;
          } catch {
            return false;
          }
        }}
        onSuccess={async () => {
          if (pendingPlan) {
            toast.message(`Waiting for your ${pendingPlan} plan to appear in your account…`);
          }
          try {
            const updatedUser = await refreshSession(pendingPlan ?? undefined);
            if (pendingPlan && updatedUser?.plan === pendingPlan) {
              toast.success(`Welcome to ${pendingPlan}! Your plan is now active.`);
            } else if (pendingPlan) {
              toast.message("Payment was confirmed, but the plan is still syncing. Please refresh in a moment.");
            }
          } catch {
            toast.error("Payment was confirmed, but we couldn't refresh your account yet.");
          }
          setPaymentModalOpen(false);
          setPendingPlan(null);
          setCheckoutResult(null);
        }}
      />
    </div>
  );
}