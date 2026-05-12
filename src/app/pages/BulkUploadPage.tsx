import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";
import { api, extractCheckoutUrl } from "../lib/api";
import type { BulkPricing } from "../lib/types";

function formatCurrency(value: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export function BulkUploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [pricing, setPricing] = useState<BulkPricing | null>(null);
  const [busy, setBusy] = useState(false);

  const count = files.length;

  const handleFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(event.target.files ?? []);
    setFiles(list);
  };

  const fetchPricing = async (scanCount: number) => {
    if (!scanCount) return;
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
    if (!pricing || !count) return "Select files to preview bulk pricing.";
    return `Unit price ${formatCurrency(pricing.unitPrice)} • total ${formatCurrency(pricing.total)} • discount ${Math.round(pricing.discountRate * 100)}%`;
  }, [pricing, count]);

  return (
    <div className="min-h-screen pt-16 px-6 md:px-10 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div style={{ color: "rgba(176,196,222,0.5)", fontSize: "11px", letterSpacing: "0.08em" }}>BULK VERIFY</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#F0F6FF", fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>Bulk upload verification</h1>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <label className="block mb-4">
            <span className="block mb-2 text-sm" style={{ color: "rgba(176,196,222,0.8)" }}>Select certificate files</span>
            <input type="file" multiple accept=".pdf,.png,.jpg,.jpeg" onChange={(event) => { handleFiles(event); void fetchPricing(event.target.files?.length ?? 0); }} className="w-full rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F0F6FF" }} />
          </label>
          <div className="rounded-2xl p-4 text-sm mb-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(176,196,222,0.75)" }}>
            {pricingCopy}
          </div>
          <button type="submit" disabled={busy || !files.length} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 transition-opacity disabled:opacity-60" style={{ background: "linear-gradient(135deg, #0F6E56, #12A37B)", color: "white", fontWeight: 600 }}>
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {busy ? "Submitting…" : "Submit bulk verification"}
          </button>
        </form>
      </div>
    </div>
  );
}
