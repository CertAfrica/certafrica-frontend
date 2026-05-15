import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Users, Mail, Loader2 } from "lucide-react";
import { api } from "../lib/api";

export function TeamPage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"OWNER" | "ADMIN" | "REVIEWER">("REVIEWER");
  const [busy, setBusy] = useState(false);

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;
    setBusy(true);
    try {
      await api.inviteTeamMember({ email, role });
      toast.success(`Invitation sent to ${email}.`);
      setEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to invite team member.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen pt-16 px-6 md:px-10 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div style={{ color: "rgba(176,196,222,0.5)", fontSize: "11px", letterSpacing: "0.08em" }}>
            TEAM
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "#F0F6FF",
              fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
            }}
          >
            Team management
          </h1>
          <p style={{ color: "rgba(176,196,222,0.7)", marginTop: "10px" }}>
            Invite reviewers to verify documents and manage scans for your organization.
          </p>
        </div>

        <div
          className="rounded-3xl p-6"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "10px",
                  color: "rgba(176,196,222,0.38)",
                  letterSpacing: "0.08em",
                }}
              >
                INVITE A MEMBER
              </div>
              <div style={{ color: "#F0F6FF", marginTop: "4px" }}>Send an email invitation</div>
            </div>
            <Users size={16} color="#12A37B" />
          </div>

          <form onSubmit={handleInvite} className="space-y-4">
            <label className="block">
              <span className="block mb-1.5 text-sm" style={{ color: "rgba(176,196,222,0.8)" }}>
                Email address
              </span>
              <div
                className="flex items-center gap-2 rounded-xl px-4 py-3"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Mail size={14} color="rgba(176,196,222,0.5)" />
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  className="flex-1 bg-transparent outline-none"
                  style={{ color: "#F0F6FF", fontSize: "14px" }}
                  placeholder="reviewer@company.com"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="block mb-1.5 text-sm" style={{ color: "rgba(176,196,222,0.8)" }}>
                Role
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(["REVIEWER", "ADMIN", "OWNER"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRole(option)}
                    className="rounded-xl py-3 text-sm"
                    style={{
                      background: role === option ? "rgba(18,163,123,0.12)" : "rgba(255,255,255,0.04)",
                      border:
                        role === option
                          ? "1px solid rgba(18,163,123,0.3)"
                          : "1px solid rgba(255,255,255,0.06)",
                      color: role === option ? "#12A37B" : "rgba(176,196,222,0.78)",
                      cursor: "pointer",
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <div style={{ color: "rgba(176,196,222,0.55)", fontSize: "11px", marginTop: "6px" }}>
                {role === "REVIEWER" && "Can review scans only."}
                {role === "ADMIN" && "Can manage scans and invite reviewers."}
                {role === "OWNER" && "Full access including billing and team."}
              </div>
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
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              Send invitation
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}