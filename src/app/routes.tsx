import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
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

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: LandingPage },
      { path: "onboarding", Component: OnboardingPage },
      { path: "pricing", Component: PricingPage },
      { path: "verify", Component: VerifyPage },
      { path: "dashboard", Component: DashboardPage },
      { path: "billing", Component: BillingSettingsPage },
      { path: "wallet", Component: WalletPage },
      { path: "team", Component: TeamPage },
      { path: "bulk", Component: BulkUploadPage },
      { path: "results/:id", Component: ResultDetailPage },
    ],
  },
]);
