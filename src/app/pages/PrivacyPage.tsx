import { Link } from "react-router";
import { ShieldCheck } from "lucide-react";

export function PrivacyPage() {
  return (
    <div className="min-h-screen pt-16 px-6 md:px-10 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 inline-flex items-center gap-3 rounded-full px-4 py-2" style={{ background: "rgba(18,163,123,0.06)", border: "1px solid rgba(18,163,123,0.12)" }}>
          <ShieldCheck size={16} color="#12A37B" />
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", color: "#12A37B", fontWeight: 600 }}>Privacy-first · NDPC-aligned</div>
        </div>

        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", color: "#F0F6FF", marginBottom: "8px" }}>Privacy Policy</h1>
        <p style={{ color: "rgba(176,196,222,0.7)", marginBottom: "18px" }}>
          We take your privacy seriously. CertAfrica is committed to protecting personal data in accordance with applicable laws and best practices. We strive to align our practices with the Nigeria Data Protection framework and follow guidance issued by the Nigeria Data Protection Commission (NDPC).
        </p>

        <section className="mb-6">
          <h2 style={{ color: "#F0F6FF", fontSize: "1.05rem", marginBottom: 6 }}>What we collect</h2>
          <p style={{ color: "rgba(176,196,222,0.65)" }}>
            We collect only the information required to provide verification services: document images or files you upload, identifiers extracted from those documents (for verification), account details (name, email), billing and payment information when you purchase services, and usage metadata to maintain service quality.
          </p>
        </section>

        <section className="mb-6">
          <h2 style={{ color: "#F0F6FF", fontSize: "1.05rem", marginBottom: 6 }}>How we use data</h2>
          <p style={{ color: "rgba(176,196,222,0.65)" }}>
            Your data is used to run verifications, deliver reports to you, process payments, and improve model performance in an aggregated, anonymized form. We do not sell personal data to third parties.
          </p>
        </section>

        <section className="mb-6">
          <h2 style={{ color: "#F0F6FF", fontSize: "1.05rem", marginBottom: 6 }}>Data sharing & NDPC</h2>
          <p style={{ color: "rgba(176,196,222,0.65)" }}>
            We may share limited data with trusted service providers (e.g., payment processors or registry lookups) strictly to fulfill your requested service. CertAfrica follows NDPC guidance on lawful bases for processing, data subject rights, and breach reporting, and we strive to meet the standards outlined by the Commission. For more information about the NDPC, visit <a className="no-underline" href="https://ndpc.gov.ng" style={{ color: "#12A37B" }}>ndpc.gov.ng</a>.
          </p>
        </section>

        <section className="mb-6">
          <h2 style={{ color: "#F0F6FF", fontSize: "1.05rem", marginBottom: 6 }}>Your rights</h2>
          <p style={{ color: "rgba(176,196,222,0.65)" }}>
            You have the right to access, correct, or delete your personal data, to object to processing, and to request portability where applicable. To exercise these rights, contact us at <a href="mailto:privacy@certafrica.ng" className="no-underline" style={{ color: "#12A37B" }}>privacy@certafrica.ng</a>.
          </p>
        </section>

        <section className="mb-8">
          <h2 style={{ color: "#F0F6FF", fontSize: "1.05rem", marginBottom: 6 }}>Security</h2>
          <p style={{ color: "rgba(176,196,222,0.65)" }}>
            We maintain administrative, technical, and physical safeguards to protect your information. We strive to align our security practices with NDPC expectations for data controllers and processors. If you believe your data has been compromised, please contact us immediately at <a href="mailto:support@certafrica.ng" className="no-underline" style={{ color: "#12A37B" }}>support@certafrica.ng</a>.
          </p>
        </section>

        <div className="flex items-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 rounded-lg px-4 py-2" style={{ background: "rgba(255,255,255,0.03)", color: "#F0F6FF" }}>Back to home</Link>
          <Link to="/terms" className="inline-flex items-center gap-2 rounded-lg px-4 py-2" style={{ background: "linear-gradient(135deg, #0F6E56, #12A37B)", color: "white" }}>Terms</Link>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPage;
