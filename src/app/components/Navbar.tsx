import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import { Shield, CircleUserRound, DoorOpen, Menu, X, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const publicLinks = [
    { to: "/pricing", label: "Pricing" },
    { to: "/onboarding", label: "Onboarding" },
  ];

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
            {" "}
            AI
          </span>
        </div>
      </Link>

      {/* Public, unauthenticated nav */}
      {!isAuthenticated ? (
        <>
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1 mr-2">
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
              to="/auth"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg no-underline transition-all hover:opacity-90"
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

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg"
            onClick={() => setMobileMenuOpen((v) => !v)}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {mobileMenuOpen ? <X size={18} color="#F0F6FF" /> : <Menu size={18} color="#F0F6FF" />}
          </button>
        </>
      ) : (
        <>
          {/* Authenticated profile dropdown */}
          <div className="hidden md:block relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 rounded-xl px-3 py-2"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer",
              }}
            >
              <CircleUserRound size={16} color="#12A37B" />
              <div style={{ textAlign: "left" }}>
                <div
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: "12px",
                    color: "#F0F6FF",
                    lineHeight: 1,
                  }}
                >
                  {user?.name}
                </div>
                <div
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "9px",
                    color: "rgba(176,196,222,0.5)",
                    letterSpacing: "0.04em",
                    marginTop: "2px",
                  }}
                >
                  {user?.plan}
                </div>
              </div>
            </button>

            {profileOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-xl py-1.5 certafrica-fade-in"
                style={{
                  background: "#0c1828",
                  border: "1px solid rgba(255,255,255,0.08)",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
                }}
              >
                <div className="px-4 py-2 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                  <div style={{ color: "#F0F6FF", fontSize: "13px" }}>{user?.name}</div>
                  <div style={{ color: "rgba(176,196,222,0.6)", fontSize: "11px" }}>{user?.email}</div>
                </div>
                {[
                  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
                  { to: "/settings", label: "Settings", icon: Settings },
                ].map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-2.5 px-4 py-2 no-underline transition-colors"
                    style={{ color: "rgba(176,196,222,0.85)", fontSize: "13px" }}
                  >
                    <item.icon size={14} />
                    {item.label}
                  </Link>
                ))}
                <div className="my-1 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-4 py-2"
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "rgba(239,68,68,0.85)",
                    fontSize: "13px",
                    textAlign: "left",
                    cursor: "pointer",
                  }}
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger for auth */}
          <button
            type="button"
            className="md:hidden p-2 rounded-lg"
            onClick={() => setMobileMenuOpen((v) => !v)}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {mobileMenuOpen ? <X size={18} color="#F0F6FF" /> : <Menu size={18} color="#F0F6FF" />}
          </button>
        </>
      )}

      {/* Mobile menu sheet */}
      {mobileMenuOpen && (
        <div
          className="md:hidden absolute left-0 right-0 top-16 p-4 space-y-2 certafrica-fade-in"
          style={{
            background: "rgba(8, 17, 30, 0.98)",
            backdropFilter: "blur(20px)",
            borderBottom: "1px solid rgba(15, 110, 86, 0.2)",
          }}
        >
          {!isAuthenticated ? (
            <>
              {publicLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="block px-4 py-3 rounded-xl no-underline"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "rgba(176,196,222,0.85)",
                    fontSize: "13px",
                  }}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/auth"
                className="block px-4 py-3 rounded-xl no-underline text-center"
                style={{
                  background: "linear-gradient(135deg, #0F6E56, #12A37B)",
                  color: "white",
                  fontWeight: 600,
                }}
              >
                Login / Sign up
              </Link>
            </>
          ) : (
            <>
              <div
                className="rounded-xl p-3"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div style={{ color: "#F0F6FF", fontSize: "13px" }}>{user?.name}</div>
                <div style={{ color: "#12A37B", fontSize: "11px", marginTop: "2px" }}>{user?.plan} plan</div>
              </div>
              {[
                { to: "/dashboard", label: "Dashboard" },
                { to: "/verify", label: "Verify" },
                { to: "/settings", label: "Settings" },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="block px-4 py-3 rounded-xl no-underline"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "rgba(176,196,222,0.85)",
                    fontSize: "13px",
                  }}
                >
                  {item.label}
                </Link>
              ))}
              <button
                type="button"
                onClick={logout}
                className="w-full px-4 py-3 rounded-xl text-left"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                  color: "#EF4444",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Sign out
              </button>
            </>
          )}
        </div>
      )}
    </nav>
  );
}