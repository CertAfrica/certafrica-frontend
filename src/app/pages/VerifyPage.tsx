import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronRight,
  Clipboard,
  CreditCard,
  FileText,
  Image as ImageIcon,
  Loader2,
  LogIn,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
  UserPlus,
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

// ---------------- constants ----------------

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const ACCEPTED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png"];
const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const POLL_INTERVAL_MS = 4000;

// ---------------- helpers ----------------

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
  if (scan.status === "PROCESSING" || scan.verificationStatus === "PROCESSING") return 52;
  if (scan.verificationStatus === "VERIFIED") return 91;
  if (scan.verificationStatus === "INCONCLUSIVE") return 66;
  if (scan.verificationStatus === "FLAGGED") return 34;
  if (scan.verificationStatus === "FAILED") return 22;
  return 58;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAcceptedFile(file: File): { ok: boolean; reason?: string } {
  const lowerName = file.name.toLowerCase();
  const extOk = ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
  const typeOk = ACCEPTED_TYPES.includes(file.type) || file.type === "";
  if (!extOk && !typeOk) {
    return { ok: false, reason: "Only PDF, JPG, and PNG files are accepted." };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, reason: `File is ${formatFileSize(file.size)}. The limit is ${MAX_FILE_SIZE_MB}MB.` };
  }
  if (file.size === 0) {
    return { ok: false, reason: "This file is empty." };
  }
  return { ok: true };
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

function isTerminal(scan: Scan) {
  return (
    scan.verificationStatus === "VERIFIED" ||
    scan.verificationStatus === "FLAGGED" ||
    scan.verificationStatus === "FAILED" ||
    scan.verificationStatus === "INCONCLUSIVE"
  );
}

// ---------------- main component ----------------

export function VerifyPage() {
  const { status, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
  const [analysisStartedAt, setAnalysisStartedAt] = useState<number | null>(null);

  // Build image preview URL when a new file is selected; revoke when it changes.
  useEffect(() => {
    if (selectedFile && isImageFile(selectedFile)) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [selectedFile]);

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

  // Redirect to original destination after auth, but only once.
  const redirectedRef = useRef(false);
  useEffect(() => {
    if (redirectedRef.current) return;
    const from = location.state?.from?.pathname;
    if (isAuthenticated && from && from !== "/verify") {
      redirectedRef.current = true;
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, location.state, navigate]);

  // Paste-from-clipboard support for screenshots.
  useEffect(() => {
    if (!isAuthenticated || uploadResult) return;
    const handler = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) {
            handleFileSelect(file);
            event.preventDefault();
            return;
          }
        }
      }
    };
    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, uploadResult]);

  // Poll scan status while verification is in progress.
  const verificationInProgress = useMemo(() => {
    if (!uploadResult) return false;
    const s = uploadResult.scan;
    return (
      s.status === "PROCESSING" ||
      s.verificationStatus === "PROCESSING" ||
      (s.paymentStatus === "SUCCESS" && !isTerminal(s))
    );
  }, [uploadResult]);

  useEffect(() => {
    if (!verificationInProgress || !uploadResult) return;
    if (analysisStartedAt === null) setAnalysisStartedAt(Date.now());

    const id = uploadResult.scan.id;
    const timer = setInterval(async () => {
      try {
        const latest = await api.getScan(id);
        setUploadResult((prev) => (prev ? { ...prev, scan: latest } : prev));
        if (isTerminal(latest)) {
          clearInterval(timer);
          void loadWorkspace();
        }
      } catch {
        // Silent failure; next tick will retry.
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [verificationInProgress, uploadResult?.scan.id, loadWorkspace]);

  // Reset the elapsed-time clock when the result changes.
  useEffect(() => {
    if (!verificationInProgress) setAnalysisStartedAt(null);
  }, [verificationInProgress]);

  const plan = user?.plan ?? "FREE";
  const walletBalance = wallet ? Number(wallet.balance) : 0;
  const showWallet = plan !== "FREE";
  const monthlyUsed = usage ? Math.max(0, usage.monthlyLimit - usage.monthlyRemaining) : 0;
  const monthlyTotal = usage?.monthlyLimit ?? 0;
  const usagePercent = monthlyTotal > 0 ? Math.min(100, Math.round((monthlyUsed / monthlyTotal) * 100)) : 0;

  const verifyBlockReason =
    plan === "FREE" && usage?.monthlyRemaining === 0
      ? "Free scans exhausted. Each scan now costs ₦500."
      : plan === "STARTER" && usage?.monthlyRemaining === 0 && walletBalance <= 0
        ? "Monthly scans exhausted and wallet empty. Top up to continue."
        : null;

  const upcomingPrice =
    verifyBlockReason
      ? plan === "FREE"
        ? 500
        : 400
      : usage?.monthlyRemaining && usage.monthlyRemaining > 0
        ? 0
        : plan === "FREE"
          ? 500
          : 400;

  const currentStep = (() => {
    if (!uploadResult) return 0;
    const s = uploadResult.scan;
    if (isTerminal(s)) return 3;
    if (uploadResult.paymentRequired && s.paymentStatus !== "SUCCESS") return 1;
    return 2;
  })();

  // ---------------- file handling ----------------

  const handleFileSelect = (file: File | null | undefined) => {
    if (!file) return;
    const validation = isAcceptedFile(file);
    if (!validation.ok) {
      toast.error(validation.reason ?? "That file can't be used.");
      return;
    }
    setSelectedFile(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ---------------- submission ----------------

  const handleVerification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      toast.error("Please choose a certificate file first.");
      return;
    }

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
        if (checkoutUrl) window.open(checkoutUrl, "_blank", "width=900,height=700");
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
        if (checkoutUrl) window.open(checkoutUrl, "_blank", "width=900,height=700");
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
        const latest = await api.getScan(uploadResult.scan.id);
        setUploadResult((prev) => (prev ? { ...prev, scan: latest } : prev));
        await loadWorkspace();
      } else {
        toast.message(
          result.paymentStatus ? `Payment ${result.paymentStatus.toLowerCase()}.` : "Payment still processing.",
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to verify payment.");
    }
  };

  const reopenCheckout = () => {
    const url = checkoutResult ? extractCheckoutUrl(checkoutResult.checkout) : null;
    if (url) {
      window.open(url, "_blank", "width=900,height=700");
      setPaymentModalOpen(true);
    } else {
      toast.message("Checkout link is no longer available. Try checking payment status instead.");
    }
  };

  const resetForNewVerification = () => {
    setSelectedFile(null);
    setUploadResult(null);
    setCheckoutResult(null);
    setAnalysisStartedAt(null);
  };

  // ---------------- render gates ----------------

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

  if (!isAuthenticated) {
    return <AuthGate fromPath={location.pathname} />;
  }

  // ---------------- main render ----------------

  return (
    <div className="min-h-screen pt-16 px-6 md:px-10 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header + stepper */}
        <div>
          <div
            className="flex items-center gap-2 mb-2 text-xs"
            style={{ color: "rgba(176,196,222,0.45)", letterSpacing: "0.08em" }}
          >
            <Link to="/" className="no-underline hover:text-white" style={{ color: "inherit" }}>
              Home
            </Link>
            <ChevronRight size={10} />
            <span style={{ color: "#12A37B" }}>Verify</span>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
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
            </div>
            <PriceBadge plan={plan} usage={usage} walletBalance={walletBalance} upcomingPrice={upcomingPrice} />
          </div>

          <Stepper current={currentStep} />
        </div>

        {/* Block reason banner */}
        {verifyBlockReason && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 flex items-start gap-3"
            style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.22)" }}
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
            <AnimatePresence mode="wait" initial={false}>
              {!uploadResult ? (
                <motion.form
                  key="upload"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  onSubmit={handleVerification}
                  className="rounded-3xl p-6 md:p-7"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <UploadHeader />
                  <DropZone
                    inputRef={fileInputRef}
                    selectedFile={selectedFile}
                    previewUrl={previewUrl}
                    dropActive={dropActive}
                    onDragActive={setDropActive}
                    onFileSelect={handleFileSelect}
                    onClear={clearFile}
                  />
                  <UploadFooter
                    submitting={submitting}
                    disabled={!selectedFile}
                    upcomingPrice={upcomingPrice}
                    blockReason={verifyBlockReason}
                  />
                </motion.form>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="rounded-3xl p-6 md:p-7"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <SubmissionCard
                    uploadResult={uploadResult}
                    verificationInProgress={verificationInProgress}
                    analysisStartedAt={analysisStartedAt}
                    onCheckPayment={handleCheckPayment}
                    onReopenCheckout={reopenCheckout}
                    onReset={resetForNewVerification}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {workspaceError && (
              <div
                className="rounded-2xl p-4"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.16)" }}
              >
                <p style={{ color: "rgba(255,255,255,0.85)", margin: 0 }}>{workspaceError}</p>
              </div>
            )}
          </div>

          {/* RIGHT: workspace info */}
          <div className="space-y-4">
            <PlanCard
              plan={plan}
              user={user}
              usage={usage}
              monthlyUsed={monthlyUsed}
              monthlyTotal={monthlyTotal}
              usagePercent={usagePercent}
              showWallet={showWallet}
              wallet={wallet}
            />
            <RecentScansCard scans={recentScans} onRefresh={() => void loadWorkspace()} />
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={paymentModalOpen}
        checkoutUrl={checkoutResult ? extractCheckoutUrl(checkoutResult.checkout) : null}
        transactionRef={checkoutResult?.transaction?.reference ?? uploadResult?.transaction?.reference ?? null}
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
                  error instanceof Error ? error.message : "Payment succeeded but scan submission failed.",
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

// ---------------- auth gate ----------------

function AuthGate({ fromPath }: { fromPath: string }) {
  return (
    <div className="min-h-screen pt-24 px-6 md:px-10 py-12 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full rounded-3xl p-8"
        style={{
          background: "linear-gradient(135deg, rgba(18,163,123,0.06), rgba(255,255,255,0.03))",
          border: "1px solid rgba(18,163,123,0.18)",
        }}
      >
        <div
          className="flex items-center justify-center rounded-2xl mb-5 mx-auto"
          style={{
            width: 56,
            height: 56,
            background: "rgba(18,163,123,0.1)",
            border: "1px solid rgba(18,163,123,0.18)",
          }}
        >
          <ShieldCheck size={24} color="#12A37B" />
        </div>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "10px",
            color: "#12A37B",
            letterSpacing: "0.08em",
            textAlign: "center",
            marginBottom: "8px",
          }}
        >
          SIGN IN REQUIRED
        </div>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(1.5rem, 3vw, 1.9rem)",
            color: "#F0F6FF",
            textAlign: "center",
            lineHeight: 1.2,
            marginBottom: "10px",
          }}
        >
          Sign in to verify certificates
        </h1>
        <p
          style={{
            color: "rgba(176,196,222,0.7)",
            fontSize: "13.5px",
            lineHeight: 1.7,
            textAlign: "center",
            marginBottom: "24px",
          }}
        >
          Your scans, reports, and wallet stay tied to your account. Free accounts get 3 verifications a
          month.
        </p>
        <div className="space-y-2.5">
          <Link
            to="/login"
            state={{ from: { pathname: fromPath } }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 no-underline"
            style={{
              background: "linear-gradient(135deg, #0F6E56, #12A37B)",
              color: "white",
              fontWeight: 600,
            }}
          >
            <LogIn size={15} />
            Sign in
          </Link>
          <Link
            to="/signup"
            state={{ from: { pathname: fromPath } }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 no-underline"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#F0F6FF",
              fontWeight: 500,
            }}
          >
            <UserPlus size={15} />
            Create a free account
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// ---------------- price badge ----------------

function PriceBadge({
  plan,
  usage,
  walletBalance,
  upcomingPrice,
}: {
  plan: string;
  usage: ScanUsageSummary | null;
  walletBalance: number;
  upcomingPrice: number;
}) {
  const remaining = usage?.monthlyRemaining ?? 0;
  const isFree = remaining > 0;
  const useWallet = plan !== "FREE" && remaining === 0 && walletBalance >= upcomingPrice;

  let label = "Next scan";
  let value = "";
  let color = "#12A37B";

  if (isFree) {
    value = "Free";
  } else if (useWallet) {
    value = formatCurrency(upcomingPrice);
    label = "From wallet";
    color = "#3B8BD4";
  } else {
    value = formatCurrency(upcomingPrice);
    label = "Pay per scan";
    color = "#F59E0B";
  }

  return (
    <div
      className="rounded-2xl px-4 py-2.5"
      style={{
        background: `${color}14`,
        border: `1px solid ${color}33`,
      }}
    >
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "10px",
          color,
          letterSpacing: "0.08em",
          fontWeight: 600,
          marginBottom: "2px",
        }}
      >
        {label.toUpperCase()}
      </div>
      <div style={{ color: "#F0F6FF", fontSize: "16px", fontWeight: 600 }}>{value}</div>
    </div>
  );
}

// ---------------- upload section ----------------

function UploadHeader() {
  return (
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
      <div
        className="hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <Clipboard size={11} color="rgba(176,196,222,0.55)" />
        <span style={{ color: "rgba(176,196,222,0.6)", fontSize: "10.5px" }}>Paste a screenshot too</span>
      </div>
    </div>
  );
}

function DropZone({
  inputRef,
  selectedFile,
  previewUrl,
  dropActive,
  onDragActive,
  onFileSelect,
  onClear,
}: {
  inputRef: React.RefObject<HTMLInputElement | null>;
  selectedFile: File | null;
  previewUrl: string | null;
  dropActive: boolean;
  onDragActive: (active: boolean) => void;
  onFileSelect: (file: File | null | undefined) => void;
  onClear: () => void;
}) {
  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        onDragActive(true);
      }}
      onDragLeave={() => onDragActive(false)}
      onDrop={(event) => {
        event.preventDefault();
        onDragActive(false);
        onFileSelect(event.dataTransfer.files?.[0]);
      }}
      onClick={() => {
        if (!selectedFile) inputRef.current?.click();
      }}
      className="rounded-2xl p-6 md:p-7 transition-all"
      style={{
        background: dropActive ? "rgba(18,163,123,0.08)" : "rgba(255,255,255,0.02)",
        border: `1.5px dashed ${dropActive ? "rgba(18,163,123,0.55)" : "rgba(255,255,255,0.1)"}`,
        cursor: selectedFile ? "default" : "pointer",
        minHeight: selectedFile ? "auto" : "260px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        hidden
        onChange={(event) => onFileSelect(event.target.files?.[0])}
      />

      {selectedFile ? (
        <SelectedFileCard
          file={selectedFile}
          previewUrl={previewUrl}
          onChange={() => inputRef.current?.click()}
          onClear={onClear}
        />
      ) : (
        <EmptyDropPrompt active={dropActive} />
      )}
    </div>
  );
}

function EmptyDropPrompt({ active }: { active: boolean }) {
  return (
    <>
      <motion.div
        animate={active ? { scale: 1.08 } : { scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="flex items-center justify-center rounded-2xl mb-4"
        style={{
          width: 56,
          height: 56,
          background: "rgba(18,163,123,0.1)",
          border: "1px solid rgba(18,163,123,0.18)",
        }}
      >
        <Upload size={24} color="#12A37B" />
      </motion.div>
      <div style={{ color: "#F0F6FF", fontSize: "1.05rem", marginBottom: "6px" }}>
        {active ? "Drop to upload" : "Drop a certificate here, or click to browse"}
      </div>
      <p
        style={{
          color: "rgba(176,196,222,0.55)",
          fontSize: "12px",
          lineHeight: 1.5,
          maxWidth: "42ch",
          margin: 0,
        }}
      >
        PDF, JPG, or PNG up to {MAX_FILE_SIZE_MB}MB. We classify the document type, run forgery detection,
        and cross-check the registry.
      </p>
    </>
  );
}

function SelectedFileCard({
  file,
  previewUrl,
  onChange,
  onClear,
}: {
  file: File;
  previewUrl: string | null;
  onChange: () => void;
  onClear: () => void;
}) {
  return (
    <div className="w-full" onClick={(e) => e.stopPropagation()}>
      <div
        className="flex items-center gap-3 rounded-2xl p-3 mb-3 text-left"
        style={{
          background: "rgba(18,163,123,0.06)",
          border: "1px solid rgba(18,163,123,0.2)",
        }}
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Selected document preview"
            style={{
              width: 56,
              height: 56,
              objectFit: "cover",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.08)",
              flexShrink: 0,
            }}
          />
        ) : (
          <div
            className="rounded-xl flex items-center justify-center"
            style={{ width: 56, height: 56, background: "rgba(18,163,123,0.12)", flexShrink: 0 }}
          >
            {file.type === "application/pdf" ? (
              <FileText size={22} color="#12A37B" />
            ) : (
              <ImageIcon size={22} color="#12A37B" />
            )}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div
            style={{
              color: "#F0F6FF",
              fontSize: "13.5px",
              fontWeight: 600,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {file.name}
          </div>
          <div style={{ color: "rgba(176,196,222,0.65)", fontSize: "11.5px", marginTop: "2px" }}>
            {formatFileSize(file.size)} · {file.type || "Unknown type"}
          </div>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label="Remove file"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            padding: 6,
            color: "rgba(176,196,222,0.7)",
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <X size={14} />
        </button>
      </div>
      <button
        type="button"
        onClick={onChange}
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
  );
}

function UploadFooter({
  submitting,
  disabled,
  upcomingPrice,
  blockReason,
}: {
  submitting: boolean;
  disabled: boolean;
  upcomingPrice: number;
  blockReason: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
      <div
        className="flex items-center gap-2"
        style={{ color: "rgba(176,196,222,0.62)", fontSize: "12px" }}
      >
        <ShieldCheck size={13} color="#12A37B" />
        <span>Encrypted in transit and at rest</span>
      </div>
      <button
        type="submit"
        disabled={submitting || disabled}
        className="inline-flex items-center gap-2 rounded-xl px-5 py-3 transition-opacity disabled:opacity-60"
        style={{
          background: "linear-gradient(135deg, #0F6E56, #12A37B)",
          color: "white",
          fontWeight: 600,
        }}
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {submitting
          ? "Submitting…"
          : blockReason
            ? `Top up ${formatCurrency(upcomingPrice)} and verify`
            : upcomingPrice > 0
              ? `Verify for ${formatCurrency(upcomingPrice)}`
              : "Start verification"}
        {!submitting && <ArrowRight size={14} />}
      </button>
    </div>
  );
}

// ---------------- submission card ----------------

function SubmissionCard({
  uploadResult,
  verificationInProgress,
  analysisStartedAt,
  onCheckPayment,
  onReopenCheckout,
  onReset,
}: {
  uploadResult: ScanSubmissionResponse;
  verificationInProgress: boolean;
  analysisStartedAt: number | null;
  onCheckPayment: () => void;
  onReopenCheckout: () => void;
  onReset: () => void;
}) {
  const s = uploadResult.scan;
  const terminal = isTerminal(s);
  const awaitingPayment = uploadResult.paymentRequired && s.paymentStatus !== "SUCCESS";

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div className="min-w-0">
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
          <h2
            style={{
              color: "#F0F6FF",
              fontSize: "1.1rem",
              marginTop: "4px",
              wordBreak: "break-word",
            }}
          >
            {s.fileName}
          </h2>
          <p style={{ color: "rgba(176,196,222,0.6)", fontSize: "12px", margin: "2px 0 0" }}>
            Scan {s.scanCode}
          </p>
        </div>
        <div
          className="rounded-2xl px-4 py-2.5 text-right"
          style={{
            background: awaitingPayment ? "rgba(245,158,11,0.08)" : "rgba(18,163,123,0.08)",
            border: `1px solid ${awaitingPayment ? "rgba(245,158,11,0.2)" : "rgba(18,163,123,0.2)"}`,
          }}
        >
          <div
            style={{
              fontSize: "10px",
              color: awaitingPayment ? "#F59E0B" : "#12A37B",
              letterSpacing: "0.08em",
              fontWeight: 600,
            }}
          >
            {awaitingPayment ? "PAYMENT REQUIRED" : terminal ? "COMPLETED" : "QUEUED"}
          </div>
          <div style={{ color: "#F0F6FF", marginTop: "2px", fontWeight: 600 }}>
            {formatCurrency(uploadResult.pricing.price, uploadResult.pricing.currency)}
          </div>
        </div>
      </div>

      {verificationInProgress ? (
        <VerificationProgressPanel analysisStartedAt={analysisStartedAt} />
      ) : (
        <div className="grid md:grid-cols-[180px_1fr] gap-6 items-center">
          <ScoreRing score={scoreForScan(s)} size={160} animate />
          <div className="space-y-2">
            {[
              ["Status", scanLabel(s.status)],
              ["Verification", scanLabel(s.verificationStatus)],
              ["Payment", scanLabel(s.paymentStatus)],
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
                <span style={{ color: "#F0F6FF", fontSize: "12.5px", fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        className="flex flex-wrap gap-2 mt-6 pt-5"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <Link
          to={`/results/${s.id}`}
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

        {awaitingPayment && uploadResult.transaction && (
          <>
            <button
              type="button"
              onClick={onReopenCheckout}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5"
              style={{
                background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.1))",
                border: "1px solid rgba(245,158,11,0.3)",
                color: "#F59E0B",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              <CreditCard size={15} />
              Open checkout
            </button>
            <button
              type="button"
              onClick={onCheckPayment}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(176,196,222,0.85)",
                cursor: "pointer",
              }}
            >
              <RefreshCw size={15} />
              Check payment
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onReset}
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
    </>
  );
}

// ---------------- progress panel ----------------

function VerificationProgressPanel({ analysisStartedAt }: { analysisStartedAt: number | null }) {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!analysisStartedAt) return;
    const tick = () => setElapsedSec(Math.floor((Date.now() - analysisStartedAt) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [analysisStartedAt]);

  const checkpoints = [
    { label: "Reading document structure", color: "#F59E0B" },
    { label: "Cross-checking registry data", color: "#12A37B" },
    { label: "Running forgery analysis", color: "#3B8BD4" },
  ];

  // Map elapsed time roughly to a checkpoint so the UI shows progress.
  const activeIndex = elapsedSec < 6 ? 0 : elapsedSec < 14 ? 1 : 2;

  return (
    <div
      className="rounded-2xl p-5 md:p-6 overflow-hidden relative"
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
              <Loader2 className="mx-auto mb-2 animate-spin" size={24} color="#12A37B" />
              <div style={{ color: "#F0F6FF", fontSize: "14px", fontWeight: 600 }}>Verifying</div>
              <div
                style={{
                  color: "rgba(176,196,222,0.7)",
                  fontSize: "11px",
                  marginTop: "4px",
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                {elapsedSec}s elapsed
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
            We're preparing the final report
          </h3>
          <p style={{ color: "rgba(176,196,222,0.7)", fontSize: "13px", lineHeight: 1.7, margin: 0 }}>
            Average analysis takes 15 to 25 seconds. You can leave this tab open or check back from the
            dashboard.
          </p>

          <div className="mt-5 space-y-2.5">
            {checkpoints.map((checkpoint, index) => {
              const done = index < activeIndex;
              const active = index === activeIndex;
              return (
                <div
                  key={checkpoint.label}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${active ? `${checkpoint.color}40` : "rgba(255,255,255,0.05)"}`,
                  }}
                >
                  {done ? (
                    <Check size={13} color="#12A37B" strokeWidth={3} />
                  ) : active ? (
                    <motion.span
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.4, repeat: Infinity }}
                      className="flex h-2.5 w-2.5 rounded-full"
                      style={{ background: checkpoint.color }}
                    />
                  ) : (
                    <span
                      className="flex h-2.5 w-2.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.1)" }}
                    />
                  )}
                  <span
                    style={{
                      color: done ? "rgba(176,196,222,0.55)" : "#F0F6FF",
                      fontSize: "12.5px",
                      textDecoration: done ? "line-through" : "none",
                    }}
                  >
                    {checkpoint.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------- workspace cards ----------------

function PlanCard({
  plan,
  user,
  usage,
  monthlyUsed,
  monthlyTotal,
  usagePercent,
  showWallet,
  wallet,
}: {
  plan: string;
  user: { name?: string } | null;
  usage: ScanUsageSummary | null;
  monthlyUsed: number;
  monthlyTotal: number;
  usagePercent: number;
  showWallet: boolean;
  wallet: WalletType | null;
}) {
  const planColor = plan === "PRO" ? "#12A37B" : plan === "STARTER" ? "#3B8BD4" : "#F59E0B";
  return (
    <div
      className="rounded-3xl p-5"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
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
            color: planColor,
            letterSpacing: "0.08em",
            fontWeight: 600,
          }}
        >
          {plan}
        </span>
      </div>
      <div style={{ color: "#F0F6FF", fontWeight: 600, marginBottom: "14px" }}>{user?.name}</div>

      {/* Usage bar */}
      {monthlyTotal > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span style={{ color: "rgba(176,196,222,0.7)", fontSize: "12px" }}>Monthly scans</span>
            <span
              style={{
                color: "#F0F6FF",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "11.5px",
                fontWeight: 600,
              }}
            >
              {monthlyUsed} / {monthlyTotal}
            </span>
          </div>
          <div
            style={{
              height: 6,
              borderRadius: 999,
              background: "rgba(255,255,255,0.05)",
              overflow: "hidden",
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${usagePercent}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                height: "100%",
                background:
                  usagePercent >= 90 ? "#EF4444" : usagePercent >= 70 ? "#F59E0B" : "#12A37B",
              }}
            />
          </div>
          <div style={{ color: "rgba(176,196,222,0.5)", fontSize: "10.5px", marginTop: "5px" }}>
            Resets {usage?.resetAt ? formatFriendlyDate(usage.resetAt) : "next month"}
          </div>
        </div>
      )}

      <div className="space-y-2 text-sm" style={{ color: "rgba(176,196,222,0.72)" }}>
        <div className="flex items-center justify-between">
          <span>{showWallet ? "Wallet" : "Per-scan price"}</span>
          <span style={{ color: "#F0F6FF" }}>
            {showWallet ? (wallet ? formatCurrency(wallet.balance, wallet.currency) : "—") : "₦500"}
          </span>
        </div>
      </div>

      {showWallet ? (
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
      ) : (
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
  );
}

function RecentScansCard({ scans, onRefresh }: { scans: Scan[]; onRefresh: () => void }) {
  return (
    <div
      className="rounded-3xl p-5"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
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
          onClick={onRefresh}
          aria-label="Refresh recent scans"
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(176,196,222,0.5)",
            cursor: "pointer",
            padding: 4,
          }}
        >
          <RefreshCw size={13} />
        </button>
      </div>

      <div className="space-y-2">
        {scans.length === 0 ? (
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
          scans.map((scan) => {
            const tone =
              scan.verificationStatus === "VERIFIED"
                ? "#12A37B"
                : scan.verificationStatus === "FLAGGED" || scan.verificationStatus === "FAILED"
                  ? "#EF4444"
                  : "#F59E0B";
            const score = scoreForScan(scan);
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
                <div className="flex items-center gap-3">
                  <div
                    className="flex-shrink-0 flex items-center justify-center rounded-lg"
                    style={{
                      width: 36,
                      height: 36,
                      background: `${tone}1a`,
                      border: `1px solid ${tone}33`,
                      color: tone,
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "11.5px",
                      fontWeight: 700,
                    }}
                  >
                    {score}
                  </div>
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
                    <div
                      style={{
                        color: "rgba(176,196,222,0.5)",
                        fontSize: "10.5px",
                        marginTop: "2px",
                      }}
                    >
                      {new Date(scan.createdAt).toLocaleDateString()} · {scanLabel(scan.verificationStatus)}
                    </div>
                  </div>
                  <ChevronRight size={14} color="rgba(176,196,222,0.4)" className="flex-shrink-0" />
                </div>
              </Link>
            );
          })
        )}
      </div>

      {scans.length > 0 && (
        <Link
          to="/dashboard"
          className="block text-center mt-3 no-underline"
          style={{ color: "#12A37B", fontSize: "12px", fontWeight: 500 }}
        >
          View all scans →
        </Link>
      )}
    </div>
  );
}

// ---------------- stepper ----------------

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
            <motion.div
              animate={isActive ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ duration: 1.6, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
              className="flex items-center justify-center rounded-full flex-shrink-0"
              style={{
                width: 22,
                height: 22,
                background: isComplete
                  ? "#12A37B"
                  : isActive
                    ? "rgba(18,163,123,0.18)"
                    : "rgba(255,255,255,0.04)",
                border: isActive ? "1px solid rgba(18,163,123,0.4)" : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {isComplete ? (
                <Check size={11} color="white" strokeWidth={3} />
              ) : (
                <span
                  style={{ color, fontSize: "10px", fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  {i + 1}
                </span>
              )}
            </motion.div>
            <span style={{ color, fontSize: "11px", fontWeight: isActive ? 600 : 500, whiteSpace: "nowrap" }}>
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