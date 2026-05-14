import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { api } from "../lib/api";
import { PlanGate } from "../components/PlanGate";

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
      toast.success("Invitation sent.");
      setEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to invite team member.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PlanGate
      allow={['PRO']}
      title="Team tools are Pro only"
      description="Invite members, assign roles, and review org-wide scans from the Pro plan."
    >
    <div className="min-h-screen pt-16 px-6 md:px-10 py-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <div style={{ color: "rgba(176,196,222,0.5)", fontSize: "11px", letterSpacing: "0.08em" }}>TEAM</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", color: "#F0F6FF", fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>Team management</h1>
        </div>

        <div className="rounded-3xl p-6" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: "10px", color: "rgba(176,196,222,0.38)", letterSpacing: "0.08em" }}>INVITE</div>
              <div style={{ color: "#F0F6FF", marginTop: "4px" }}>Add reviewers to your organization</div>
            </div>
            <Users size={16} color="#12A37B" />
          </div>

          <form onSubmit={handleInvite} className="space-y-3">
            <label className="block">
              <span className="block mb-1 text-sm" style={{ color: "rgba(176,196,222,0.8)" }}>Email</span>
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="w-full rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F0F6FF" }} placeholder="reviewer@company.com" required />
            </label>
            <label className="block">
              <span className="block mb-1 text-sm" style={{ color: "rgba(176,196,222,0.8)" }}>Role</span>
              <select value={role} onChange={(event) => setRole(event.target.value as "OWNER" | "ADMIN" | "REVIEWER")} className="w-full rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#F0F6FF" }}>
                <option value="OWNER">Owner</option>
                <option value="ADMIN">Admin</option>
                <option value="REVIEWER">Reviewer</option>
              </select>
            </label>
            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 transition-opacity disabled:opacity-60" style={{ background: "linear-gradient(135deg, #0F6E56, #12A37B)", color: "white", fontWeight: 600 }}>
              {busy ? "Sending…" : "Send invite"}
            </button>
          </form>
        </div>
      </div>
    </div>
    </PlanGate>
  );
}
