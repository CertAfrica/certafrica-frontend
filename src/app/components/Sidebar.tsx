import { Link, useLocation } from "react-router";
import {
  Building2,
  CreditCard,
  FileText,
  Layers,
  ShieldCheck,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Sidebar() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) return null;

  const isPro = user.plan === "PRO";
  const isStarter = user.plan === "STARTER";
  const showWallet = isStarter || isPro;
  const isAdmin = user.role === "ADMIN";

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: Layers, show: true },
    { to: "/verify", label: "Verify", icon: FileText, show: true },
    { to: "/admin", label: "Admin portal", icon: ShieldCheck, show: isAdmin },
    { to: "/wallet", label: "Wallet", icon: Wallet, show: showWallet },
    { to: "/billing", label: "Billing", icon: CreditCard, show: showWallet },
    { to: "/team", label: "Team", icon: Users, show: isPro },
    { to: "/bulk", label: "Bulk verify", icon: Building2, show: isPro },
    { to: "/settings", label: "Settings", icon: Settings, show: true },
  ];

  // Hidden on mobile; shown only on md+ to match Root.tsx layout
  return (
    <aside
      className="hidden md:block w-64 fixed left-0 top-16 h-[calc(100vh-64px)] border-r overflow-y-auto"
      style={{ background: "rgba(8, 17, 30, 0.95)", borderColor: "rgba(15, 110, 86, 0.2)" }}
    >
      <div className="p-4">
        <div
          className="rounded-2xl p-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "9px",
              color: "rgba(176,196,222,0.4)",
              letterSpacing: "0.08em",
              marginBottom: "4px",
            }}
          >
            WORKSPACE
          </div>
          <div style={{ color: "#F0F6FF", fontWeight: 600, fontSize: "14px" }}>{user.name}</div>
          <div
            style={{
              color: user.plan === "PRO" ? "#12A37B" : user.plan === "STARTER" ? "#3B8BD4" : "#F59E0B",
              fontSize: "11px",
              marginTop: "4px",
              fontFamily: "'IBM Plex Mono', monospace",
              letterSpacing: "0.04em",
            }}
          >
            {user.plan} PLAN
          </div>
        </div>
      </div>

      <div className="px-3 pb-4 space-y-1">
        {links
          .filter((link) => link.show)
          .map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl no-underline transition-all"
                style={{
                  color: isActive ? "#12A37B" : "rgba(176,196,222,0.8)",
                  background: isActive ? "rgba(15, 110, 86, 0.12)" : "transparent",
                  border: isActive ? "1px solid rgba(15, 110, 86, 0.25)" : "1px solid transparent",
                  fontSize: "13px",
                }}
              >
                <link.icon size={15} color={isActive ? "#12A37B" : "rgba(176,196,222,0.6)"} />
                {link.label}
              </Link>
            );
          })}
      </div>
    </aside>
  );
}