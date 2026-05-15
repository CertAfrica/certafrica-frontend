import { ReactNode } from "react";

const shimmer = {
  background: "linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 100%)",
  backgroundSize: "200% 100%",
  animation: "certafrica-shimmer 1.4s infinite",
  borderRadius: "6px",
} as const;

export function SkeletonLine({ width = "100%", height = "12px" }: { width?: string; height?: string }) {
  return <div style={{ ...shimmer, width, height }} />;
}

export function SkeletonCard({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl p-5 ${className}`}
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
    >
      {children ?? (
        <div className="space-y-3">
          <SkeletonLine width="35%" height="9px" />
          <SkeletonLine width="65%" height="24px" />
          <SkeletonLine width="50%" height="12px" />
        </div>
      )}
    </div>
  );
}

export function SkeletonStatGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonScanRow() {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 space-y-2">
          <SkeletonLine width="55%" height="14px" />
          <SkeletonLine width="30%" height="10px" />
        </div>
        <SkeletonLine width="80px" height="22px" />
      </div>
      <div className="flex items-center justify-between">
        <SkeletonLine width="35%" height="11px" />
        <SkeletonLine width="90px" height="28px" />
      </div>
    </div>
  );
}

export function SkeletonScanList({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonScanRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonPanel() {
  return (
    <div
      className="rounded-3xl p-6 space-y-3"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <SkeletonLine width="25%" height="10px" />
      <SkeletonLine width="60%" height="20px" />
      <div className="pt-3 space-y-2">
        <SkeletonLine width="100%" />
        <SkeletonLine width="85%" />
        <SkeletonLine width="70%" />
      </div>
    </div>
  );
}