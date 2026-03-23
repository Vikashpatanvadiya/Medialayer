import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { setupFetchInterceptor } from "./lib/fetch-interceptor";
import { useAuth } from "./hooks/use-auth";
import { Loader2 } from "lucide-react";

// Pages
import LandingPage from "./pages/landing";
import AuthPage from "./pages/auth";
import { DashboardLayout } from "./components/layout/dashboard-layout";
import EditorDashboard from "./pages/editor/dashboard";
import AllSubmissions from "./pages/editor/all-submissions";
import CreatorDashboard from "./pages/creator/dashboard";
import MyEditors from "./pages/creator/my-editors";
import AllVideos from "./pages/creator/all-videos";
import VideoDetail from "./pages/video-detail";
import NotFound from "@/pages/not-found";

// Initialize the global fetch interceptor once
setupFetchInterceptor();

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
        {!isLoading && user ? (
          <ProtectedRoute>
            {user.role === 'creator' ? <CreatorDashboard /> : <EditorDashboard />}
          </ProtectedRoute>
        ) : (
          <LandingPage />
        )}
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
      <Route path="/dashboard/creator">
        <ProtectedRoute allowedRole="creator" component={CreatorDashboard} />
      </Route>
      <Route path="/dashboard/creator/editors">
        <ProtectedRoute allowedRole="creator" component={MyEditors} />
      </Route>
      <Route path="/dashboard/creator/videos">
        <ProtectedRoute allowedRole="creator" component={AllVideos} />
      </Route>
      
      {/* Video Detail (accessible by both, API handles authorization logic) */}
      <Route path="/dashboard/:role/video/:id">
        <ProtectedRoute>
          <VideoDetail />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
