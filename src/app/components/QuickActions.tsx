import React from "react";
import { Upload, FileText, Users, DollarSign } from "lucide-react";

export default function QuickActions({ onUpload, onBulk, onExport, onInvite, onTopup }: {
  onUpload: () => void;
  onBulk: () => void;
  onExport: () => void;
  onInvite: () => void;
  onTopup: () => void;
}) {
  return (
    <div className="rounded-3xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "rgba(176,196,222,0.38)", letterSpacing: "0.08em" }}>QUICK ACTIONS</div>
          <div style={{ color: "#F0F6FF", marginTop: 6, fontWeight: 600 }}>Common tasks</div>
        </div>
        <div style={{ color: "rgba(176,196,222,0.6)", fontSize: 13 }}>Fast shortcuts</div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button onClick={onUpload} className="py-2 px-3 rounded-lg inline-flex items-center gap-2" style={{ background: "linear-gradient(135deg, #0F6E56, #12A37B)", color: "white", fontWeight: 600 }}>
          <Upload size={14} /> Upload
        </button>

        <button onClick={onBulk} className="py-2 px-3 rounded-lg inline-flex items-center gap-2" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(176,196,222,0.9)" }}>
          <FileText size={14} /> Bulk upload
        </button>

        <button onClick={onExport} className="py-2 px-3 rounded-lg inline-flex items-center gap-2" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(176,196,222,0.9)" }}>
          <FileText size={14} /> Export CSV
        </button>

        <button onClick={onInvite} className="py-2 px-3 rounded-lg inline-flex items-center gap-2" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(176,196,222,0.9)" }}>
          <Users size={14} /> Invite team
        </button>

        <button onClick={onTopup} className="py-2 px-3 rounded-lg inline-flex items-center gap-2" style={{ background: "rgba(18,163,123,0.08)", color: "#12A37B", fontWeight: 600 }}>
          <DollarSign size={14} /> Top up
        </button>
      </div>
    </div>
  );
}
