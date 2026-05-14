import React from "react";

export type PlanType = "FREE" | "STARTER" | "PRO";

export function PlanBadge({ plan }: { plan: PlanType | string | undefined }) {
  const label = plan ?? "Guest";
  const bg =
    plan === "PRO"
      ? "linear-gradient(135deg, #0F6E56 0%, #12A37B 100%)"
      : plan === "STARTER"
      ? "rgba(18,163,123,0.12)"
      : "rgba(255,255,255,0.02)";

  const color = plan === "PRO" ? "white" : "rgba(176,196,222,0.9)";

  return (
    <div
      style={{
        background: bg,
        padding: "6px 10px",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        color,
        display: "inline-block",
      }}
    >
      {label}
    </div>
  );
}

export default PlanBadge;
