import { FormEvent, useMemo, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Upload, Loader2, FileText, X } from "lucide-react";
import { api, extractCheckoutUrl } from "../lib/api";
import type { BulkPricing } from "../lib/types";

function formatCurrency(value: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function BulkUploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [pricing, setPricing] = useState<BulkPricing | null>(null);
  const [busy, setBusy] = useState(false);

  const count = files.length;

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(event.target.files ?? []);
    setFiles(list);
    void fetchPricing(list.length);
  };

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    void fetchPricing(next.length);
  };

  const fetchPricing = async (scanCount: number) => {
    if (!scanCount) {
      setPricing(null);
      return;
    }
    try {
      const result = await api.getBulkPricing(scanCount);
      setPricing(result);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to fetch bulk pricing.");
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!files.length) {
      toast.error("Select at least one certificate file.");
      return;
    }

    setBusy(true);
    try {
      const result = await api.submitBulkScans(files);
      if (result.paymentRequired && result.checkout) {
        const checkoutUrl = extractCheckoutUrl(result.checkout);
        if (checkoutUrl) {
          window.open(checkoutUrl, "_blank", "noopener,noreferrer");
        }
        toast.message("Bulk payment required. Complete checkout to start verification.");
      } else {
        toast.success("Bulk verification queued successfully.");
      }
      setFiles([]);
      setPricing(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to submit bulk verification.");
    } finally {
      setBusy(false);
    }
  };

  const pricingCopy = useMemo(() => {
    if (!pricing || !count) return null;
    return {
      unit: formatCurrency(pricing.unitPrice),
      total: formatCurrency(pricing.total),
      discount: Math.round(pricing.discountRate * 100),
    };
  }, [pricing, count]);

  return (
    <div className="min-h-screen pt-26 px-6 md:px-10 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div style={{ color: "rgba(176,196,222,0.5)", fontSize: "11px", letterSpacing: "0.08em" }}>
            BULK VERIFY
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "#F0F6FF",
              fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
            }}
          >
            Bulk upload verification
          </h1>
          <p style={{ color: "rgba(176,196,222,0.7)", marginTop: "10px" }}>
            Upload multiple certificates at once. Pricing scales with volume.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl p-6"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <label className="block">
            <span className="block mb-2 text-sm" style={{ color: "rgba(176,196,222,0.8)" }}>
              Select certificate files
            </span>
            <input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFiles}
              className="w-full rounded-xl px-4 py-3"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#F0F6FF",
              }}
            />
          </label>

          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <FileText size={14} color="#12A37B" />
                  <div className="flex-1 min-w-0">
                    <div
                      style={{
                        color: "#F0F6FF",
                        fontSize: "12px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {file.name}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "rgba(176,196,222,0.5)",
                      cursor: "pointer",
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {pricingCopy && (
            <div
              className="grid grid-cols-3 gap-3 mt-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px" }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "9px",
                    color: "rgba(176,196,222,0.4)",
                    letterSpacing: "0.08em",
                  }}
                >
                  UNIT PRICE
                </div>
                <div style={{ color: "#F0F6FF", fontWeight: 600, fontSize: "14px" }}>{pricingCopy.unit}</div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "9px",
                    color: "rgba(176,196,222,0.4)",
                    letterSpacing: "0.08em",
                  }}
                >
                  DISCOUNT
                </div>
                <div style={{ color: "#12A37B", fontWeight: 600, fontSize: "14px" }}>
                  {pricingCopy.discount}% off
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "9px",
                    color: "rgba(176,196,222,0.4)",
                    letterSpacing: "0.08em",
                  }}
                >
                  TOTAL
                </div>
                <div style={{ color: "#F0F6FF", fontWeight: 600, fontSize: "14px" }}>{pricingCopy.total}</div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !files.length}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-3 mt-5 transition-opacity disabled:opacity-60"
            style={{
              background: "linear-gradient(135deg, #0F6E56, #12A37B)",
              color: "white",
              fontWeight: 600,
            }}
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {busy ? "Submitting…" : `Submit ${count || ""} bulk ${count === 1 ? "scan" : "scans"}`}
          </button>
        </form>
      </div>
    </div>
  );
}