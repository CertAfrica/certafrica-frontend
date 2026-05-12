import { Link } from "react-router";
import { motion } from "motion/react";
import {
  Shield,
  Zap,
  Eye,
  Brain,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Upload,
  Building2,
  GraduationCap,
  Briefcase,
  FileSearch,
  ChevronRight,
  TrendingUp,
  Globe,
} from "lucide-react";

const stats = [
  { value: "30%", label: "Of CVs in Nigerian hiring contain at least one unverifiable credential" },
  { value: "72hrs", label: "Average manual WAEC/JAMB verification turnaround — if completed at all" },
  { value: "₦15B+", label: "Estimated annual value of fraudulent credentials in West Africa" },
];

const supportedTypes = [
  { emoji: "📄", label: "WAEC Certificate", category: "Secondary School", color: "#3B8BD4" },
  { emoji: "📄", label: "NECO Certificate", category: "Secondary School", color: "#3B8BD4" },
  { emoji: "🎓", label: "JAMB UTME", category: "University Entrance", color: "#12A37B" },
  { emoji: "🎓", label: "University Degree", category: "Higher Institution", color: "#534AB7" },
  { emoji: "🎓", label: "Postgraduate (MSc/PhD)", category: "Higher Institution", color: "#534AB7" },
  { emoji: "📋", label: "HND / OND", category: "Higher Institution", color: "#BA7517" },
  { emoji: "🎖️", label: "NYSC Discharge", category: "National Service", color: "#12A37B" },
  { emoji: "💼", label: "ICAN Certificate", category: "Professional Body", color: "#8A3A1C" },
  { emoji: "⚙️", label: "COREN Certificate", category: "Professional Body", color: "#8A3A1C" },
  { emoji: "🏥", label: "MDCN License", category: "Professional Body", color: "#8A3A1C" },
  { emoji: "⚖️", label: "NBA Law Cert.", category: "Professional Body", color: "#8A3A1C" },
  { emoji: "📊", label: "ACCA / CFA / PMP", category: "International Prof.", color: "#534AB7" },
];

const howItWorks = [
  {
    num: "01",
    icon: Upload,
    title: "Upload Document",
    desc: "PDF, JPEG, PNG — mobile scan or desktop. Accepts WAEC results, university degrees, NYSC letters, transcripts.",
  },
  {
    num: "02",
    icon: Brain,
    title: "4-Layer AI Analysis",
    desc: "Computer vision forgery detection, OCR entity extraction, semantic anomaly detection, and live registry cross-check.",
  },
  {
    num: "03",
    icon: Eye,
    title: "Authenticity Score",
    desc: "Weighted ensemble produces a 0–100 score with plain-English explainability — no black box, every flag is explained.",
  },
  {
    num: "04",
    icon: Lock,
    title: "Squad API Gate",
    desc: "Credential-dependent payments (licensing fees, admission deposits) are automatically held or released based on score.",
  },
];

const features = [
  {
    icon: Brain,
    color: "#534AB7",
    tag: "MUST HAVE",
    tagColor: "#A32D2D",
    title: "Visual Forgery Detection",
    desc: "Twin-branch CNN (EfficientNet-B4) trained on genuine vs. manipulated certificate pairs. Detects font inconsistencies, ELA artefacts, and pixel-level tampering.",
  },
  {
    icon: FileSearch,
    color: "#12A37B",
    tag: "MUST HAVE",
    tagColor: "#A32D2D",
    title: "Structured Entity Extraction",
    desc: "LayoutLM v3 extracts candidate name, exam number, grades, institution — returned as structured JSON for downstream systems.",
  },
  {
    icon: Globe,
    color: "#3B8BD4",
    tag: "SHOULD HAVE",
    tagColor: "#BA7517",
    title: "Live Registry Cross-Check",
    desc: "Real-time WAEC, JAMB, and NYSC verification lookup for documents with extractable exam numbers. Ground truth that overrides AI signals.",
  },
  {
    icon: TrendingUp,
    color: "#BA7517",
    tag: "COULD HAVE",
    tagColor: "#3B6D11",
    title: "Batch Anomaly Detection",
    desc: "Graph anomaly model flags coordinated forgery rings — if 15 candidates share suspiciously similar document templates, the batch is escalated.",
  },
];

const users = [
  { icon: Briefcase, title: "HR & Recruitment Teams", desc: "Bulk verification in ATS workflows — Workable, BambooHR, Greenhouse." },
  { icon: Building2, title: "Licensing Bodies", desc: "MDCN, COREN, NBA, ICAN — verify prerequisites before issuing practicing certificates." },
  { icon: GraduationCap, title: "University Admissions", desc: "Pre-screen WAEC/NECO/JAMB results before full institutional verification." },
  { icon: Shield, title: "Background Check Firms", desc: "Integrate CertChain as a credential intelligence layer in existing pipelines." },
];

const scoreBands = [
  { range: "85–100", label: "Verified — Auto-pass", color: "#12A37B", bg: "rgba(18, 163, 123, 0.08)", border: "rgba(18, 163, 123, 0.25)", icon: CheckCircle2 },
  { range: "55–84", label: "Inconclusive — Human Review", color: "#F59E0B", bg: "rgba(245, 158, 11, 0.08)", border: "rgba(245, 158, 11, 0.25)", icon: AlertTriangle },
  { range: "0–54", label: "High-Risk — Reject / Hold", color: "#EF4444", bg: "rgba(239, 68, 68, 0.08)", border: "rgba(239, 68, 68, 0.25)", icon: XCircle },
];

export function LandingPage() {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #0A1628 0%, #08111E 40%, #06190F 100%)",
          minHeight: "calc(100vh - 64px)",
        }}
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "linear-gradient(rgba(18,163,123,1) 1px, transparent 1px), linear-gradient(90deg, rgba(18,163,123,1) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Glow effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div style={{ position: "absolute", top: "20%", left: "10%", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(15,110,86,0.12) 0%, transparent 70%)" }} />
          <div style={{ position: "absolute", top: "40%", right: "5%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(13,43,78,0.3) 0%, transparent 70%)" }} />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 md:px-10 py-20 md:py-28 flex flex-col items-center text-center">
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
            style={{
              background: "rgba(15, 110, 86, 0.12)",
              border: "1px solid rgba(18, 163, 123, 0.35)",
            }}
          >
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#12A37B" }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "#12A37B", letterSpacing: "0.08em" }}>
              PRD v1.0 — Education Integrity · Challenge 01
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(2.4rem, 6vw, 4.2rem)",
              fontWeight: 600,
              color: "#F0F6FF",
              lineHeight: 1.1,
              maxWidth: "820px",
              marginBottom: "1.5rem",
            }}
          >
            Stop Credential Fraud{" "}
            <em style={{ fontStyle: "italic", color: "#12A37B" }}>Before</em>{" "}
            It Costs You
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontFamily: "'IBM Plex Sans', sans-serif",
              fontSize: "clamp(0.95rem, 2vw, 1.125rem)",
              color: "rgba(176, 196, 222, 0.75)",
              maxWidth: "620px",
              lineHeight: 1.75,
              marginBottom: "2.5rem",
            }}
          >
            CertChain AI is a multi-modal credential intelligence platform that detects forged WAEC results, fake degrees, and fraudulent NYSC letters — with an economically-enforceable Squad API payment gate.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap gap-3 justify-center mb-20"
          >
            <Link
              to="/verify"
              className="flex items-center gap-2 px-6 py-3 rounded-xl no-underline transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #0F6E56, #12A37B)",
                color: "white",
                fontSize: "14px",
                fontWeight: 600,
                fontFamily: "'IBM Plex Sans', sans-serif",
                boxShadow: "0 8px 32px rgba(18, 163, 123, 0.3)",
              }}
            >
              <Upload size={15} />
              Verify a Document
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-6 py-3 rounded-xl no-underline transition-all hover:opacity-90"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(176, 196, 222, 0.9)",
                fontSize: "14px",
                fontWeight: 500,
                fontFamily: "'IBM Plex Sans', sans-serif",
              }}
            >
              View Dashboard
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl"
          >
            {stats.map((stat, i) => (
              <div
                key={i}
                className="rounded-2xl p-5 text-center"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "2rem",
                    fontWeight: 600,
                    color: "#EF4444",
                    lineHeight: 1,
                    marginBottom: "8px",
                  }}
                >
                  {stat.value}
                </div>
                <div
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: "12px",
                    color: "rgba(176, 196, 222, 0.6)",
                    lineHeight: 1.55,
                  }}
                >
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Supported Document Types */}
      <section className="py-14" style={{ background: "#08111E", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="flex items-center gap-3 mb-6">
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.35)", letterSpacing: "0.1em" }}>
              SUPPORTED DOCUMENT TYPES
            </span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.35)", letterSpacing: "0.06em" }}>
              {supportedTypes.length} TYPES · 5 CATEGORIES
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {supportedTypes.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                viewport={{ once: true }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: `1px solid rgba(255,255,255,0.07)`,
                  borderLeft: `2px solid ${t.color}`,
                }}
              >
                <span style={{ fontSize: "13px" }}>{t.emoji}</span>
                <div>
                  <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "12px", color: "#F0F6FF", fontWeight: 500 }}>{t.label}</div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: t.color, letterSpacing: "0.04em" }}>{t.category}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section
        className="py-20 md:py-28"
        style={{ background: "#08111E" }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(15,110,86,0.1)", border: "1px solid rgba(18,163,123,0.2)" }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#12A37B", letterSpacing: "0.1em" }}>HOW IT WORKS</span>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", color: "#F0F6FF", lineHeight: 1.2, marginBottom: "12px" }}>
              From Upload to Verified in{" "}
              <em style={{ color: "#12A37B" }}>Under 90 Seconds</em>
            </h2>
            <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "14px", color: "rgba(176,196,222,0.6)", maxWidth: "480px", margin: "0 auto" }}>
              A four-layer AI pipeline that pre-screens at scale — so expensive manual checks only happen when they're truly needed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {howItWorks.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="relative rounded-2xl p-6"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {/* Step connector */}
                {i < howItWorks.length - 1 && (
                  <div
                    className="hidden lg:block absolute top-10 right-0 translate-x-1/2 z-10"
                    style={{ color: "rgba(18,163,123,0.3)", fontSize: "18px" }}
                  >
                    →
                  </div>
                )}
                <div
                  className="mb-4 flex items-center justify-between"
                >
                  <div
                    className="flex items-center justify-center rounded-xl"
                    style={{
                      width: "40px",
                      height: "40px",
                      background: "rgba(15,110,86,0.15)",
                      border: "1px solid rgba(18,163,123,0.25)",
                    }}
                  >
                    <step.icon size={18} color="#12A37B" />
                  </div>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "11px",
                      color: "rgba(176,196,222,0.25)",
                      fontWeight: 500,
                    }}
                  >
                    {step.num}
                  </span>
                </div>
                <h3
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#F0F6FF",
                    marginBottom: "8px",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: "12.5px",
                    color: "rgba(176,196,222,0.6)",
                    lineHeight: 1.65,
                    margin: 0,
                  }}
                >
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Score Bands */}
      <section
        className="py-16"
        style={{ background: "linear-gradient(180deg, #08111E 0%, #091520 100%)" }}
      >
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(15,110,86,0.1)", border: "1px solid rgba(18,163,123,0.2)" }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#12A37B", letterSpacing: "0.1em" }}>AUTHENTICITY SCORE</span>
              </div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)", color: "#F0F6FF", lineHeight: 1.2, marginBottom: "16px" }}>
                Every Flag is Explained.<br />
                <em style={{ color: "#12A37B" }}>No Black Boxes.</em>
              </h2>
              <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "13.5px", color: "rgba(176,196,222,0.65)", lineHeight: 1.75, marginBottom: "24px" }}>
                The composite Authenticity Score (0–100) comes from a weighted ensemble of five signal groups — with SHAP-derived plain-English explanations for every anomaly flag.
              </p>

              {/* Score weights */}
              {[
                { label: "Visual Forgery Detection (CNN)", pct: 35, color: "#534AB7" },
                { label: "Security Feature Integrity", pct: 20, color: "#12A37B" },
                { label: "Semantic Entity Validation", pct: 20, color: "#3B8BD4" },
                { label: "Registry Cross-Check", pct: 15, color: "#BA7517" },
                { label: "Document Quality Assessment", pct: 10, color: "#A32D2D" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 mb-3">
                  <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "12.5px", color: "rgba(176,196,222,0.75)", flex: 1 }}>{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div style={{ width: "80px", height: "4px", background: "rgba(255,255,255,0.07)", borderRadius: "2px", overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.pct * (80 / 35)}px` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        viewport={{ once: true }}
                        style={{ height: "100%", background: item.color, borderRadius: "2px", maxWidth: "80px" }}
                      />
                    </div>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "rgba(176,196,222,0.5)", minWidth: "28px" }}>{item.pct}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3">
              {scoreBands.map((band, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4 p-4 rounded-xl"
                  style={{ background: band.bg, border: `1px solid ${band.border}` }}
                >
                  <band.icon size={22} color={band.color} />
                  <div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "14px", fontWeight: 600, color: band.color }}>{band.range}</div>
                    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "12.5px", color: "rgba(176,196,222,0.65)", marginTop: "2px" }}>{band.label}</div>
                  </div>
                </motion.div>
              ))}

              {/* Squad gate callout */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                viewport={{ once: true }}
                className="mt-2 p-4 rounded-xl"
                style={{
                  background: "rgba(13,43,78,0.4)",
                  border: "1px solid rgba(59,139,212,0.25)",
                  borderLeft: "3px solid #3B8BD4",
                }}
              >
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: "#3B8BD4", letterSpacing: "0.1em", marginBottom: "6px" }}>SQUAD API INTEGRATION</div>
                <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "12.5px", color: "rgba(176,196,222,0.7)", lineHeight: 1.6, margin: 0 }}>
                  Credential-dependent payments are <strong style={{ color: "#F0F6FF" }}>economically enforced</strong> — licensing fees, admission deposits, and payouts are held until the document clears the configured threshold.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20" style={{ background: "#08111E" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(15,110,86,0.1)", border: "1px solid rgba(18,163,123,0.2)" }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#12A37B", letterSpacing: "0.1em" }}>AI/ML CORE ENGINE</span>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", color: "#F0F6FF", lineHeight: 1.2 }}>
              Four Layers of Intelligence
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderTop: `2px solid ${feat.color}`,
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex items-center justify-center rounded-xl flex-shrink-0"
                    style={{
                      width: "42px",
                      height: "42px",
                      background: `${feat.color}18`,
                      border: `1px solid ${feat.color}30`,
                    }}
                  >
                    <feat.icon size={20} color={feat.color} />
                  </div>
                  <div>
                    <div
                      className="mb-1"
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "9px",
                        color: feat.tagColor,
                        letterSpacing: "0.08em",
                        fontWeight: 500,
                      }}
                    >
                      {feat.tag}
                    </div>
                    <h3 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "14px", fontWeight: 600, color: "#F0F6FF", marginBottom: "6px" }}>
                      {feat.title}
                    </h3>
                    <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "12.5px", color: "rgba(176,196,222,0.65)", lineHeight: 1.65, margin: 0 }}>
                      {feat.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing snapshot */}
      <section className="py-20" style={{ background: "#06111C" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(15,110,86,0.1)", border: "1px solid rgba(18,163,123,0.2)" }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#12A37B", letterSpacing: "0.1em" }}>PRICING</span>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", color: "#F0F6FF", lineHeight: 1.2 }}>
              Plans that scale with your verification volume
            </h2>
            <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "13.5px", color: "rgba(176,196,222,0.7)", lineHeight: 1.75, maxWidth: "70ch", margin: "12px auto 0" }}>
              Free: “2 free verifications every month.” Starter: “10 monthly verifications plus discounted scan pricing.” Pro: “100 monthly verifications with rollover scans, ₦300 additional scans, bulk pricing, team tools, and faster processing.”
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl no-underline transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #0F6E56, #12A37B)", color: "white", fontSize: "14px", fontWeight: 600 }}
            >
              View pricing
              <ArrowRight size={14} />
            </Link>
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl no-underline transition-all hover:opacity-90"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(176, 196, 222, 0.9)", fontSize: "14px", fontWeight: 500 }}
            >
              Start onboarding
            </Link>
          </div>
        </div>
      </section>

      {/* Who It's For */}
      <section className="py-20" style={{ background: "linear-gradient(180deg, #08111E 0%, #091b12 100%)" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4" style={{ background: "rgba(15,110,86,0.1)", border: "1px solid rgba(18,163,123,0.2)" }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#12A37B", letterSpacing: "0.1em" }}>TARGET USERS</span>
            </div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", color: "#F0F6FF", lineHeight: 1.2 }}>
              Built for the Organisations{" "}
              <em style={{ color: "#12A37B" }}>That Can't Afford Fraud</em>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {users.map((user, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl text-center"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <div
                  className="flex items-center justify-center rounded-xl mx-auto mb-4"
                  style={{
                    width: "48px",
                    height: "48px",
                    background: "rgba(15,110,86,0.15)",
                    border: "1px solid rgba(18,163,123,0.2)",
                  }}
                >
                  <user.icon size={22} color="#12A37B" />
                </div>
                <h3 style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "14px", fontWeight: 600, color: "#F0F6FF", marginBottom: "8px" }}>
                  {user.title}
                </h3>
                <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "12px", color: "rgba(176,196,222,0.55)", lineHeight: 1.6, margin: 0 }}>
                  {user.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="py-20"
        style={{
          background: "linear-gradient(135deg, #091520 0%, #06190F 100%)",
          borderTop: "1px solid rgba(18,163,123,0.15)",
        }}
      >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(1.8rem, 4vw, 2.8rem)",
                color: "#F0F6FF",
                lineHeight: 1.2,
                marginBottom: "16px",
              }}
            >
              Try the{" "}
              <em style={{ color: "#12A37B" }}>Live Demo</em>
            </h2>
            <p style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "14.5px", color: "rgba(176,196,222,0.65)", lineHeight: 1.75, marginBottom: "32px" }}>
              Upload a synthetic forged WAEC result — watch the model flag the font inconsistency in the grade column. Then try the genuine version. See Squad API gate a ₦50,000 licensing payment in real time.
            </p>
            <Link
              to="/verify"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl no-underline transition-all hover:opacity-90 hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, #0F6E56, #12A37B)",
                color: "white",
                fontSize: "15px",
                fontWeight: 600,
                fontFamily: "'IBM Plex Sans', sans-serif",
                boxShadow: "0 12px 40px rgba(18,163,123,0.35)",
              }}
            >
              <Upload size={16} />
              Start Verifying
              <ChevronRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-6 text-center"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "#08111E",
        }}
      >
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "rgba(176,196,222,0.3)", letterSpacing: "0.05em" }}>
          CertChain AI — PRD v1.0 · Challenge 01: Proof of Life · Education Domain
        </span>
      </footer>
    </div>
  );
}