import { Link, useLocation } from "react-router";
import { Shield, Upload, CircleUserRound, DoorOpen } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  const publicLinks = [
    { to: "/pricing", label: "Pricing" },
    { to: "/onboarding", label: "Onboarding" }
  ];

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10"
      style={{
        height: "64px",
        background: "rgba(8, 17, 30, 0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(15, 110, 86, 0.2)",
      }}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 no-underline">
        <div
          className="flex items-center justify-center rounded-lg"
          style={{
            width: "32px",
            height: "32px",
            background: "linear-gradient(135deg, #0F6E56 0%, #12A37B 100%)",
          }}
        >
          <Shield size={16} color="white" strokeWidth={2.5} />
        </div>
        <div>
          <span
            className="tracking-tight"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "14px",
              fontWeight: 600,
              color: "#F0F6FF",
              letterSpacing: "-0.02em",
            }}
          >
            CertAfrica
          </span>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "14px",
              fontWeight: 400,
              color: "#12A37B",
            }}
          >
            {" "}AI
          </span>
        </div>
      </Link>

      {!isAuthenticated ? (
        <div className="hidden md:flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1">
            {publicLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="px-4 py-1.5 rounded-lg transition-all no-underline"
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: isActive ? "#12A37B" : "rgba(176, 196, 222, 0.8)",
                    background: isActive ? "rgba(15, 110, 86, 0.12)" : "transparent",
                    border: isActive ? "1px solid rgba(15, 110, 86, 0.25)" : "1px solid transparent",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <Link
            to="/verify"
            className="hidden md:flex items-center gap-1.5 px-4 py-2 rounded-lg no-underline transition-all hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #0F6E56 0%, #12A37B 100%)",
              fontSize: "12px",
              fontWeight: 600,
              color: "white",
              fontFamily: "'IBM Plex Sans', sans-serif",
              letterSpacing: "0.02em",
            }}
          >
            <DoorOpen size={12} />
            Login
          </Link>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <CircleUserRound size={14} color="#12A37B" />
            <div>
              <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "12px", color: "#F0F6FF", lineHeight: 1 }}>{user?.name}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "9px", color: "rgba(176,196,222,0.4)" }}>{user?.plan}</div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all hover:opacity-85"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(176,196,222,0.8)", fontSize: "12px" }}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
