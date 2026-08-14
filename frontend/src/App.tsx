import { lazy, Suspense, useEffect, useMemo } from "react";
import { Switch, Route, Redirect, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PwaManager } from "@/components/pwa/pwa-manager";
import { setupFetchInterceptor } from "./lib/fetch-interceptor";
import { useAuth } from "./hooks/use-auth";
import { Loader2 } from "lucide-react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";
import "@solana/wallet-adapter-react-ui/styles.css";

// Pages
import LandingPage from "./pages/landing";
import AuthPage from "./pages/auth";
import { DashboardLayout } from "./components/layout/dashboard-layout";
import EditorDashboard from "./pages/editor/dashboard";
import AllSubmissions from "./pages/editor/all-submissions";
import MyCreators from "./pages/editor/my-creators";
import CreatorDashboard from "./pages/creator/dashboard";
import MyEditors from "./pages/creator/my-editors";
import AllVideos from "./pages/creator/all-videos";
import VideoDetail from "./pages/video-detail";
import NotFound from "@/pages/not-found";
import PrivacyPolicy from "@/pages/privacy";
import TermsOfService from "@/pages/terms";
import ProfilePage from "./pages/profile";
import NotificationsPage from "./pages/notifications";
import DesignSystemPage from "./pages/design-system";
import GoogleAuthSuccess from "@/pages/auth-google-success";
import CheckoutPage from "@/pages/checkout";
import MobileOnboarding, { hasOnboarded } from "@/pages/mobile/onboarding";
import { AppSplash } from "@/components/layout/app-splash";
import { useMobileApp } from "@/hooks/use-mobile-app";
import { usePwa } from "@/components/pwa/use-pwa";

// Initialize the global fetch interceptor once
setupFetchInterceptor();

const AgentationDev = import.meta.env.DEV
  ? lazy(() =>
      import("./components/AgentationDev").then((m) => ({ default: m.AgentationDev }))
    )
  : null;

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, allowedRole, children }: { component?: any, allowedRole?: 'creator' | 'editor', children?: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    } else if (!isLoading && user && allowedRole && user.role !== allowedRole) {
      setLocation(`/dashboard/${user.role}`);
    }
  }, [user, isLoading, setLocation, allowedRole]);

  if (isLoading) return <div className="h-screen w-full flex items-center justify-center bg-background"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  if (!user) return null;
  if (allowedRole && user.role !== allowedRole) return null;

  return (
    <DashboardLayout>
      {Component ? <Component /> : children}
    </DashboardLayout>
  );
}

/**
 * What "/" means depends on how MediaLayer was opened. On a phone, or in the
 * installed app, it behaves like an app — first run shows onboarding, later runs
 * go straight to sign-in. Desktop browsers (and crawlers) get the marketing site.
 */
function RootEntry() {
  const { user, isLoading } = useAuth();
  const mobileApp = useMobileApp();
  const { isStandalone } = usePwa();
  const appMode = mobileApp || isStandalone;

  const dashboard = (
    <ProtectedRoute>
      {user?.role === "creator" ? <CreatorDashboard /> : <EditorDashboard />}
    </ProtectedRoute>
  );

  if (!appMode) {
    return !isLoading && user ? dashboard : <LandingPage />;
  }

  if (isLoading) return <AppSplash />;
  if (user) return dashboard;

  // Onboarding is a phone experience; a desktop app window opens on sign-in.
  return mobileApp && !hasOnboarded() ? <MobileOnboarding /> : <Redirect to="/login" />;
}

function Router() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  // Redirect root to dashboard if logged in
  useEffect(() => {
    if (!isLoading && user && location === '/') {
      // Intentionally don't do this with wouter's generic redirect to avoid flash
    }
  }, [user, isLoading, location]);

  return (
    <Switch>
      <Route path="/">
        <RootEntry />
      </Route>
      
      <Route path="/login">
        <AuthPage mode="login" />
      </Route>
      <Route path="/register">
        <AuthPage mode="register" />
      </Route>

      <Route path="/dashboard/editor">
        <ProtectedRoute allowedRole="editor" component={EditorDashboard} />
      </Route>
      <Route path="/dashboard/editor/submissions">
        <ProtectedRoute allowedRole="editor" component={AllSubmissions} />
      </Route>
      <Route path="/dashboard/editor/creators">
        <ProtectedRoute allowedRole="editor" component={MyCreators} />
      </Route>
      <Route path="/dashboard/creator">
        <ProtectedRoute allowedRole="creator" component={CreatorDashboard} />
      </Route>
      <Route path="/dashboard/creator/editors">
        <ProtectedRoute allowedRole="creator" component={MyEditors} />
      </Route>
      <Route path="/dashboard/creator/videos">
        <ProtectedRoute allowedRole="creator" component={AllVideos} />
      </Route>
      
      <Route path="/dashboard/profile">
        <ProtectedRoute component={ProfilePage} />
      </Route>

      <Route path="/dashboard/notifications">
        <ProtectedRoute component={NotificationsPage} />
      </Route>

      <Route path="/dashboard/design-system">
        <ProtectedRoute component={DesignSystemPage} />
      </Route>

      {/* Video Detail */}
      <Route path="/dashboard/:role/video/:id">
        <ProtectedRoute>
          <VideoDetail />
        </ProtectedRoute>
      </Route>

      <Route path="/auth/google/success">
        <GoogleAuthSuccess />
      </Route>

      <Route path="/privacy">
        <PrivacyPolicy />
      </Route>

      <Route path="/terms">
        <TermsOfService />
      </Route>

      <Route path="/checkout">
        <CheckoutPage />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <WouterRouter>
                <Router />
              </WouterRouter>
              <Toaster />
              <PwaManager />
              {AgentationDev && (
                <Suspense fallback={null}>
                  <AgentationDev />
                </Suspense>
              )}
            </TooltipProvider>
          </QueryClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
