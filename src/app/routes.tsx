import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { PlanRoute } from "./components/PlanRoute";
import { LandingPage } from "./pages/LandingPage";
import { VerifyPage } from "./pages/VerifyPage";
import { DashboardPage } from "./pages/DashboardPage";
import { ResultDetailPage } from "./pages/ResultDetailPage";
import { PricingPage } from "./pages/PricingPage";
import { PrivacyPage } from "./pages/PrivacyPage";
import { TermsPage } from "./pages/TermsPage";
import { BillingSettingsPage } from "./pages/BillingSettingsPage";
import { WalletPage } from "./pages/WalletPage";
import { TeamPage } from "./pages/TeamPage";
import { BulkUploadPage } from "./pages/BulkUploadPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { SettingsPage } from "./pages/SettingsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import AuthPage from "./pages/AuthPage";
import { AdminOverviewPage } from "./pages/admin/AdminOverviewPage";
import { AdminRetrainPage } from "./pages/admin/AdminRetrainPage";
import { AdminScansPage } from "./pages/admin/AdminScansPage";
import { AdminTrainingPage } from "./pages/admin/AdminTrainingPage";
import { AdminRefundsPage } from "./pages/admin/AdminRefundsPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      // Public
      { index: true, Component: LandingPage },
      { path: "onboarding", Component: OnboardingPage },
      { path: "privacy", Component: PrivacyPage },
      { path: "terms", Component: TermsPage },
      { path: "pricing", Component: PricingPage },
      { path: "auth", Component: AuthPage },

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
        path: "verify",
        element: (
          <ProtectedRoute>
            <VerifyPage />
          </ProtectedRoute>
        )
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
        path: "admin",
        element: (
          <AdminRoute>
            <AdminOverviewPage />
          </AdminRoute>
        ),
      },
      {
        path: "admin/training",
        element: (
          <AdminRoute>
            <AdminTrainingPage />
          </AdminRoute>
        ),
      },
      {
        path: "admin/retrain",
        element: (
          <AdminRoute>
            <AdminRetrainPage />
          </AdminRoute>
        ),
      },
      {
        path: "admin/users",
        element: (
          <AdminRoute>
            <AdminUsersPage />
          </AdminRoute>
        ),
      },
      {
        path: "admin/scans",
        element: (
          <AdminRoute>
            <AdminScansPage />
          </AdminRoute>
        ),
      },
      {
        path: "admin/refunds",
        element: (
          <AdminRoute>
            <AdminRefundsPage />
          </AdminRoute>
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