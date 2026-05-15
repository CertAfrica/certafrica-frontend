import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PlanRoute } from "./components/PlanRoute";
import { LandingPage } from "./pages/LandingPage";
import { VerifyPage } from "./pages/VerifyPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ResultDetailPage } from "./pages/ResultDetailPage";
import { PricingPage } from "./pages/PricingPage";
import { BillingSettingsPage } from "./pages/BillingSettingsPage";
import { WalletPage } from "./pages/WalletPage";
import { TeamPage } from "./pages/TeamPage";
import { BulkUploadPage } from "./pages/BulkUploadPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { SettingsPage } from "./pages/SettingsPage";
import { NotFoundPage } from "./pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      // Public
      { index: true, Component: LandingPage },
      { path: "onboarding", Component: OnboardingPage },
      { path: "pricing", Component: PricingPage },
      { path: "verify", Component: VerifyPage },

      // Authenticated
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "settings",
        element: (
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "results/:id",
        element: (
          <ProtectedRoute>
            <ResultDetailPage />
          </ProtectedRoute>
        ),
      },

      // Plan-gated
      {
        path: "wallet",
        element: (
          <ProtectedRoute>
            <PlanRoute
              allow={["STARTER", "PRO"]}
              title="Wallet is for paid plans"
              description="Top-ups, transaction history, and auto-deduct scan fees are available on Starter and Pro."
            >
              <WalletPage />
            </PlanRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: "billing",
        element: (
          <ProtectedRoute>
            <PlanRoute
              allow={["STARTER", "PRO"]}
              title="Billing is for paid plans"
              description="Subscription billing history shows once you upgrade."
            >
              <BillingSettingsPage />
            </PlanRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: "team",
        element: (
          <ProtectedRoute>
            <PlanRoute
              allow={["PRO"]}
              title="Team tools are Pro only"
              description="Invite members, assign roles, and review org-wide scans from the Pro plan."
            >
              <TeamPage />
            </PlanRoute>
          </ProtectedRoute>
        ),
      },
      {
        path: "bulk",
        element: (
          <ProtectedRoute>
            <PlanRoute
              allow={["PRO"]}
              title="Bulk verify is Pro only"
              description="Bulk pricing, queue priority, and batch verification require the Pro plan."
            >
              <BulkUploadPage />
            </PlanRoute>
          </ProtectedRoute>
        ),
      },

      // 404
      { path: "*", Component: NotFoundPage },
    ],
  },
]);