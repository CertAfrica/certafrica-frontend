import { Link } from "react-router";
import { CheckCircle2 } from "lucide-react";

const steps = [
  { title: "Create account", description: "Sign up to unlock verification workflows." },
  { title: "Choose plan", description: "Free gives 2 scans/month. Starter and Pro auto-renew monthly." },
  { title: "Upload certificates", description: "Send files securely for AI + registry verification." },
  { title: "Track results", description: "Monitor scan status, payments, and reports." },
];

export function OnboardingPage() {
  return (
    <div className="min-h-screen pt-16 px-6 md:px-10 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div style={{ color: "rgba(176,196,222,0.5)", fontSize: "11px", letterSpacing: "0.08em" }}>ONBOARDING</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#F0F6FF", fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>Get started in minutes</h1>
          <p style={{ color: "rgba(176,196,222,0.7)", marginTop: "10px" }}>Pick a plan, upload certificates, and track verification progress.</p>
        </div>

        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.title} className="flex items-start gap-3 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <CheckCircle2 size={16} color="#12A37B" className="mt-0.5" />
              <div>
                <div style={{ color: "#F0F6FF", fontWeight: 600 }}>{step.title}</div>
                <div style={{ color: "rgba(176,196,222,0.7)", fontSize: "13px" }}>{step.description}</div>
              </div>
            </div>
          ))}
        </div>

        <Link to="/pricing" className="inline-flex items-center gap-2 rounded-xl px-4 py-3 no-underline" style={{ background: "linear-gradient(135deg, #0F6E56, #12A37B)", color: "white", fontWeight: 600 }}>
          View plans
        </Link>
      </div>
    </div>
  );
}
