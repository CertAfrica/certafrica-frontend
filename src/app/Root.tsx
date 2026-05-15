import { Outlet, Link, useLocation } from "react-router";
import { Toaster } from "sonner";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { AuthProvider, useAuth } from "./context/AuthContext";

function Shell() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const protectedPrefixes = ["/auth", "/dashboard", "/verify", "/settings", "/results", "/wallet", "/billing", "/team", "/bulk"];
  const showFooter = !protectedPrefixes.some((p) => location.pathname.startsWith(p));

  return (
    <div
      className="min-h-screen"
      style={{ background: "#08111E", fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      <Navbar />
      {isAuthenticated && <Sidebar />}
      <main className={isAuthenticated ? "md:pl-64" : ""}>
        <Outlet />
      </main>
      <Toaster richColors position="top-right" closeButton />

      {/* Global footer for public pages (hidden on protected routes like /auth, /verify, /dashboard, etc.) */}
      {showFooter && (
        <footer
          className="pt-12 pb-8"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            background: "#08111E",
          }}
        >
          <div className="max-w-6xl mx-auto px-6 md:px-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left mb-6">
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", color: "#F0F6FF", fontWeight: 600 }}>
                  CertAfrica
                </div>
                <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "12px", color: "rgba(176,196,222,0.7)", marginTop: "6px" }}>
                  Real-time credential verification and integrity reports for education and professional sectors.
                </div>
              </div>

              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "rgba(176,196,222,0.35)", marginBottom: "8px" }}>PRODUCT</div>
                <ul className="space-y-2">
                  <li><Link to="/verify" className="no-underline" style={{ color: "rgba(176,196,222,0.8)" }}>Verify Document</Link></li>
                  <li><Link to="/pricing" className="no-underline" style={{ color: "rgba(176,196,222,0.8)" }}>Pricing</Link></li>
                  <li><Link to="/docs" className="no-underline" style={{ color: "rgba(176,196,222,0.8)" }}>API & Docs</Link></li>
                </ul>
              </div>

              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "rgba(176,196,222,0.35)", marginBottom: "8px" }}>COMPANY</div>
                <ul className="space-y-2">
                  <li><Link to="/about" className="no-underline" style={{ color: "rgba(176,196,222,0.8)" }}>About</Link></li>
                  <li><Link to="/careers" className="no-underline" style={{ color: "rgba(176,196,222,0.8)" }}>Careers</Link></li>
                  <li><Link to="/contact" className="no-underline" style={{ color: "rgba(176,196,222,0.8)" }}>Contact</Link></li>
                </ul>
              </div>

              <div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "rgba(176,196,222,0.35)", marginBottom: "8px" }}>LEGAL & SUPPORT</div>
                <ul className="space-y-2">
                  <li><a href="/privacy" className="no-underline" style={{ color: "rgba(176,196,222,0.8)" }}>Privacy Policy</a></li>
                  <li><a href="/terms" className="no-underline" style={{ color: "rgba(176,196,222,0.8)" }}>Terms of Service</a></li>
                  <li><a href="mailto:support@certafrica.ng" className="no-underline" style={{ color: "rgba(176,196,222,0.8)" }}>support@certafrica.ng</a></li>
                </ul>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between text-sm" style={{ borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "12px" }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "12px", color: "rgba(176,196,222,0.45)" }}>
                © {new Date().getFullYear()} CertAfrica Ltd. All rights reserved.
              </div>

              <div style={{ marginTop: "8px" }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "11px", color: "rgba(176,196,222,0.35)", letterSpacing: "0.04em" }}>
                  Built with ♥ in Nigeria — <a href="https://certafrica.vercel.app" className="no-underline" style={{ color: "#12A37B" }}>certafrica.vercel.app</a>
                </span>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export function Root() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}