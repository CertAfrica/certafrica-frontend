import { Link, useLocation } from "react-router";
import { Building2, CreditCard, FileText, Layers, Users, Wallet } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Sidebar() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  const isPro = user.plan === "PRO";
  const isStarter = user.plan === "STARTER";
  const showWallet = isStarter || isPro;
  const dashboardPath = isPro ? "/pro/dashboard" : isStarter ? "/starter/dashboard" : "/free/dashboard";

  const links = [
    { to: dashboardPath, label: "Dashboard", icon: Layers, show: true },
    { to: "/verify", label: "Verify", icon: FileText, show: true },
    { to: "/wallet", label: "Wallet", icon: Wallet, show: showWallet },
    { to: "/billing", label: "Billing", icon: CreditCard, show: showWallet },
    { to: "/team", label: "Team", icon: Users, show: isPro },
    { to: "/bulk", label: "Bulk", icon: Building2, show: isPro },
  ];

  return (
    <aside
      className="w-full md:w-64 md:fixed md:left-0 md:top-16 md:h-[calc(100vh-64px)] md:border-r"
      style={{ background: "rgba(8, 17, 30, 0.95)", borderColor: "rgba(15, 110, 86, 0.2)" }}
    >
      <div className="p-4 space-y-2">
        {isPro && (
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.4)", letterSpacing: "0.08em" }}>
            WORKSPACE
          </div>
        )}
        <div style={{ color: "#F0F6FF", fontWeight: 600 }}>{user.name}</div>
        <div style={{ color: "rgba(176,196,222,0.6)", fontSize: "12px" }}>{user.plan} plan</div>
      </div>

      <div className="px-3 pb-4 space-y-1">
        {links.filter((link) => link.show).map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className="flex items-center gap-3 px-3 py-2 rounded-xl no-underline transition-all"
              style={{
                color: isActive ? "#12A37B" : "rgba(176,196,222,0.8)",
                background: isActive ? "rgba(15, 110, 86, 0.12)" : "transparent",
                border: isActive ? "1px solid rgba(15, 110, 86, 0.25)" : "1px solid transparent",
                fontSize: "13px",
              }}
            >
              <link.icon size={16} color={isActive ? "#12A37B" : "rgba(176,196,222,0.6)"} />
              {link.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
