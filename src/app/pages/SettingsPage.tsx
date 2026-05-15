import { FormEvent, useState } from "react";
import { Link } from "react-router";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Loader2,
  Lock,
  LogOut,
  Save,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

type Tab = "profile" | "security" | "notifications" | "plan";

const PLAN_INFO: Record<string, { label: string; price: string; perks: string[] }> = {
  FREE: {
    label: "Free",
    price: "₦0 / month",
    perks: ["2 free scans monthly", "₦500 per scan after free", "Monthly resets"],
  },
  STARTER: {
    label: "Starter",
    price: "₦2,500 / month",
    perks: ["10 scans per month", "₦400 per scan after quota", "Wallet access"],
  },
  PRO: {
    label: "Pro",
    price: "₦25,000 / month",
    perks: ["100 scans + rollover", "₦300 per additional scan", "Bulk pricing + team tools"],
  },
};

export function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const { logout } = useAuth();

  return (
    <div className="min-h-screen pt-16 px-6 md:px-10 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <div
            className="flex items-center gap-2 mb-2 text-xs"
            style={{ color: "rgba(176,196,222,0.45)", letterSpacing: "0.08em" }}
          >
            <Link to="/" className="no-underline" style={{ color: "inherit" }}>
              Home
            </Link>
            <ChevronRight size={10} />
            <span style={{ color: "#12A37B" }}>Settings</span>
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(1.9rem, 4vw, 2.8rem)",
              color: "#F0F6FF",
              lineHeight: 1.1,
              marginBottom: "8px",
            }}
          >
            Account settings
          </h1>
          <p style={{ color: "rgba(176,196,222,0.65)" }}>
            Manage your profile, security, notifications, and plan.
          </p>
        </div>

        <div className="grid lg:grid-cols-[220px_1fr] gap-6 items-start">
          <nav
            className="rounded-3xl p-3 space-y-1"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {([
              { id: "profile", label: "Profile", icon: User },
              { id: "security", label: "Security", icon: Lock },
              { id: "notifications", label: "Notifications", icon: Bell },
              { id: "plan", label: "Plan & billing", icon: CreditCard },
            ] as const).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl"
                style={{
                  background: tab === item.id ? "rgba(18,163,123,0.12)" : "transparent",
                  border: tab === item.id ? "1px solid rgba(18,163,123,0.25)" : "1px solid transparent",
                  color: tab === item.id ? "#12A37B" : "rgba(176,196,222,0.78)",
                  fontSize: "13px",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <item.icon size={15} />
                {item.label}
              </button>
            ))}
            <div className="my-2 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl"
              style={{
                background: "transparent",
                border: "1px solid transparent",
                color: "rgba(239,68,68,0.85)",
                fontSize: "13px",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <LogOut size={15} />
              Sign out
            </button>
          </nav>

          <div className="certafrica-fade-in">
            {tab === "profile" && <ProfileTab />}
            {tab === "security" && <SecurityTab />}
            {tab === "notifications" && <NotificationsTab />}
            {tab === "plan" && <PlanTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileTab() {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [busy, setBusy] = useState(false);

  const handleSave = (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setTimeout(() => {
      toast.success("Profile updated.");
      setBusy(false);
    }, 600);
  };

  return (
    <form
      onSubmit={handleSave}
      className="rounded-3xl p-6 space-y-5"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "10px",
            color: "rgba(176,196,222,0.4)",
            letterSpacing: "0.08em",
            marginBottom: "6px",
          }}
        >
          PROFILE
        </div>
        <h2 style={{ color: "#F0F6FF", fontSize: "1.15rem" }}>Your information</h2>
      </div>

      <label className="block">
        <span className="block mb-1.5 text-sm" style={{ color: "rgba(176,196,222,0.8)" }}>
          Full name
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl px-4 py-3"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#F0F6FF",
          }}
        />
      </label>

      <label className="block">
        <span className="block mb-1.5 text-sm" style={{ color: "rgba(176,196,222,0.8)" }}>
          Email
        </span>
        <input
          value={user?.email ?? ""}
          disabled
          className="w-full rounded-xl px-4 py-3"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            color: "rgba(176,196,222,0.55)",
          }}
        />
        <span className="block mt-1.5 text-xs" style={{ color: "rgba(176,196,222,0.45)" }}>
          Email can't be changed yet. Contact support if you need to update it.
        </span>
      </label>

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-3 transition-opacity disabled:opacity-60"
        style={{
          background: "linear-gradient(135deg, #0F6E56, #12A37B)",
          color: "white",
          fontWeight: 600,
        }}
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Save changes
      </button>
    </form>
  );
}

function SecurityTab() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (next !== confirm) {
      toast.error("New passwords don't match.");
      return;
    }
    if (next.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    setTimeout(() => {
      toast.success("Password updated.");
      setCurrent("");
      setNext("");
      setConfirm("");
      setBusy(false);
    }, 700);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl p-6 space-y-5"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "10px",
            color: "rgba(176,196,222,0.4)",
            letterSpacing: "0.08em",
            marginBottom: "6px",
          }}
        >
          SECURITY
        </div>
        <h2 style={{ color: "#F0F6FF", fontSize: "1.15rem" }}>Change password</h2>
      </div>

      {[
        { label: "Current password", value: current, set: setCurrent },
        { label: "New password", value: next, set: setNext },
        { label: "Confirm new password", value: confirm, set: setConfirm },
      ].map((field) => (
        <label key={field.label} className="block">
          <span className="block mb-1.5 text-sm" style={{ color: "rgba(176,196,222,0.8)" }}>
            {field.label}
          </span>
          <input
            type="password"
            value={field.value}
            onChange={(e) => field.set(e.target.value)}
            className="w-full rounded-xl px-4 py-3"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#F0F6FF",
            }}
          />
        </label>
      ))}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-3 transition-opacity disabled:opacity-60"
        style={{
          background: "linear-gradient(135deg, #0F6E56, #12A37B)",
          color: "white",
          fontWeight: 600,
        }}
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
        Update password
      </button>
    </form>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState({
    scanComplete: true,
    paymentReceipts: true,
    weeklyDigest: false,
    productUpdates: true,
  });

  const toggle = (key: keyof typeof prefs) => {
    setPrefs((current) => ({ ...current, [key]: !current[key] }));
    toast.success("Preference saved.");
  };

  const items = [
    { key: "scanComplete" as const, label: "Scan complete", description: "Email me when a verification finishes." },
    { key: "paymentReceipts" as const, label: "Payment receipts", description: "Send receipts for every Squad payment." },
    { key: "weeklyDigest" as const, label: "Weekly digest", description: "A summary of activity every Monday." },
    { key: "productUpdates" as const, label: "Product updates", description: "Occasional emails about new features." },
  ];

  return (
    <div
      className="rounded-3xl p-6"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <div className="mb-5">
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "10px",
            color: "rgba(176,196,222,0.4)",
            letterSpacing: "0.08em",
            marginBottom: "6px",
          }}
        >
          NOTIFICATIONS
        </div>
        <h2 style={{ color: "#F0F6FF", fontSize: "1.15rem" }}>Email preferences</h2>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4 rounded-2xl p-4"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div>
              <div style={{ color: "#F0F6FF", fontSize: "13px", fontWeight: 600 }}>{item.label}</div>
              <div style={{ color: "rgba(176,196,222,0.6)", fontSize: "12px", marginTop: "2px" }}>
                {item.description}
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggle(item.key)}
              role="switch"
              aria-checked={prefs[item.key]}
              style={{
                width: "44px",
                height: "24px",
                borderRadius: "999px",
                background: prefs[item.key] ? "#12A37B" : "rgba(255,255,255,0.08)",
                border: "none",
                position: "relative",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: "3px",
                  left: prefs[item.key] ? "22px" : "3px",
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  background: "white",
                  transition: "left 0.2s",
                }}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanTab() {
  const { user } = useAuth();
  const info = PLAN_INFO[user?.plan ?? "FREE"];

  return (
    <div className="space-y-4">
      <div
        className="rounded-3xl p-6"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "10px",
                color: "rgba(176,196,222,0.4)",
                letterSpacing: "0.08em",
              }}
            >
              CURRENT PLAN
            </div>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#F0F6FF",
                fontSize: "1.6rem",
                marginTop: "4px",
              }}
            >
              {info.label}
            </h2>
            <div style={{ color: "#12A37B", fontSize: "13px", marginTop: "4px" }}>{info.price}</div>
          </div>
          <CreditCard size={18} color="#12A37B" />
        </div>

        <div className="space-y-2 mb-5">
          {info.perks.map((perk) => (
            <div key={perk} style={{ color: "rgba(176,196,222,0.72)", fontSize: "13px" }}>
              • {perk}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 no-underline"
            style={{
              background: "linear-gradient(135deg, #0F6E56, #12A37B)",
              color: "white",
              fontWeight: 600,
            }}
          >
            Change plan
          </Link>
          {user?.plan !== "FREE" && (
            <Link
              to="/billing"
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 no-underline"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#F0F6FF",
              }}
            >
              View billing
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}