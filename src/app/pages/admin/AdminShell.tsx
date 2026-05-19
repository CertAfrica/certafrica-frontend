import { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { motion } from "motion/react";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Cpu,
  FileScan,
  Layers3,
  ShieldCheck,
  Sparkles,
  Users,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface AdminShellProps {
  title: string;
  subtitle: string;
  eyebrow?: string;
  children: ReactNode;
}

const navItems = [
  { to: "/admin", label: "Overview", icon: Layers3 },
  { to: "/admin/training", label: "AI Training", icon: Cpu },
  { to: "/admin/retrain", label: "Retrain", icon: RefreshCw },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/scans", label: "Scans", icon: FileScan },
  { to: "/admin/refunds", label: "Refunds", icon: BarChart3 },
];

export function AdminShell({ title, subtitle, eyebrow = "ADMIN PORTAL", children }: AdminShellProps) {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen pt-16" style={{ background: "#08111E" }}>
      <div className="fixed left-0 top-16 hidden h-[calc(100vh-64px)] w-72 border-r border-white/5 bg-[#08111E]/95 backdrop-blur-xl md:block">
        <div className="flex h-full flex-col p-5">
          <div className="rounded-3xl border border-white/8 bg-white/4 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/35">
              <ShieldCheck size={13} className="text-emerald-400" />
              Secure workspace
            </div>
            <div className="mt-3 text-sm font-semibold text-slate-100">{user?.name ?? "Admin"}</div>
            <div className="mt-1 text-xs text-emerald-300/90">{user?.email ?? "admin@certafrica.ng"}</div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-200/80">
              <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
                <div className="text-[10px] uppercase tracking-[0.16em] text-white/30">Role</div>
                <div className="mt-1 font-medium">{user?.role ?? "ADMIN"}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-black/20 p-3">
                <div className="text-[10px] uppercase tracking-[0.16em] text-white/30">Plan</div>
                <div className="mt-1 font-medium">{user?.plan ?? "PRO"}</div>
              </div>
            </div>
          </div>

          <nav className="mt-5 space-y-1.5">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group flex items-center gap-3 rounded-2xl border px-4 py-3 no-underline transition-all duration-300"
                  style={{
                    background: active ? "rgba(18,163,123,0.12)" : "rgba(255,255,255,0.03)",
                    borderColor: active ? "rgba(18,163,123,0.25)" : "rgba(255,255,255,0.05)",
                    color: active ? "#12A37B" : "rgba(226,232,240,0.78)",
                  }}
                >
                  <item.icon size={15} className={active ? "text-emerald-400" : "text-slate-400"} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto rounded-3xl border border-white/8 bg-gradient-to-br from-emerald-500/15 to-cyan-400/10 p-4 text-sm text-slate-200/80 shadow-[0_18px_50px_rgba(0,0,0,0.25)]">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-emerald-300/80">
              <Activity size={13} />
              Live system status
            </div>
            <p className="mt-2 leading-6 text-slate-200/75">
              Monitor AI training jobs, retrain runs, scans, and refunds from a single command surface.
            </p>
          </div>
        </div>
      </div>

      <main className="md:pl-72">
        <div className="mx-auto max-w-7xl px-6 py-8 md:px-10">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-emerald-300">
                <Sparkles size={12} />
                {eyebrow}
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-50 md:text-5xl" style={{ fontFamily: "'Playfair Display', serif" }}>
                {title}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300/75 md:text-base">{subtitle}</p>
            </div>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm font-medium text-slate-100 no-underline transition-all duration-300 hover:bg-white/8"
            >
              <ArrowLeft size={15} />
              Back to workspace
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
