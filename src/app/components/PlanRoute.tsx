import { ReactNode } from "react";
import { Link } from "react-router";
import { ShieldAlert, ArrowUpRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { PlanType } from "../lib/types";

interface PlanRouteProps {
  allow: PlanType[];
  children: ReactNode;
  title?: string;
  description?: string;
}

const PLAN_LABEL: Record<PlanType, string> = {
  FREE: "Free",
  STARTER: "Starter",
  PRO: "Pro",
};

export function PlanRoute({
  allow,
  children,
  title = "Upgrade required",
  description = "This section is available on higher plans.",
}: PlanRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) return <>{children}</>;
  if (allow.includes(user.plan)) return <>{children}</>;

  const required = allow.map((p) => PLAN_LABEL[p]).join(" or ");

  return (
    <div className="min-h-screen pt-16 px-6 md:px-10 py-12">
      <div
        className="max-w-3xl mx-auto rounded-3xl p-8 md:p-10"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
          style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}
        >
          <ShieldAlert size={14} color="#F59E0B" />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#F59E0B", letterSpacing: "0.08em" }}>
            PLAN RESTRICTED
          </span>
        </div>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            color: "#F0F6FF",
            fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
            lineHeight: 1.1,
          }}
        >
          {title}
        </h1>
        <p style={{ color: "rgba(176,196,222,0.7)", marginTop: "12px", lineHeight: 1.7 }}>
          {description} You're on the {PLAN_LABEL[user.plan]} plan. This page requires {required}.
        </p>
        <div className="flex flex-wrap gap-3 mt-6">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-3 no-underline"
            style={{ background: "linear-gradient(135deg, #0F6E56, #12A37B)", color: "white", fontWeight: 600 }}
          >
            View plans
            <ArrowUpRight size={15} />
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-3 no-underline"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#F0F6FF" }}
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}