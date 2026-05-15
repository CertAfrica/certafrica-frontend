import { Link } from "react-router";

export function TermsPage() {
  return (
    <div className="min-h-screen pt-16 px-6 md:px-10 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.6rem, 3.5vw, 2.4rem)", color: "#F0F6FF", marginBottom: "8px" }}>Terms of Service</h1>
        <p style={{ color: "rgba(176,196,222,0.7)", marginBottom: "18px" }}>
          These Terms govern your use of CertAfrica's verification services. By using our website or services you agree to these terms. If you do not agree, please do not use the services.
        </p>

        <section className="mb-6">
          <h2 style={{ color: "#F0F6FF", fontSize: "1.05rem", marginBottom: 6 }}>Service scope</h2>
          <p style={{ color: "rgba(176,196,222,0.65)" }}>
            CertAfrica provides automated document verification services and reports based on uploaded documents and available registries. Results are advisory and should be used in conjunction with your internal policies.
          </p>
        </section>

        <section className="mb-6">
          <h2 style={{ color: "#F0F6FF", fontSize: "1.05rem", marginBottom: 6 }}>Liability</h2>
          <p style={{ color: "rgba(176,196,222,0.65)" }}>
            To the fullest extent permitted by law, CertAfrica's liability for any damages arising from use of the service is limited to the fees paid for the service giving rise to the claim. We do not accept liability for indirect or consequential losses.
          </p>
        </section>

        <section className="mb-6">
          <h2 style={{ color: "#F0F6FF", fontSize: "1.05rem", marginBottom: 6 }}>Acceptable use</h2>
          <p style={{ color: "rgba(176,196,222,0.65)" }}>
            You agree not to misuse the service, upload fraudulent content for malicious use, or attempt to circumvent security protections. CertAfrica reserves the right to suspend accounts that violate these terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 style={{ color: "#F0F6FF", fontSize: "1.05rem", marginBottom: 6 }}>Privacy & NDPC</h2>
          <p style={{ color: "rgba(176,196,222,0.65)" }}>
            We follow guidance issued by the Nigeria Data Protection Commission (NDPC) and strive to align our practices with its requirements for lawful processing, security, and data subject rights. Our Privacy Policy explains how we collect, use, and protect your data.
          </p>
        </section>

        <div className="flex items-center gap-3">
          <Link to="/" className="inline-flex items-center gap-2 rounded-lg px-4 py-2" style={{ background: "rgba(255,255,255,0.03)", color: "#F0F6FF" }}>Back to home</Link>
          <Link to="/privacy" className="inline-flex items-center gap-2 rounded-lg px-4 py-2" style={{ background: "linear-gradient(135deg, #0F6E56, #12A37B)", color: "white" }}>Privacy</Link>
        </div>
      </div>
    </div>
  );
}

export default TermsPage;
