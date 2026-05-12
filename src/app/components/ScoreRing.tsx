import { useEffect, useState } from "react";

interface ScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  animate?: boolean;
}

export function ScoreRing({ score, size = 160, strokeWidth = 10, animate = true }: ScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score);
  const [progress, setProgress] = useState(animate ? 0 : score);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const getColor = (s: number) => {
    if (s >= 85) return "#12A37B";
    if (s >= 55) return "#F59E0B";
    return "#EF4444";
  };

  const getLabel = (s: number) => {
    if (s >= 85) return "VERIFIED";
    if (s >= 55) return "REVIEW";
    return "HIGH RISK";
  };

  const getLabelColor = (s: number) => {
    if (s >= 85) return "#12A37B";
    if (s >= 55) return "#F59E0B";
    return "#EF4444";
  };

  const getLabelBg = (s: number) => {
    if (s >= 85) return "rgba(18, 163, 123, 0.12)";
    if (s >= 55) return "rgba(245, 158, 11, 0.12)";
    return "rgba(239, 68, 68, 0.12)";
  };

  useEffect(() => {
    if (!animate) return;
    let start = 0;
    const duration = 1500;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const current = Math.round(eased * score);
      setDisplayScore(current);
      setProgress(eased * score);
      if (t < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [score, animate]);

  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const color = getColor(score);

  return (
    <div className="relative flex flex-col items-center">
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 0.05s linear", filter: `drop-shadow(0 0 8px ${color}60)` }}
        />
      </svg>
      {/* Center content */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: size > 120 ? "2.5rem" : "1.75rem",
            fontWeight: 700,
            color: color,
            lineHeight: 1,
          }}
        >
          {displayScore}
        </span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "9px",
            color: "rgba(176, 196, 222, 0.5)",
            marginTop: "4px",
            letterSpacing: "0.08em",
          }}
        >
          / 100
        </span>
        <div
          className="mt-2 px-2 py-0.5 rounded"
          style={{
            background: getLabelBg(score),
            border: `1px solid ${color}40`,
          }}
        >
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "8px",
              fontWeight: 600,
              color: getLabelColor(score),
              letterSpacing: "0.1em",
            }}
          >
            {getLabel(score)}
          </span>
        </div>
      </div>
    </div>
  );
}
