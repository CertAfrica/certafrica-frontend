import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, CheckCircle2, RefreshCw, ShieldAlert, Sparkles, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import { AdminShell } from "./AdminShell";

const comparison = [
  { label: "Trust score", current: 90.8, candidate: 94.1, tone: "emerald" },
  { label: "False positives", current: 4.2, candidate: 2.6, tone: "amber" },
  { label: "OCR accuracy", current: 96.3, candidate: 97.9, tone: "cyan" },
  { label: "Manual review rate", current: 7.8, candidate: 5.1, tone: "violet" },
] as const;

const timeline = [
  "Pull the latest verified scans",
  "Rebalance mislabeled samples",
  "Run retrain against drifted classes",
  "Compare with current production model",
  "Publish or rollback the candidate model",
];

export function AdminRetrainPage() {
  const [running, setRunning] = useState(false);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(32);
  const [busy, setBusy] = useState(false);
  const [resultText, setResultText] = useState("Ready to start a fresh retrain cycle.");

  useEffect(() => {
    if (!running) return;

    const id = window.setInterval(() => {
      setStep((value) => Math.min(value + 1, timeline.length - 1));
      setScore((value) => Math.min(value + 6, 100));
    }, 850);

    return () => window.clearInterval(id);
  }, [running]);

  const status = useMemo(() => {
    if (score < 55) return "Preparing data";
    if (score < 80) return "Running retrain";
    if (score < 100) return "Comparing candidate";
    return "Ready for deployment";
  }, [score]);

  const handleRetrain = async () => {
    setBusy(true);
    setRunning(true);
    setResultText("Retraining in progress…");

    try {
      const result = await api.retrainModel(true);
      if (result.trained) {
        setScore(100);
        setStep(timeline.length - 1);
        setResultText(
          `Retrain completed${result.total_samples ? ` across ${result.total_samples} samples` : ""}.`,
        );
        toast.success("Retrain completed successfully.");
      } else {
        setResultText(result.reason ? `Retrain skipped: ${result.reason}` : "Retrain completed without changes.");
        toast.message("Retrain finished.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to retrain model.";
      setResultText(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell
      title="Retrain workspace"
      subtitle="Use this panel when the model needs a new calibration cycle, a fresh dataset, or a controlled deploy review."
      eyebrow="RETRAIN"
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">Retrain cycle</div>
              <h2 className="mt-2 text-2xl font-semibold text-slate-50">Precision refresh for the verification model</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300/70">
                When new document templates, altered layouts, or fraud patterns appear, retraining keeps the AI sharp.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-xs text-amber-200">
              <AlertTriangle size={13} />
              {status}
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-white/8 bg-black/20 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-50">Retrain progress</div>
                <div className="mt-1 text-xs text-slate-300/55">Candidate model evaluation and drift correction</div>
              </div>
              <div className="text-3xl font-semibold text-cyan-300">{score}%</div>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-violet-400"
                animate={{ width: `${score}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ width: `${score}%` }}
              />
            </div>

            <div className="mt-5 space-y-3">
              {timeline.map((item, index) => {
                const active = index <= step;
                return (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-2xl border px-4 py-3"
                    style={{
                      background: active ? "rgba(59,139,212,0.12)" : "rgba(255,255,255,0.03)",
                      borderColor: active ? "rgba(59,139,212,0.25)" : "rgba(255,255,255,0.07)",
                    }}
                  >
                    {active ? <CheckCircle2 size={14} className="text-cyan-300" /> : <RefreshCw size={14} className="text-slate-500" />}
                    <span className="text-sm text-slate-200/85">{item}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {comparison.map((item, index) => {
              const delta = item.candidate - item.current;
              const improved = item.label === "False positives" ? delta < 0 : delta > 0;

              return (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.35 }}
                  className="rounded-3xl border border-white/8 bg-black/20 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-slate-50">{item.label}</div>
                      <div className="mt-1 text-xs text-slate-300/55">Current vs candidate</div>
                    </div>
                    <div className={`text-2xl font-semibold ${item.tone === "emerald" ? "text-emerald-300" : item.tone === "amber" ? "text-amber-300" : item.tone === "cyan" ? "text-cyan-300" : "text-violet-300"}`}>
                      {improved ? (item.label === "False positives" ? `-${Math.abs(delta).toFixed(1)}` : `+${delta.toFixed(1)}`) : `${delta.toFixed(1)}`}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-300/65">
                    <span>Current: {item.current}%</span>
                    <span>Candidate: {item.candidate}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full ${item.tone === "emerald" ? "bg-emerald-400" : item.tone === "amber" ? "bg-amber-400" : item.tone === "cyan" ? "bg-cyan-400" : "bg-violet-400"}`}
                      style={{ width: `${Math.max(item.current, item.candidate)}%` }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-white/8 bg-gradient-to-br from-violet-500/15 via-cyan-500/10 to-emerald-500/10 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">Retrain controls</div>
                <h3 className="mt-2 text-xl font-semibold text-slate-50">Deploy a safer candidate model</h3>
              </div>
              <Sparkles size={16} className="text-cyan-300" />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setRunning((value) => !value)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition-all hover:bg-white/10"
              >
                <RefreshCw size={15} className={running ? "animate-spin" : undefined} />
                {running ? "Pause retrain" : "Start retrain"}
              </button>
              <button
                type="button"
                onClick={handleRetrain}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-medium text-cyan-200 transition-all hover:bg-cyan-400/15"
              >
                {busy ? <Loader2 size={15} className="animate-spin" /> : <TrendingUp size={15} />}
                {busy ? "Retraining…" : "Run retrain"}
              </button>
            </div>

            <div className="mt-5 rounded-3xl border border-white/8 bg-black/20 p-4 text-sm leading-7 text-slate-300/75">
              {resultText}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-50">Deployment checklist</h3>
              <ShieldAlert size={15} className="text-amber-300" />
            </div>
            <div className="mt-4 space-y-3">
              {[
                "Compare drift against the last stable version",
                "Review low-confidence samples from the training set",
                "Check heatmap consistency for fraud-sensitive templates",
                "Roll back automatically if validation drops below threshold",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/8 bg-black/20 p-4 text-sm text-slate-200/80">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
