import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronRight,
  CreditCard,
  FileText,
  Loader2,
  LogIn,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
  Wallet,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ScoreRing } from "../components/ScoreRing";
import { PaymentModal } from "../components/PaymentModal";
import { useAuth } from "../context/AuthContext";
import { api, extractCheckoutUrl } from "../lib/api";
import { formatFriendlyDate } from "../lib/date";
import type {
  PaymentCheckoutResponse,
  Scan,
  ScanSubmissionResponse,
  ScanUsageSummary,
  Wallet as WalletType,
} from "../lib/types";

function formatCurrency(value: string | number | undefined, currency = "NGN") {
  const amount = typeof value === "string" ? Number.parseFloat(value) : value ?? 0;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function scanLabel(value: string) {
  return value.replaceAll("_", " ");
}

function scoreForScan(scan: Scan | null) {
  if (!scan) return 0;
  if (typeof scan.trustScore === "number") return Math.round(scan.trustScore);
  if (scan.verificationStatus === "VERIFIED") return 91;
  if (scan.verificationStatus === "INCONCLUSIVE") return 66;
  if (scan.verificationStatus === "FLAGGED") return 34;
  if (scan.verificationStatus === "FAILED") return 22;
  if (scan.status === "PROCESSING") return 52;
  return 58;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function VerifyPage() {
  const { status, user, isAuthenticated, login, signup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);


  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const [uploadResult, setUploadResult] = useState<ScanSubmissionResponse | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<PaymentCheckoutResponse | null>(null);
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [usage, setUsage] = useState<ScanUsageSummary | null>(null);
  const [recentScans, setRecentScans] = useState<Scan[]>([]);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentModalType, setPaymentModalType] = useState<"scan" | "wallet_topup" | "subscription">("scan");
  const [pendingVerificationFile, setPendingVerificationFile] = useState<File | null>(null);

  const loadWorkspace = useCallback(async () => {
    if (!isAuthenticated) return;
    const canAccessWallet = user?.plan !== "FREE";
    setWorkspaceError(null);

    try {
      const [walletResponse, scansResponse, usageResponse] = await Promise.allSettled([
        canAccessWallet ? api.getWallet() : Promise.resolve(null),
        api.getScans(1, 5),
        api.getScanUsage(),
      ]);

      setWallet(walletResponse.status === "fulfilled" ? walletResponse.value : null);
      setRecentScans(scansResponse.status === "fulfilled" ? scansResponse.value.items : []);
      setUsage(usageResponse.status === "fulfilled" ? usageResponse.value : null);
    } catch (error) {
      setWorkspaceError(error instanceof Error ? error.message : "Unable to load workspace.");
    }
  }, [isAuthenticated, user?.plan]);

  useEffect(() => {
    if (isAuthenticated) void loadWorkspace();
  }, [isAuthenticated, loadWorkspace]);

  // Redirect after successful login if we came from a protected route
  useEffect(() => {
    if (isAuthenticated && location.state?.from?.pathname && location.state.from.pathname !== "/verify") {
      navigate(location.state.from.pathname, { replace: true });
    }
  }, [isAuthenticated, location.state, navigate]);

  const plan = user?.plan ?? "FREE";
  const walletBalance = wallet ? Number(wallet.balance) : 0;
  const showWallet = plan !== "FREE";

  const verifyBlockReason =
    plan === "FREE" && usage?.monthlyRemaining === 0
      ? "Free scans exhausted. Each scan now costs ₦500."
      : plan === "STARTER" && usage?.monthlyRemaining === 0 && walletBalance <= 0
        ? "Monthly scans exhausted and wallet empty. Top up to continue."
        : null;

  // Step state for the stepper
  const currentStep = uploadResult
    ? uploadResult.scan.verificationStatus === "VERIFIED" ||
      uploadResult.scan.verificationStatus === "FLAGGED" ||
      uploadResult.scan.verificationStatus === "FAILED"
      ? 3
      : uploadResult.paymentRequired && uploadResult.scan.paymentStatus !== "SUCCESS"
        ? 1
        : 2
    : 0;

  const verificationInProgress =
    uploadResult?.scan.status === "PROCESSING" || uploadResult?.scan.verificationStatus === "PROCESSING";


  const handleVerification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      toast.error("Please choose a certificate file first.");
      return;
    }

    // Pre-pay path
    if (verifyBlockReason) {
      setSubmitting(true);
      try {
        const amount = plan === "FREE" ? 500 : 400;
        const payment = await api.initializePayment({ type: "wallet_topup", amount });
        const checkoutUrl = extractCheckoutUrl(payment.checkout);

        setCheckoutResult(payment);
        setPaymentModalType("wallet_topup");
        setPaymentModalOpen(true);
        setPendingVerificationFile(selectedFile);

        if (checkoutUrl) {
          window.open(checkoutUrl, "_blank", "width=900,height=700");
        }
        toast.message("Complete payment, then verify in the modal to submit your scan.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to initialize payment.");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);
    try {
      const submission = await api.submitScan(selectedFile);
      setUploadResult(submission);
      setCheckoutResult(null);
      toast.success("Certificate uploaded");

      if (submission.paymentRequired && submission.transaction) {
        const payment = await api.initializePayment({
          type: "scan",
          scanId: submission.scan.id,
        });
        setCheckoutResult(payment);
        setPaymentModalType("scan");
        const checkoutUrl = extractCheckoutUrl(payment.checkout);
        if (checkoutUrl) {
          window.open(checkoutUrl, "_blank", "width=900,height=700");
        }
        setPaymentModalOpen(true);
      }

      await loadWorkspace();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit your certificate.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckPayment = async () => {
    if (!uploadResult?.transaction?.reference) return;
    try {
      const result = await api.verifyPayment(uploadResult.transaction.reference);
      if (result.processed) {
        toast.success("Payment verified. Scan queued.");
        await loadWorkspace();
      } else {
        toast.message(result.paymentStatus ? `Payment ${result.paymentStatus.toLowerCase()}.` : "Payment still processing.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to verify payment.");
    }
  };

  const resetForNewVerification = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setCheckoutResult(null);
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-[calc(100vh-64px)] pt-26 flex items-center justify-center px-6">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 animate-spin" size={28} color="#12A37B" />
          <p style={{ color: "rgba(176,196,222,0.7)" }}>Loading workspace…</p>
        </div>
      </div>
    );
  }

  // Auth gate
  if (!isAuthenticated) {
    
  }

  return (
    <div className="min-h-screen pt-16 px-6 md:px-10 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header + stepper */}
        <div>
          <div
            className="flex items-center gap-2 mb-2 text-xs"
            style={{ color: "rgba(176,196,222,0.45)", letterSpacing: "0.08em" }}
          >
            <Link to="/" className="no-underline" style={{ color: "inherit" }}>
              Home
            </Link>
            <ChevronRight size={10} />
            <span style={{ color: "#12A37B" }}>Verify</span>
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(1.9rem, 4vw, 2.8rem)",
              color: "#F0F6FF",
              lineHeight: 1.1,
              marginBottom: "6px",
            }}
          >
            Verify a certificate
          </h1>
          <p style={{ color: "rgba(176,196,222,0.65)" }}>
            Upload a document, complete payment if needed, and get an AI-driven authenticity report.
          </p>

          <Stepper current={currentStep} />
        </div>

        {/* Block reason banner */}
        {verifyBlockReason && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 flex items-start gap-3"
            style={{
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.22)",
            }}
          >
            <AlertCircle size={16} color="#F59E0B" className="mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div style={{ color: "#F59E0B", fontSize: "13px", fontWeight: 600 }}>Action needed</div>
              <p style={{ color: "rgba(176,196,222,0.78)", fontSize: "13px", lineHeight: 1.6, margin: 0 }}>
                {verifyBlockReason}
              </p>
            </div>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 items-start">
          {/* LEFT: upload + result */}
          <div className="space-y-6">
            {!uploadResult ? (
              <form
                onSubmit={handleVerification}
                className="rounded-3xl p-6 md:p-7 certafrica-fade-in"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "10px",
                        color: "rgba(176,196,222,0.4)",
                        letterSpacing: "0.08em",
                      }}
                    >
                      DOCUMENT UPLOAD
                    </div>
                    <h2 style={{ color: "#F0F6FF", fontSize: "1.15rem", marginTop: "4px" }}>
                      Submit a certificate for AI analysis
                    </h2>
                  </div>
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDropActive(true);
                  }}
                  onDragLeave={() => setDropActive(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDropActive(false);
                    const file = event.dataTransfer.files?.[0];
                    if (file) setSelectedFile(file);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl p-8 text-center cursor-pointer transition-all"
                  style={{
                    background: dropActive ? "rgba(18,163,123,0.08)" : "rgba(255,255,255,0.02)",
                    border: `1.5px dashed ${
                      dropActive ? "rgba(18,163,123,0.55)" : "rgba(255,255,255,0.1)"
                    }`,
                    minHeight: selectedFile ? "auto" : "240px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    hidden
                    onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  />

                  {selectedFile ? (
                    <div className="w-full" onClick={(e) => e.stopPropagation()}>
                      <div
                        className="flex items-center gap-3 rounded-2xl p-4 mb-3"
                        style={{
                          background: "rgba(18,163,123,0.06)",
                          border: "1px solid rgba(18,163,123,0.2)",
                        }}
                      >
                        <div
                          className="rounded-xl p-2.5"
                          style={{ background: "rgba(18,163,123,0.12)" }}
                        >
                          <FileText size={18} color="#12A37B" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div
                            style={{
                              color: "#F0F6FF",
                              fontSize: "13px",
                              fontWeight: 600,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {selectedFile.name}
                          </div>
                          <div style={{ color: "rgba(176,196,222,0.6)", fontSize: "11px" }}>
                            {formatFileSize(selectedFile.size)} · {selectedFile.type || "Unknown type"}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            borderRadius: "8px",
                            padding: "6px",
                            color: "rgba(176,196,222,0.7)",
                            cursor: "pointer",
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#12A37B",
                          fontSize: "12px",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Choose a different file
                      </button>
                    </div>
                  ) : (
                    <>
                      <div
                        className="flex items-center justify-center rounded-2xl mb-4"
                        style={{
                          width: "56px",
                          height: "56px",
                          background: "rgba(18,163,123,0.1)",
                          border: "1px solid rgba(18,163,123,0.18)",
                        }}
                      >
                        <Upload size={24} color="#12A37B" />
                      </div>
                      <div style={{ color: "#F0F6FF", fontSize: "1.05rem", marginBottom: "6px" }}>
                        Drop a certificate here, or click to browse
                      </div>
                      <p
                        style={{
                          color: "rgba(176,196,222,0.55)",
                          fontSize: "12px",
                          lineHeight: 1.5,
                          maxWidth: "40ch",
                          margin: 0,
                        }}
                      >
                        PDF, JPG, or PNG up to 20MB. We'll classify the document type, run forgery
                        detection, and cross-check the registry.
                      </p>
                    </>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
                  <div className="flex items-center gap-2" style={{ color: "rgba(176,196,222,0.62)", fontSize: "12px" }}>
                    <ShieldCheck size={13} color="#12A37B" />
                    <span>Encrypted in transit and at rest</span>
                  </div>
                  <button
                    type="submit"
                    disabled={submitting || !selectedFile}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-3 transition-opacity disabled:opacity-60"
                    style={{
                      background: "linear-gradient(135deg, #0F6E56, #12A37B)",
                      color: "white",
                      fontWeight: 600,
                    }}
                  >
                    {submitting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {submitting ? "Submitting…" : "Start verification"}
                    {!submitting && <ArrowRight size={14} />}
                  </button>
                </div>
              </form>
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-3xl p-6 md:p-7"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                    <div>
                      <div
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: "10px",
                          color: "rgba(176,196,222,0.4)",
                          letterSpacing: "0.08em",
                        }}
                      >
                        SUBMISSION
                      </div>
                      <h2 style={{ color: "#F0F6FF", fontSize: "1.1rem", marginTop: "4px" }}>
                        {uploadResult.scan.fileName}
                      </h2>
                      <p style={{ color: "rgba(176,196,222,0.6)", fontSize: "12px", margin: "2px 0 0" }}>
                        Scan {uploadResult.scan.scanCode}
                      </p>
                    </div>
                    <div
                      className="rounded-2xl px-4 py-2.5 text-right"
                      style={{
                        background: uploadResult.paymentRequired
                          ? "rgba(245,158,11,0.08)"
                          : "rgba(18,163,123,0.08)",
                        border: `1px solid ${
                          uploadResult.paymentRequired
                            ? "rgba(245,158,11,0.2)"
                            : "rgba(18,163,123,0.2)"
                        }`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "10px",
                          color: uploadResult.paymentRequired ? "#F59E0B" : "#12A37B",
                          letterSpacing: "0.08em",
                          fontWeight: 600,
                        }}
                      >
                        {uploadResult.paymentRequired ? "PAYMENT REQUIRED" : "QUEUED"}
                      </div>
                      <div style={{ color: "#F0F6FF", marginTop: "2px", fontWeight: 600 }}>
                        {formatCurrency(uploadResult.pricing.price, uploadResult.pricing.currency)}
                      </div>
                    </div>
                  </div>

                  {verificationInProgress ? (
                    <VerificationProgressPanel />
                  ) : (
                    <div className="grid md:grid-cols-[180px_1fr] gap-6 items-center">
                      <ScoreRing score={scoreForScan(uploadResult.scan)} size={160} animate />
                      <div className="space-y-2">
                        {[
                          ["Status", scanLabel(uploadResult.scan.status)],
                          ["Verification", scanLabel(uploadResult.scan.verificationStatus)],
                          ["Payment", scanLabel(uploadResult.scan.paymentStatus)],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="flex items-center justify-between rounded-xl px-3 py-2"
                            style={{
                              background: "rgba(255,255,255,0.03)",
                              border: "1px solid rgba(255,255,255,0.05)",
                            }}
                          >
                            <span style={{ color: "rgba(176,196,222,0.6)", fontSize: "12px" }}>{label}</span>
                            <span style={{ color: "#F0F6FF", fontSize: "12.5px", fontWeight: 500 }}>
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 mt-6 pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    <Link
                      to={`/results/${uploadResult.scan.id}`}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 no-underline"
                      style={{
                        background: "linear-gradient(135deg, #0F6E56, #12A37B)",
                        color: "white",
                        fontWeight: 600,
                      }}
                    >
                      <FileText size={15} />
                      Open full report
                    </Link>
                    {uploadResult.paymentRequired && uploadResult.transaction && (
                      <button
                        type="button"
                        onClick={handleCheckPayment}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5"
                        style={{
                          background: "rgba(18,163,123,0.12)",
                          border: "1px solid rgba(18,163,123,0.2)",
                          color: "#12A37B",
                          cursor: "pointer",
                        }}
                      >
                        <CreditCard size={15} />
                        Check payment
                      </button>
                    )}
                    {verificationInProgress && (
                      <span
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5"
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          color: "rgba(176,196,222,0.8)",
                          fontSize: "13px",
                        }}
                      >
                        <Loader2 size={15} className="animate-spin" color="#12A37B" />
                        Verification in progress
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={resetForNewVerification}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5"
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(176,196,222,0.85)",
                        cursor: "pointer",
                      }}
                    >
                      <Upload size={15} />
                      Verify another
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}

            {workspaceError && (
              <div
                className="rounded-2xl p-4"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.16)",
                }}
              >
                <p style={{ color: "rgba(255,255,255,0.85)", margin: 0 }}>{workspaceError}</p>
              </div>
            )}
          </div>

          {/* RIGHT: workspace info */}
          <div className="space-y-4">
            {/* Plan / user info */}
            <div
              className="rounded-3xl p-5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "10px",
                    color: "rgba(176,196,222,0.4)",
                    letterSpacing: "0.08em",
                  }}
                >
                  YOUR ACCOUNT
                </div>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "10px",
                    color: plan === "PRO" ? "#12A37B" : plan === "STARTER" ? "#3B8BD4" : "#F59E0B",
                    letterSpacing: "0.08em",
                    fontWeight: 600,
                  }}
                >
                  {plan}
                </span>
              </div>
              <div style={{ color: "#F0F6FF", fontWeight: 600, marginBottom: "12px" }}>{user?.name}</div>

              <div className="space-y-2.5 text-sm" style={{ color: "rgba(176,196,222,0.72)" }}>
                <div className="flex items-center justify-between">
                  <span>Scans remaining</span>
                  <span style={{ color: "#F0F6FF" }}>{usage ? usage.monthlyRemaining : "—"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Monthly reset</span>
                  <span style={{ color: "#F0F6FF", fontSize: "12px" }}>
                    {usage?.resetAt ? formatFriendlyDate(usage.resetAt) : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{showWallet ? "Wallet" : "Per-scan price"}</span>
                  <span style={{ color: "#F0F6FF" }}>
                    {showWallet
                      ? wallet
                        ? formatCurrency(wallet.balance, wallet.currency)
                        : "—"
                      : "₦500"}
                  </span>
                </div>
              </div>

              {showWallet && (
                <Link
                  to="/wallet"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 mt-4 no-underline"
                  style={{
                    background: "rgba(18,163,123,0.08)",
                    border: "1px solid rgba(18,163,123,0.18)",
                    color: "#12A37B",
                    fontSize: "13px",
                  }}
                >
                  <Wallet size={14} />
                  Manage wallet
                </Link>
              )}
              {!showWallet && (
                <Link
                  to="/pricing"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 mt-4 no-underline"
                  style={{
                    background: "rgba(245,158,11,0.08)",
                    border: "1px solid rgba(245,158,11,0.18)",
                    color: "#F59E0B",
                    fontSize: "13px",
                  }}
                >
                  <Sparkles size={14} />
                  Upgrade for wallet
                </Link>
              )}
            </div>

            {/* Recent scans */}
            <div
              className="rounded-3xl p-5"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "10px",
                    color: "rgba(176,196,222,0.4)",
                    letterSpacing: "0.08em",
                  }}
                >
                  RECENT SCANS
                </div>
                <button
                  type="button"
                  onClick={() => void loadWorkspace()}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(176,196,222,0.5)",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                >
                  <RefreshCw size={13} />
                </button>
              </div>

              <div className="space-y-2">
                {recentScans.length === 0 ? (
                  <div
                    className="rounded-xl p-4 text-center text-sm"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px dashed rgba(255,255,255,0.06)",
                      color: "rgba(176,196,222,0.55)",
                    }}
                  >
                    No scans yet. Upload one above.
                  </div>
                ) : (
                  recentScans.map((scan) => {
                    const tone =
                      scan.verificationStatus === "VERIFIED"
                        ? "#12A37B"
                        : scan.verificationStatus === "FLAGGED" || scan.verificationStatus === "FAILED"
                          ? "#EF4444"
                          : "#F59E0B";
                    return (
                      <Link
                        key={scan.id}
                        to={`/results/${scan.id}`}
                        className="block no-underline rounded-xl p-3 transition-transform hover:-translate-y-0.5"
                        style={{
                          background: "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.06)",
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div
                              style={{
                                color: "#F0F6FF",
                                fontSize: "12.5px",
                                fontWeight: 500,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {scan.fileName}
                            </div>
                            <div style={{ color: "rgba(176,196,222,0.5)", fontSize: "10.5px", marginTop: "2px" }}>
                              {new Date(scan.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          <div
                            style={{
                              color: tone,
                              fontSize: "10px",
                              fontWeight: 600,
                              letterSpacing: "0.04em",
                            }}
                          >
                            {scanLabel(scan.verificationStatus)}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>

              {recentScans.length > 0 && (
                <Link
                  to="/dashboard"
                  className="block text-center mt-3 no-underline"
                  style={{
                    color: "#12A37B",
                    fontSize: "12px",
                    fontWeight: 500,
                  }}
                >
                  View all scans →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={paymentModalOpen}
        checkoutUrl={checkoutResult ? extractCheckoutUrl(checkoutResult.checkout) : null}
        transactionRef={
          checkoutResult?.transaction?.reference ?? uploadResult?.transaction?.reference ?? null
        }
        amount={
          checkoutResult?.transaction
            ? Number(checkoutResult.transaction.amount)
            : uploadResult?.transaction
              ? Number(uploadResult.transaction.amount)
              : undefined
        }
        type={paymentModalType}
        onClose={() => setPaymentModalOpen(false)}
        onVerify={async (ref) => {
          try {
            const result = await api.verifyPayment(ref);
            return result.processed === true;
          } catch {
            return false;
          }
        }}
        onSuccess={() => {
          const fileToSubmit = pendingVerificationFile;
          setPendingVerificationFile(null);
          setSelectedFile(null);
          setUploadResult(null);
          setCheckoutResult(null);
          setPaymentModalOpen(false);

          if (fileToSubmit) {
            setSubmitting(true);
            api
              .submitScan(fileToSubmit)
              .then(async (submission) => {
                setUploadResult(submission);
                toast.success("Payment confirmed. Scan submitted.");
                await loadWorkspace();
              })
              .catch((error) => {
                toast.error(
                  error instanceof Error
                    ? error.message
                    : "Payment succeeded but scan submission failed.",
                );
              })
              .finally(() => setSubmitting(false));
            return;
          }

          void loadWorkspace();
        }}
      />
    </div>
  );
}

function VerificationProgressPanel() {
  const checkpoints = [
    "Reading document structure",
    "Cross-checking registry data",
    "Running forgery analysis",
  ];

  return (
    <div
      className="rounded-3xl p-5 md:p-6 overflow-hidden relative"
      style={{
        background: "linear-gradient(135deg, rgba(18,163,123,0.08), rgba(255,255,255,0.03))",
        border: "1px solid rgba(18,163,123,0.18)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.7 }}>
        <motion.div
          animate={{ x: ["-15%", "115%"] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 top-0 h-full w-1/3"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(18,163,123,0.18), transparent)",
            filter: "blur(10px)",
          }}
        />
      </div>

      <div className="relative grid gap-5 md:grid-cols-[180px_1fr] items-center">
        <div className="flex justify-center md:justify-start">
          <div className="relative flex items-center justify-center" style={{ width: 170, height: 170 }}>
            <motion.div
              animate={{ scale: [1, 1.06, 1], opacity: [0.55, 0.9, 0.55] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full"
              style={{ background: "radial-gradient(circle, rgba(18,163,123,0.22), transparent 68%)" }}
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
              className="absolute inset-3 rounded-full"
              style={{
                border: "1px solid rgba(18,163,123,0.18)",
                borderTopColor: "rgba(18,163,123,0.85)",
                borderRightColor: "rgba(18,163,123,0.42)",
              }}
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className="absolute inset-8 rounded-full"
              style={{ border: "1px dashed rgba(176,196,222,0.16)" }}
            />
            <div className="relative text-center px-4">
              <Loader2 className="mx-auto mb-3 animate-spin" size={26} color="#12A37B" />
              <div style={{ color: "#F0F6FF", fontSize: "14px", fontWeight: 600, marginBottom: "2px" }}>
                Verifying
              </div>
              <div style={{ color: "rgba(176,196,222,0.6)", fontSize: "11px", lineHeight: 1.4 }}>
                Please keep this tab open while the analysis completes.
              </div>
            </div>
          </div>
        </div>

        <div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "10px",
              color: "rgba(176,196,222,0.4)",
              letterSpacing: "0.08em",
            }}
          >
            ANALYSIS IN PROGRESS
          </div>
          <h3 style={{ color: "#F0F6FF", fontSize: "1.15rem", marginTop: "4px", marginBottom: "8px" }}>
            We’re preparing the final report
          </h3>
          <p style={{ color: "rgba(176,196,222,0.7)", fontSize: "13px", lineHeight: 1.7, margin: 0 }}>
            The system is extracting text, validating document signals, and comparing the submission
            against known registry patterns.
          </p>

          <div className="mt-5 space-y-3">
            {checkpoints.map((checkpoint, index) => (
              <div
                key={checkpoint}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <motion.span
                  animate={{ opacity: [0.35, 1, 0.35] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.2 }}
                  className="flex h-2.5 w-2.5 rounded-full"
                  style={{ background: index === 1 ? "#12A37B" : index === 2 ? "#3B8BD4" : "#F59E0B" }}
                />
                <span style={{ color: "#F0F6FF", fontSize: "12.5px" }}>{checkpoint}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              ["OCR", "running"],
              ["Registry", "checking"],
              ["Score", "pending"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl px-3 py-2.5 text-center"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "9px",
                    color: "rgba(176,196,222,0.45)",
                    letterSpacing: "0.08em",
                    marginBottom: "3px",
                  }}
                >
                  {label}
                </div>
                <div style={{ color: "#F0F6FF", fontSize: "12px", fontWeight: 600 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- subcomponents ----------

function Stepper({ current }: { current: number }) {
  const steps = ["Upload", "Pay", "Analyze", "Done"];
  return (
    <div className="flex items-center gap-2 mt-5 max-w-md">
      {steps.map((step, i) => {
        const isActive = i === current;
        const isComplete = i < current;
        const color = isComplete ? "#12A37B" : isActive ? "#F0F6FF" : "rgba(176,196,222,0.4)";
        return (
          <div key={step} className="flex items-center gap-2 flex-1">
            <div
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: "22px",
                height: "22px",
                background: isComplete
                  ? "#12A37B"
                  : isActive
                    ? "rgba(18,163,123,0.18)"
                    : "rgba(255,255,255,0.04)",
                border: isActive
                  ? "1px solid rgba(18,163,123,0.4)"
                  : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {isComplete ? (
                <Check size={11} color="white" strokeWidth={3} />
              ) : (
                <span
                  style={{
                    color,
                    fontSize: "10px",
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                >
                  {i + 1}
                </span>
              )}
            </div>
            <span
              style={{
                color,
                fontSize: "11px",
                fontWeight: isActive ? 600 : 500,
                whiteSpace: "nowrap",
              }}
            >
              {step}
            </span>
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-px"
                style={{ background: isComplete ? "#12A37B" : "rgba(255,255,255,0.06)" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}