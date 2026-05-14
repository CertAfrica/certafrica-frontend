import { Outlet } from "react-router";
import { Toaster } from "sonner";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";

function Shell() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: "#08111E", fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <Navbar />
      {isAuthenticated ? <Sidebar /> : null}
      <main className={isAuthenticated ? "md:pl-64" : ""}>
        <Outlet />
      </main>
      <Toaster richColors position="top-right" />
    </div>
  );
}

export function Root() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
