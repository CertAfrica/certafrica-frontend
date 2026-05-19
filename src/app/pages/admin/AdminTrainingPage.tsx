import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Activity,
  CheckCircle2,
  Cpu,
  Database,
  Download,
  FileUp,
  Layers3,
  Pause,
  Play,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api";
import type { TrainingStatsResponse } from "../../lib/types";
import { AdminShell } from "./AdminShell";

const datasetCards = [
  { label: "Verified certificates", value: "24.8k", detail: "Training examples from confirmed uploads.", tone: "emerald" },
  { label: "Flagged anomalies", value: "1.2k", detail: "Edge cases used for fraud detection tuning.", tone: "amber" },
  { label: "OCR samples", value: "18.6k", detail: "Text extraction labels and layout annotations.", tone: "cyan" },
  { label: "Human reviews", value: "6.4k", detail: "Manually adjudicated outcomes for calibration.", tone: "violet" },
] as const;

const steps = [
  "Ingest recent scans",
  "Balance verified vs flagged samples",
  "Fine-tune classifier head",
  "Evaluate trust score drift",
  "Package model for deployment",
];

const checkpoints = [
  { name: "base-v12", status: "stable", score: 91.4 },
  { name: "ocr-augmentation", status: "candidate", score: 93.1 },
  { name: "layout-drift-fix", status: "candidate", score: 94.6 },
];

export function AdminTrainingPage() {
  const [training, setTraining] = useState(false);
  const [progress, setProgress] = useState(36);
  const [logIndex, setLogIndex] = useState(0);
  const [stats, setStats] = useState<TrainingStatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [certType, setCertType] = useState("certificate");
  const [institution, setInstitution] = useState("");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadStats() {
      setLoadingStats(true);
      try {
        const result = await api.getTrainingStats();
        if (!mounted) return;
        setStats(result);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to load training stats.");
      } finally {
        if (mounted) setLoadingStats(false);
      }
    }

    void loadStats();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!training) return;

    const id = window.setInterval(() => {
      setProgress((value) => Math.min(value + 3, 100));
      setLogIndex((value) => Math.min(value + 1, steps.length - 1));
    }, 700);

    return () => window.clearInterval(id);
  }, [training]);

  const phase = useMemo(() => {
    if (progress < 35) return "Preparing data";
    if (progress < 70) return "Fine-tuning";
    if (progress < 100) return "Validating";
    return "Ready to publish";
  }, [progress]);

  const samplesByLabel = useMemo(() => {
    const entries = Object.entries(stats?.samples_per_label ?? {});
    return entries.sort((left, right) => right[1] - left[1]);
  }, [stats]);

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(event.target.files?.[0] ?? null);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Pick a certificate file first.");
      return;
    }

    setBusy(true);
    try {
      const result = await api.uploadTrainingSample({
        certificate: selectedFile,
        certType,
        institution: institution.trim() || undefined,
      });
      toast.success(`Uploaded ${result.label} sample${result.retrained ? " and auto-retrained" : ""}.`);
      const freshStats = await api.getTrainingStats();
      setStats(freshStats);
      setTraining(true);
      setProgress((value) => Math.min(value + 20, 100));
      setLogIndex((value) => Math.min(value + 1, steps.length - 1));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload training sample.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell
      title="AI training studio"
      subtitle="Curate datasets, inspect training health, and observe how the verification model behaves before you publish a new version."
      eyebrow="AI TRAINING"
    >
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">Training run</div>
              <h2 className="mt-2 text-2xl font-semibold text-slate-50">Certificate trust model v13</h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300/70">
                This workspace visualizes how the model learns from verified certificates, anomalies, and review outcomes.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-200">
              <Activity size={13} />
              {phase}
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-white/8 bg-black/20 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-slate-50">Training progress</div>
                <div className="mt-1 text-xs text-slate-300/55">Live model adaptation and calibration</div>
              </div>
              <div className="text-3xl font-semibold text-emerald-300">{progress}%</div>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {steps.map((step, index) => {
                const active = index <= logIndex;
                return (
                  <div
                    key={step}
                    className="flex items-center gap-3 rounded-2xl border px-4 py-3"
                    style={{
                      background: active ? "rgba(18,163,123,0.1)" : "rgba(255,255,255,0.03)",
                      borderColor: active ? "rgba(18,163,123,0.22)" : "rgba(255,255,255,0.07)",
                    }}
                  >
                    {active ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Cpu size={14} className="text-slate-500" />}
                    <span className="text-sm text-slate-200/85">{step}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { label: "Total samples", value: loadingStats ? "—" : (stats?.total_samples ?? 0).toLocaleString(), icon: Database },
              { label: "Visual references", value: loadingStats ? "—" : (stats?.total_visual_references ?? 0).toLocaleString(), icon: FileUp },
              { label: "Model ready", value: loadingStats ? "—" : stats?.model_exists ? "Yes" : "No", icon: CheckCircle2 },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-white/8 bg-black/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">{item.label}</div>
                    <div className="mt-3 text-2xl font-semibold text-slate-50">{item.value}</div>
                  </div>
                  <item.icon size={18} className="text-emerald-300" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {datasetCards.map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.35 }}
                className="rounded-3xl border border-white/8 bg-black/20 p-4"
              >
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">{card.label}</div>
                <div className={`mt-3 text-3xl font-semibold ${card.tone === "emerald" ? "text-emerald-300" : card.tone === "amber" ? "text-amber-300" : card.tone === "cyan" ? "text-cyan-300" : "text-violet-300"}`}>
                  {card.value}
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300/70">{card.detail}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-[2rem] border border-white/8 bg-gradient-to-br from-emerald-500/15 via-cyan-500/8 to-violet-500/10 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">Run controls</div>
                <h3 className="mt-2 text-xl font-semibold text-slate-50">Start or pause training</h3>
              </div>
              <Sparkles size={16} className="text-emerald-300" />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 p-4 text-sm text-slate-300/75">
              {selectedFile ? (
                <>
                  Selected file: <span className="text-slate-50">{selectedFile.name}</span>
                </>
              ) : (
                "Pick a certificate, upload it as training data, then trigger retraining when needed."
              )}
            </div>

            <div className="mt-4 grid gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-white/30">Label</span>
                <input
                  value={certType}
                  onChange={(event) => setCertType(event.target.value)}
                  className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-slate-50 outline-none"
                  placeholder="certificate"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs uppercase tracking-[0.18em] text-white/30">Institution</span>
                <input
                  value={institution}
                  onChange={(event) => setInstitution(event.target.value)}
                  className="w-full rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-slate-50 outline-none"
                  placeholder="University of Lagos"
                />
              </label>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setTraining((value) => !value)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition-all hover:bg-white/10"
              >
                {training ? <Pause size={15} /> : <Play size={15} />}
                {training ? "Pause run" : "Start training animation"}
              </button>
              <button
                type="button"
                onClick={handleSelectFile}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200 transition-all hover:bg-emerald-400/15"
              >
                <UploadCloud size={15} />
                Choose dataset
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition-all hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Layers3 size={15} />
                {busy ? "Uploading…" : "Start training"}
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition-all hover:bg-white/10"
              >
                <Download size={15} />
                Export metrics
              </button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/8 bg-white/4 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">Model checkpoints</div>
            <div className="mt-4 space-y-3">
              {checkpoints.map((checkpoint, index) => (
                <motion.div
                  key={checkpoint.name}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.3 }}
                  className="rounded-2xl border border-white/8 bg-black/20 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-50">{checkpoint.name}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.16em] text-white/30">{checkpoint.status}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-semibold text-emerald-300">{checkpoint.score}%</div>
                      <div className="text-xs text-slate-300/55">validation</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-6 rounded-3xl border border-white/8 bg-black/20 p-4">
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">Samples by label</div>
              <div className="mt-4 space-y-3">
                {samplesByLabel.length ? (
                  samplesByLabel.map(([label, count]) => (
                    <div key={label} className="rounded-2xl border border-white/8 bg-white/4 p-3">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-slate-50">{label}</span>
                        <span className="text-emerald-300">{count}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                          style={{ width: `${Math.min(100, (count / Math.max(1, stats?.total_samples ?? 1)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/8 bg-white/4 p-3 text-sm text-slate-300/60">
                    No samples found yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
