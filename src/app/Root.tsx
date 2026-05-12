import { Outlet } from "react-router";
import { Toaster } from "sonner";
import { Navbar } from "./components/Navbar";
import { AuthProvider } from "./context/AuthContext";

export function Root() {
  return (
    <AuthProvider>
      <div className="min-h-screen" style={{ background: "#08111E", fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <Navbar />
        <Outlet />
        <Toaster richColors position="top-right" />
      </div>
    </AuthProvider>
  );
}
