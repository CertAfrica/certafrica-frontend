import { useState } from "react";
import { Link } from "react-router";
import { CheckCircle2, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { api, extractCheckoutUrl } from "../lib/api";
import { useAuth } from "../context/AuthContext";

const plans = [
  {
    key: "FREE",
    title: "Free",
    price: "₦0",
    description: "2 free verifications every month.",
    perks: ["2 free scans monthly", "₦500 per scan after free", "Monthly resets", "No wallet access"],
  },
  {
    key: "STARTER",
    title: "Starter",
    price: "₦2,500 / month",
    description: "10 monthly verifications plus discounted scan pricing.",
    perks: ["10 scans per month", "₦400 per scan after quota", "Wallet funding + auto-deduction", "Monthly auto-renew"],
  },
  {
    key: "PRO",
    title: "Pro",
    price: "₦25,000 / month",
    description: "100 monthly verifications with rollover scans, ₦300 additional scans, bulk pricing, team tools, and faster processing.",
    perks: ["100 scans monthly + rollover", "₦300 per additional scan", "Bulk pricing & team tools", "Priority processing"],
  },
] as const;

export function PricingPage() {
  const { isAuthenticated } = useAuth();
  const [busyPlan, setBusyPlan] = useState<string | null>(null);

  const handleUpgrade = async (plan: "STARTER" | "PRO") => {
    const paymentPopup = window.open("about:blank", "certafrica-plan-upgrade", "width=900,height=700");
    if (paymentPopup) {
      paymentPopup.document.write(
        "<html><body style='font-family:sans-serif;background:#08111E;color:#F0F6FF;display:flex;align-items:center;justify-content:center;height:100vh;margin:0'>Opening Squad checkout…</body></html>"
      );
      paymentPopup.document.close();
    }

    try {
      setBusyPlan(plan);
      const result = await api.upgradeSubscription(plan);
      const checkoutUrl = extractCheckoutUrl(result.checkout);
      toast.success("Checkout created. Complete payment to activate the plan.");
      if (checkoutUrl) {
        if (paymentPopup) {
          paymentPopup.location.href = checkoutUrl;
          paymentPopup.focus();
        } else {
          window.open(checkoutUrl, "_blank", "noopener,noreferrer,width=900,height=700");
        }
      } else if (paymentPopup) {
        paymentPopup.close();
      }
    } catch (error) {
      if (paymentPopup) {
        paymentPopup.close();
      }
      toast.error(error instanceof Error ? error.message : "Unable to start upgrade.");
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <div className="min-h-screen pt-16 px-6 md:px-10 py-12">
      <div className="max-w-6xl mx-auto space-y-10">
        <div>
          <div className="text-xs" style={{ color: "rgba(176,196,222,0.5)", letterSpacing: "0.08em" }}>PRICING</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 4vw, 3rem)", color: "#F0F6FF", marginTop: "8px" }}>Pick the plan that matches your verification volume.</h1>
          <p style={{ color: "rgba(176,196,222,0.7)", maxWidth: "70ch", marginTop: "10px" }}>Plans reset monthly. Wallet deductions apply automatically when your free scans are exhausted.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.key} className="rounded-3xl p-7" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ color: "#12A37B", fontWeight: 600 }}>{plan.title}</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", color: "#F0F6FF", marginTop: "6px" }}>{plan.price}</div>
              <p style={{ color: "rgba(176,196,222,0.7)", marginTop: "10px" }}>{plan.description}</p>
              <div className="space-y-2 mt-5">
                {plan.perks.map((perk) => (
                  <div key={perk} className="flex items-start gap-2" style={{ color: "rgba(176,196,222,0.7)", fontSize: "13px" }}>
                    <CheckCircle2 size={14} color="#12A37B" className="mt-0.5" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                {plan.key === "FREE" ? (
                  <Link to="/verify" className="inline-flex items-center gap-2 rounded-xl px-4 py-3 no-underline" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#F0F6FF" }}>
                    Continue on Free
                  </Link>
                ) : isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => handleUpgrade(plan.key)}
                    disabled={busyPlan === plan.key}
                    className="inline-flex items-center gap-2 rounded-xl px-4 py-3 transition-opacity disabled:opacity-60"
                    style={{ background: "linear-gradient(135deg, #0F6E56, #12A37B)", color: "white", fontWeight: 600 }}
                  >
                    <CreditCard size={16} />
                    {busyPlan === plan.key ? "Starting checkout…" : `Upgrade to ${plan.title}`}
                  </button>
                ) : (
                  <Link to="/verify" className="inline-flex items-center gap-2 rounded-xl px-4 py-3 no-underline" style={{ background: "linear-gradient(135deg, #0F6E56, #12A37B)", color: "white", fontWeight: 600 }}>
                    Sign in to upgrade
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
