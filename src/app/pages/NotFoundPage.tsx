import { Link, useNavigate } from "react-router";
import { ArrowLeft, Home, Search } from "lucide-react";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pt-16 px-6 md:px-10 py-12 flex items-center">
      <div className="max-w-2xl mx-auto text-center w-full">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.22)" }}
        >
          <Search size={14} color="#EF4444" />
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "10px",
              color: "#EF4444",
              letterSpacing: "0.08em",
            }}
          >
            404 NOT FOUND
          </span>
        </div>
        <div
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(4rem, 12vw, 7rem)",
            color: "#12A37B",
            lineHeight: 1,
            marginBottom: "12px",
            opacity: 0.85,
          }}
        >
          404
        </div>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(1.6rem, 4vw, 2.4rem)",
            color: "#F0F6FF",
            lineHeight: 1.1,
            marginBottom: "14px",
          }}
        >
          We couldn't find that page
        </h1>
        <p style={{ color: "rgba(176,196,222,0.7)", lineHeight: 1.7, maxWidth: "48ch", margin: "0 auto 32px" }}>
          The page you're looking for doesn't exist or has been moved. Check the URL or use one of the links below.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#F0F6FF",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={16} />
            Go back
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 no-underline"
            style={{ background: "linear-gradient(135deg, #0F6E56, #12A37B)", color: "white", fontWeight: 600 }}
          >
            <Home size={16} />
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}