import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = "/verify" }: ProtectedRouteProps) {
  const { status, isAuthenticated } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return (
      <div className="min-h-[calc(100vh-64px)] pt-16 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-3 animate-spin" size={28} color="#12A37B" />
          <p style={{ color: "rgba(176,196,222,0.7)", fontSize: "13px" }}>Loading workspace…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}