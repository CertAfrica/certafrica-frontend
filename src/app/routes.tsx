import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { LandingPage } from "./pages/LandingPage";
import { VerifyPage } from "./pages/VerifyPage";
import { DashboardPage } from "./pages/DashboardPage";
import { FreeDashboardPage } from "./pages/free/DashboardPage";
import { StarterDashboardPage } from "./pages/starter/DashboardPage";
import { ProDashboardPage } from "./pages/pro/DashboardPage";
import { ResultDetailPage } from "./pages/ResultDetailPage";
import { PricingPage } from "./pages/PricingPage";
import { BillingSettingsPage } from "./pages/BillingSettingsPage";
import { WalletPage } from "./pages/WalletPage";
import { TeamPage } from "./pages/TeamPage";
import { BulkUploadPage } from "./pages/BulkUploadPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { AuthPage } from "./pages/AuthPage";
import { AccountPage } from "./pages/Account";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: LandingPage },
      { path: "onboarding", Component: OnboardingPage },
      { path: "pricing", Component: PricingPage },
      { path: "verify", Component: VerifyPage },
      { path: "auth", Component: AuthPage },
      { path: "dashboard", Component: DashboardPage },
      { path: "free/dashboard", Component: FreeDashboardPage },
      { path: "starter/dashboard", Component: StarterDashboardPage },
      { path: "pro/dashboard", Component: ProDashboardPage },
      { path: "billing", Component: BillingSettingsPage },
      { path: "wallet", Component: WalletPage },
      { path: "account", Component: AccountPage },
      { path: "team", Component: TeamPage },
      { path: "bulk", Component: BulkUploadPage },
      { path: "results/:id", Component: ResultDetailPage },
    ],
  },
]);
