import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "react-router";
import {
  AlertCircle,
  CreditCard,
  FileText,
  Loader2,
  LogIn,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Upload,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { ScoreRing } from "../components/ScoreRing";
import { PaymentModal } from "../components/PaymentModal";
import { useAuth } from "../context/AuthContext";
import { api, extractCheckoutUrl, type ApiError } from "../lib/api";
import type { PaymentCheckoutResponse, Scan, ScanSubmissionResponse, ScanUsageSummary, Wallet as WalletType } from "../lib/types";

function formatCurrency(value: string | number | undefined, currency = "NGN") {
  const amount = typeof value === "string" ? Number.parseFloat(value) : value ?? 0;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number.isFinite(amount) ? amount : 0);
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

export function VerifyPage() {
  const { status, user, isAuthenticated, login, signup } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const paymentPollRef = useRef<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dropActive, setDropActive] = useState(false);
  const [uploadResult, setUploadResult] = useState<ScanSubmissionResponse | null>(null);
  const [checkoutResult, setCheckoutResult] = useState<PaymentCheckoutResponse | null>(null);
  const [wallet, setWallet] = useState<WalletType | null>(null);
  const [usage, setUsage] = useState<ScanUsageSummary | null>(null);
  const [recentScans, setRecentScans] = useState<Scan[]>([]);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);
  const [workspaceError, setWorkspaceError] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [verifyingTransaction, setVerifyingTransaction] = useState(false);

  const loadWorkspace = useCallback(async () => {
    if (!isAuthenticated) return;
    const canAccessWallet = user?.plan !== "FREE";
    setLoadingWorkspace(true);
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
      setWorkspaceError(error instanceof Error ? error.message : "Unable to load the verification workspace.");
    } finally {
      setLoadingWorkspace(false);
    }
  }, [isAuthenticated, user?.plan]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadWorkspace();
    }
  }, [isAuthenticated, loadWorkspace]);

  useEffect(() => {
    const transactionRef = checkoutResult?.transaction?.reference;

    if (!paymentModalOpen || !transactionRef) {
      if (paymentPollRef.current !== null) {
        window.clearInterval(paymentPollRef.current);
        paymentPollRef.current = null;
      }
      setVerifyingTransaction(false);
      return;
    }

    let cancelled = false;

    const verifyPaymentNow = async () => {
      if (cancelled) return;
      setVerifyingTransaction(true);
      try {
        const result = await api.verifyPayment(transactionRef);
        if (cancelled) return;

        if (result.processed === true || result.alreadyProcessed === true) {
          if (paymentPollRef.current !== null) {
            window.clearInterval(paymentPollRef.current);
            paymentPollRef.current = null;
          }
          setVerifyingTransaction(false);
          toast.success("Payment verified and scan queued.");
          setPaymentModalOpen(false);
          setCheckoutResult(null);
          setSelectedFile(null);
          setUploadResult(null);
          await loadWorkspace();
        }
      } catch (error) {
        // Keep polling silently; the payment gateway may still be updating.
        if (!cancelled) {
          setVerifyingTransaction(false);
        }
      }
    };

    // Initial verification immediately
    void verifyPaymentNow();

    // Then set up polling every 10 seconds
    paymentPollRef.current = window.setInterval(() => {
      void verifyPaymentNow();
    }, 10000) as unknown as number;

    return () => {
      cancelled = true;
      if (paymentPollRef.current !== null) {
        window.clearInterval(paymentPollRef.current);
        paymentPollRef.current = null;
      }
      setVerifyingTransaction(false);
    };
  }, [checkoutResult?.transaction?.reference, paymentModalOpen, loadWorkspace]);

  // Authentication is handled on a dedicated `/auth` page.

  const handleVerification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      toast.error("Please choose a certificate file first.");
      return;
    }

    setSubmitting(true);
    const paymentPopup = window.open("about:blank", "certafrica-payment", "width=900,height=700");
    if (paymentPopup) {
      paymentPopup.document.write(
        "<html><body style='font-family:sans-serif;background:#08111E;color:#F0F6FF;display:flex;align-items:center;justify-content:center;height:100vh;margin:0'>Opening Squad checkout…</body></html>"
      );
      paymentPopup.document.close();
    }

    try {
      const submission = await api.submitScan(selectedFile);
      setUploadResult(submission);
      setCheckoutResult(null);
      if (submission.paymentRequired && submission.transaction) {
        toast.success("Certificate uploaded. Payment required to start verification.");

        const payment = await api.initializePayment({ type: "scan", scanId: submission.scan.id });
        setCheckoutResult(payment);
        const checkoutUrl = extractCheckoutUrl(payment.checkout);
        if (checkoutUrl) {
          if (paymentPopup) {
            paymentPopup.location.href = checkoutUrl;
            paymentPopup.focus();
          } else {
            window.open(checkoutUrl, "_blank", "width=900,height=700");
          }
        } else if (paymentPopup) {
          paymentPopup.close();
        }
        setPaymentModalOpen(true);
      } else if (paymentPopup) {
        toast.success("Certificate uploaded successfully. Verification queued.");
        paymentPopup.close();
      } else {
        toast.success("Certificate uploaded successfully. Verification queued.");
      }

      await loadWorkspace();
    } catch (error) {
      if (paymentPopup) {
        paymentPopup.close();
      }
      const message = error instanceof Error ? error.message : "Unable to submit your certificate.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckPayment = async () => {
    if (!uploadResult?.transaction?.reference) return;

    try {
      const result = await api.verifyPayment(uploadResult.transaction.reference);
      if (result.processed) {
        toast.success("Payment verified and scan queued.");
        await loadWorkspace();
      } else {
        toast.message(result.paymentStatus ? `Payment still ${result.paymentStatus}.` : "Payment still processing.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to verify payment right now.");
    }
  };

  const totalScans = recentScans.length;
  const queuedScans = useMemo(() => recentScans.filter((scan) => scan.status === "QUEUED" || scan.status === "PROCESSING").length, [recentScans]);
  const plan = user?.plan ?? "FREE";
  const showWallet = plan !== "FREE";
  const isPollingPayment = verifyingTransaction && paymentModalOpen;

  // Payment gate status
  const walletBalance = wallet ? Number(wallet.balance) : 0;
  const canVerify = true;
  const verifyBlockReason =
    plan === "FREE" && usage?.monthlyRemaining === 0
      ? "Free scans exhausted—pay ₦500 per scan"
      : plan === "STARTER" && usage?.monthlyRemaining === 0 && walletBalance <= 0
        ? "Free scans exhausted and wallet empty—top up to continue"
        : null;

  if (status === "loading") {
    return (
      <div className="min-h-[calc(100vh-64px)] pt-16 flex items-center justify-center px-6">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 animate-spin" size={28} color="#12A37B" />
          <p style={{ color: "rgba(176,196,222,0.7)" }}>Loading your secure workspace…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-26 px-6 md:px-10 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-3xl p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <h2 style={{ color: "#F0F6FF", fontSize: "1.6rem", marginBottom: 8 }}>Sign in to continue</h2>
            <p style={{ color: "rgba(176,196,222,0.7)", marginBottom: 16 }}>Authentication is required to upload certificates, access wallet features, and view verification results.</p>
            <div className="flex gap-3">
              <Link to="/auth" className="inline-flex items-center gap-2 rounded-xl px-4 py-3 no-underline" style={{ background: "linear-gradient(135deg, #0F6E56, #12A37B)", color: "white", fontWeight: 600 }}>
                <LogIn size={16} /> Sign in / Sign up
              </Link>
              <Link to="/pricing" className="inline-flex items-center gap-2 rounded-xl px-4 py-3 no-underline" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(176,196,222,0.9)" }}>
                View pricing
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 px-6 md:px-10 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs" style={{ color: "rgba(176,196,222,0.45)", letterSpacing: "0.08em" }}>
              <Link to="/" className="no-underline" style={{ color: "inherit" }}>Home</Link>
              <span>/</span>
              <span style={{ color: "#12A37B" }}>Verify</span>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 4vw, 2.6rem)", color: "#F0F6FF", lineHeight: 1.1, marginBottom: "6px" }}>
              Verification workspace
            </h1>
            <p style={{ color: "rgba(176,196,222,0.62)" }}>
              Upload a certificate, initialize payment when required, and monitor queued scans in real time.
            </p>
          </div>
          <button type="button" onClick={() => void loadWorkspace()} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(176,196,222,0.8)" }}>
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>

        <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Remaining scans", value: usage ? String(usage.monthlyRemaining) : "—", icon: Sparkles },
                { label: "Recent scans", value: String(totalScans), icon: FileText },
                { label: showWallet ? "Wallet balance" : "Pay per scan", value: showWallet ? (wallet ? formatCurrency(wallet.balance, wallet.currency) : "—") : "₦500", icon: Wallet },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center justify-between mb-4">
                    <item.icon size={16} color="#12A37B" />
                    <span style={{ fontSize: "9px", color: "rgba(176,196,222,0.35)", letterSpacing: "0.08em" }}>LIVE</span>
                  </div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.6rem", color: "#F0F6FF", marginBottom: "4px" }}>{item.value}</div>
                  <div style={{ color: "rgba(176,196,222,0.62)", fontSize: "12px" }}>{item.label}</div>
                </div>
              ))}
            </div>

            {plan === "FREE" && usage?.monthlyRemaining === 0 && (
              <div className="rounded-2xl p-4 text-sm" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.22)", color: "rgba(255,255,255,0.86)" }}>
                <span>Free scans are exhausted. Click Start verification to open payment for the next certificate.</span>
              </div>
            )}

            {plan === "STARTER" && usage?.monthlyRemaining === 0 && walletBalance <= 0 && (
              <div className="rounded-2xl p-4 text-sm" style={{ background: "rgba(59,139,212,0.12)", border: "1px solid rgba(59,139,212,0.22)", color: "rgba(255,255,255,0.86)" }}>
                <div className="flex items-center justify-between gap-2">
                  <span>Monthly free scans exhausted. Top up wallet to continue.</span>
                  <button
                    type="button"
                    onClick={() => {
                      const paymentPopup = window.open("about:blank", "certafrica-topup-starter", "width=900,height=700");
                      if (paymentPopup) {
                        paymentPopup.document.write(
                          "<html><body style='font-family:sans-serif;background:#08111E;color:#F0F6FF;display:flex;align-items:center;justify-content:center;height:100vh;margin:0'>Opening Squad checkout…</body></html>"
                        );
                        paymentPopup.document.close();
                      }

                      const amount = 5000;
                      toast.promise(
                        api.topupWallet(amount).then((checkout) => {
                          const url = extractCheckoutUrl(checkout.checkout);
                          if (url) {
                            if (paymentPopup) {
                              paymentPopup.location.href = url;
                              paymentPopup.focus();
                            } else {
                              window.open(url, "_blank", "noopener,noreferrer,width=900,height=700");
                            }
                          } else if (paymentPopup) {
                            paymentPopup.close();
                          }
                          return "Checkout opened";
                        }),
                        { success: "Wallet top-up checkout opened", error: "Top-up failed" }
                      );
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-500 whitespace-nowrap"
                    style={{ background: "rgba(59,139,212,0.16)", border: "1px solid rgba(59,139,212,0.3)", color: "#3B8BD4" }}
                  >
                    <Wallet size={12} className="inline mr-1" /> Top up ₦5,000
                  </button>
                </div>
              </div>
            )}

            {/* Plan-aware banner */}
            <div className="mb-4 rounded-lg p-3" style={{ background: user?.plan === "FREE" ? "rgba(59,139,212,0.06)" : "rgba(18,163,123,0.06)", border: "1px solid rgba(255,255,255,0.04)" }}>
              {user?.plan === "FREE" ? (
                <div style={{ color: "rgba(176,196,222,0.9)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ color: "#F0F6FF" }}>Free plan</strong>
                    <div style={{ fontSize: 13, color: "rgba(176,196,222,0.7)" }}>
                      {usage?.monthlyRemaining != null ? `You have ${usage.monthlyRemaining} free verifications left this month.` : "You have limited free verifications."}
                    </div>
                  </div>
                  <div>
                    <a href="/pricing" className="px-3 py-1 rounded-lg no-underline" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(176,196,222,0.9)" }}>Upgrade</a>
                  </div>
                </div>
              ) : user?.plan === "STARTER" ? (
                <div style={{ color: "rgba(176,196,222,0.9)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ color: "#F0F6FF" }}>Starter</strong>
                    <div style={{ fontSize: 13, color: "rgba(176,196,222,0.7)" }}>
                      {wallet ? `Wallet balance: ₦${wallet.balance.toLocaleString()}` : "Wallet access enabled."}
                    </div>
                  </div>
                  <div>
                    <a href="/wallet" className="px-3 py-1 rounded-lg no-underline" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #12A37B 100%)", color: "white" }}>Top up</a>
                  </div>
                </div>
              ) : (
                <div style={{ color: "rgba(176,196,222,0.9)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ color: "#F0F6FF" }}>{user?.plan ?? "PRO"}</strong>
                    <div style={{ fontSize: 13, color: "rgba(176,196,222,0.7)" }}>Unlimited verifications and priority processing.</div>
                  </div>
                  <div>
                    <a href="/billing" className="px-3 py-1 rounded-lg no-underline" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(176,196,222,0.9)" }}>Billing</a>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleVerification} className="rounded-3xl p-6 md:p-7" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.38)", letterSpacing: "0.08em" }}>DOCUMENT UPLOAD</div>
                  <h2 style={{ color: "#F0F6FF", fontSize: "1.15rem", marginTop: "4px" }}>Submit a certificate for AI analysis</h2>
                </div>
                <div className="rounded-xl px-3 py-2" style={{ background: "rgba(18,163,123,0.08)", border: "1px solid rgba(18,163,123,0.18)" }}>
                  <div style={{ fontSize: "10px", color: "#12A37B", letterSpacing: "0.08em" }}>{user?.plan ?? "FREE"}</div>
                </div>
              </div>

              <div
                onDragOver={(event) => { event.preventDefault(); setDropActive(true); }}
                onDragLeave={() => setDropActive(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDropActive(false);
                  setSelectedFile(event.dataTransfer.files?.[0] ?? null);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-3xl p-8 text-center cursor-pointer transition-all"
                style={{ background: dropActive ? "rgba(18,163,123,0.08)" : "rgba(255,255,255,0.02)", border: `1.5px dashed ${dropActive ? "rgba(18,163,123,0.55)" : "rgba(255,255,255,0.08)"}` }}
              >
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" hidden onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)} />
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "rgba(18,163,123,0.1)", border: "1px solid rgba(18,163,123,0.18)" }}>
                  <Upload size={24} color="#12A37B" />
                </div>
                <h3 style={{ color: "#F0F6FF", fontSize: "1.05rem", marginBottom: "6px" }}>{selectedFile ? selectedFile.name : "Drop a certificate here"}</h3>
                <p style={{ color: "rgba(176,196,222,0.58)", lineHeight: 1.6, marginBottom: 0 }}>
                  PDF, JPG, or PNG. The backend will store the scan, gate payment if required, and queue the verification job.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 mt-5">
                <div style={{ color: "rgba(176,196,222,0.58)", fontSize: "12px" }}>
                  {selectedFile ? `Selected: ${selectedFile.name}` : "No file selected yet."}
                </div>
                <button type="submit" disabled={submitting || !selectedFile || isPollingPayment} className="inline-flex items-center gap-2 rounded-xl px-5 py-3 transition-opacity disabled:opacity-60" style={{ background: "linear-gradient(135deg, #0F6E56, #12A37B)", color: "white", fontWeight: 600 }}>
                  {submitting || isPollingPayment ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {submitting ? "Submitting…" : isPollingPayment ? "Verifying transaction…" : "Start verification"}
                </button>
              </div>

              {verifyBlockReason && (
                <div className="flex items-center gap-2 rounded-xl px-4 py-2 mt-3" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)" }}>
                  <AlertCircle size={14} color="#EF4444" />
                  <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.82)" }}>{verifyBlockReason}</span>
                </div>
              )}
            </form>

            <AnimatePresence mode="wait">
              {uploadResult && (
                <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-3xl p-6 md:p-7" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                    <div>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.38)", letterSpacing: "0.08em" }}>LATEST SUBMISSION</div>
                      <h2 style={{ color: "#F0F6FF", fontSize: "1.1rem", marginTop: "4px" }}>{uploadResult.scan.fileName}</h2>
                      <p style={{ color: "rgba(176,196,222,0.58)", marginBottom: 0 }}>Scan code {uploadResult.scan.scanCode}</p>
                    </div>
                    <div className="rounded-2xl p-4 text-right" style={{ background: uploadResult.paymentRequired ? "rgba(245,158,11,0.08)" : "rgba(18,163,123,0.08)", border: `1px solid ${uploadResult.paymentRequired ? "rgba(245,158,11,0.18)" : "rgba(18,163,123,0.18)"}` }}>
                      <div style={{ fontSize: "10px", color: uploadResult.paymentRequired ? "#F59E0B" : "#12A37B", letterSpacing: "0.08em" }}>{uploadResult.paymentRequired ? "PAYMENT REQUIRED" : "QUEUED"}</div>
                      <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: "#F0F6FF", marginTop: "4px" }}>{formatCurrency(uploadResult.pricing.price, uploadResult.pricing.currency)}</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-[180px_1fr] gap-6 items-center">
                    <ScoreRing score={scoreForScan(uploadResult.scan)} size={160} animate />
                    <div className="grid sm:grid-cols-2 gap-3">
                      {[
                        ["Scan code", uploadResult.scan.scanCode],
                        ["Status", scanLabel(uploadResult.scan.status)],
                        ["Verification", scanLabel(uploadResult.scan.verificationStatus)],
                        ["Payment", scanLabel(uploadResult.scan.paymentStatus)],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: "rgba(176,196,222,0.35)", letterSpacing: "0.08em", marginBottom: "4px" }}>{String(label).toUpperCase()}</div>
                          <div style={{ color: "#F0F6FF", fontSize: "13px", lineHeight: 1.5 }}>{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 mt-6">
                    <Link to={`/results/${uploadResult.scan.id}`} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 no-underline" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#F0F6FF" }}>
                      <FileText size={15} />
                      Open report
                    </Link>
                    {uploadResult.paymentRequired && uploadResult.transaction && (
                      <button type="button" onClick={handleCheckPayment} className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5" style={{ background: "rgba(18,163,123,0.12)", border: "1px solid rgba(18,163,123,0.2)", color: "#12A37B" }}>
                        <CreditCard size={15} />
                        Check payment
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {workspaceError && (
              <div className="rounded-2xl p-4" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.16)" }}>
                <p className="m-0" style={{ color: "rgba(255,255,255,0.85)" }}>{workspaceError}</p>
              </div>
            )}

            {checkoutResult && (
              <div className="rounded-2xl p-4" style={{ background: "rgba(18,163,123,0.08)", border: "1px solid rgba(18,163,123,0.18)" }}>
                <p className="m-0" style={{ color: "#F0F6FF" }}>Payment checkout opened for transaction {checkoutResult.transaction.reference}.</p>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="space-y-6">
            <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.38)", letterSpacing: "0.08em" }}>WORKSPACE</div>
                  <div style={{ color: "#F0F6FF", marginTop: "4px" }}>{user?.name}</div>
                </div>
                <Wallet size={16} color="#12A37B" />
              </div>
              <div className="space-y-3 text-sm" style={{ color: "rgba(176,196,222,0.72)" }}>
                <div className="flex items-center justify-between"><span>Plan</span><span style={{ color: "#F0F6FF" }}>{user?.plan ?? "FREE"}</span></div>
                <div className="flex items-center justify-between"><span>Monthly reset</span><span style={{ color: "#F0F6FF" }}>{usage?.resetAt ? new Date(usage.resetAt).toLocaleDateString() : "—"}</span></div>
                <div className="flex items-center justify-between"><span>Remaining scans</span><span style={{ color: "#F0F6FF" }}>{usage ? usage.monthlyRemaining : "—"}</span></div>
                <div className="flex items-center justify-between"><span>Wallet</span><span style={{ color: "#F0F6FF" }}>{showWallet ? (wallet ? formatCurrency(wallet.balance, wallet.currency) : "—") : "Not available"}</span></div>
                <div className="flex items-center justify-between"><span>API access</span><span style={{ color: "#12A37B" }}>{status === "authenticated" ? "ACTIVE" : "PENDING"}</span></div>
              </div>
            </div>

            <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.38)", letterSpacing: "0.08em" }}>RECENT SCANS</div>
                  <div style={{ color: "#F0F6FF", marginTop: "4px" }}>Latest backend results</div>
                </div>
                {loadingWorkspace && <Loader2 size={16} className="animate-spin" color="#12A37B" />}
              </div>

              <div className="space-y-3">
                {recentScans.length === 0 ? (
                  <div className="rounded-2xl p-4 text-sm" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(176,196,222,0.6)" }}>
                    Your scan history will appear here after the first upload.
                  </div>
                ) : (
                  recentScans.map((scan) => {
                    const tone = scan.verificationStatus === "VERIFIED" ? "#12A37B" : scan.verificationStatus === "FLAGGED" || scan.verificationStatus === "FAILED" ? "#EF4444" : "#F59E0B";
                    return (
                      <Link key={scan.id} to={`/results/${scan.id}`} className="block no-underline rounded-2xl p-4 transition-all hover:translate-y-[-1px]" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div style={{ color: "#F0F6FF", fontSize: "13px", marginBottom: "3px" }}>{scan.fileName}</div>
                            <div style={{ color: "rgba(176,196,222,0.52)", fontSize: "11px" }}>{scan.scanCode}</div>
                          </div>
                          <div className="text-right">
                            <div style={{ color: tone, fontSize: "12px", fontWeight: 600 }}>{scanLabel(scan.verificationStatus)}</div>
                            <div style={{ color: "rgba(176,196,222,0.45)", fontSize: "10px" }}>{new Date(scan.createdAt).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        checkoutUrl={checkoutResult ? extractCheckoutUrl(checkoutResult.checkout) : null}
        transactionRef={checkoutResult?.transaction?.reference ?? uploadResult?.transaction?.reference ?? null}
        amount={checkoutResult?.transaction ? Number(checkoutResult.transaction.amount) : uploadResult?.transaction ? Number(uploadResult.transaction.amount) : undefined}
        type="scan"
        isAutoVerifying={isPollingPayment}
        onClose={() => setPaymentModalOpen(false)}
        onVerify={async (ref) => {
          try {
            const result = await api.verifyPayment(ref);
            return result.processed === true || result.alreadyProcessed === true;
          } catch {
            return false;
          }
        }}
        onSuccess={() => {
          setSelectedFile(null);
          setUploadResult(null);
          setCheckoutResult(null);
          setPaymentModalOpen(false);
          setVerifyingTransaction(false);
          void loadWorkspace();
        }}
      />
    </div>
  );
}
