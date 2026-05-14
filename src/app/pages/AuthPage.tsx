import { FormEvent, useState } from "react";
import { Link } from "react-router";
import { ShieldCheck, LogIn, Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export function AuthPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError(null);

    try {
      if (mode === "signin") {
        await login({ email: authForm.email, password: authForm.password });
        toast.success("Signed in successfully");
      } else {
        await signup({ name: authForm.name, email: authForm.email, password: authForm.password });
        toast.success("Account created successfully");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed.";
      setAuthError(message);
      toast.error(message);
    } finally {
      setAuthBusy(false);
    }
  };

  return (
    <div className="min-h-screen pt-26 px-6 md:px-10 py-10">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
        <div className="rounded-3xl p-8 md:p-10" style={{ background: "linear-gradient(160deg, rgba(15,110,86,0.14), rgba(255,255,255,0.03))", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5" style={{ background: "rgba(18,163,123,0.12)", border: "1px solid rgba(18,163,123,0.28)" }}>
            <ShieldCheck size={14} color="#12A37B" />
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "#12A37B", letterSpacing: "0.08em" }}>SECURE VERIFICATION FLOW</span>
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 5vw, 3.2rem)", color: "#F0F6FF", lineHeight: 1.1, marginBottom: "14px" }}>
            Authenticate to access your workspace
          </h1>
          <p style={{ color: "rgba(176,196,222,0.72)", lineHeight: 1.75, maxWidth: "62ch" }}>
            Sign in or create an account to upload certificates, manage your wallet and view verification results. Authentication is required to protect sensitive data.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mt-8">
            {[
              { title: "Upload", text: "Send PDF, PNG, JPG certificates securely to the backend." },
              { title: "Pay", text: "Initialize Squad checkout when a scan requires payment." },
              { title: "Track", text: "Follow scan status, wallet balance, and result history." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ color: "#F0F6FF", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>{item.title}</div>
                <div style={{ color: "rgba(176,196,222,0.55)", fontSize: "12px", lineHeight: "1.6" }}>{item.text}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl p-6 md:p-8" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.4)", letterSpacing: "0.08em" }}>AUTHENTICATION</div>
              <h2 style={{ fontFamily: "'IBM Plex Sans', sans-serif", color: "#F0F6FF", fontSize: "1.2rem", marginTop: "4px" }}>{mode === "signin" ? "Welcome back" : "Create your workspace"}</h2>
            </div>
            <div className="inline-flex rounded-xl p-1" style={{ background: "rgba(255,255,255,0.04)" }}>
              {(["signin", "signup"] as const).map((item) => (
                <button key={item} type="button" onClick={() => setMode(item)} className="px-3 py-1.5 rounded-lg" style={{ background: mode === item ? "rgba(18,163,123,0.16)" : "transparent", color: mode === item ? "#12A37B" : "rgba(176,196,222,0.7)", border: "none", fontSize: "12px" }}>
                  {item === "signin" ? "Sign in" : "Sign up"}
                </button>
              ))}
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleAuthSubmit}>
            {mode === "signup" && (
              <label className="block">
                <span className="block mb-1 text-sm" style={{ color: "rgba(176,196,222,0.8)" }}>Organization name</span>
                <input value={authForm.name} onChange={(event) => setAuthForm((current) => ({ ...current, name: event.target.value }))} className="w-full rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F0F6FF" }} placeholder="Adaeze Nwosu" required />
              </label>
            )}
            <label className="block">
              <span className="block mb-1 text-sm" style={{ color: "rgba(176,196,222,0.8)" }}>Email</span>
              <input value={authForm.email} onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))} type="email" className="w-full rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F0F6FF" }} placeholder="you@company.com" required />
            </label>
            <label className="block">
              <span className="block mb-1 text-sm" style={{ color: "rgba(176,196,222,0.8)" }}>Password</span>
              <div style={{ position: "relative" }}>
                <input
                  value={authForm.password}
                  onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-xl px-4 py-3"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F0F6FF", paddingRight: 44 }}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  style={{
                    position: "absolute",
                    right: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    padding: 6,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "rgba(176,196,222,0.7)",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {authError && (
              <div className="flex items-start gap-2 rounded-xl px-4 py-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)" }}>
                <ShieldCheck size={16} color="#EF4444" className="mt-0.5" />
                <p className="m-0 text-sm" style={{ color: "rgba(255,255,255,0.82)" }}>{authError}</p>
              </div>
            )}

            <button type="submit" disabled={authBusy} className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 transition-opacity disabled:opacity-60" style={{ background: "linear-gradient(135deg, #0F6E56, #12A37B)", color: "white", fontWeight: 600 }}>
              {authBusy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />}
              {mode === "signin" ? "Sign in and continue" : "Create account"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

export default AuthPage;
