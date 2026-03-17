import { Toaster } from "@/components/ui/sonner";
import {
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "next-themes";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";

// Create root route
const rootRoute = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const { identity, isInitializing } = useInternetIdentity();

  const isAuthenticated = !!identity;

  // Show loading state during initialization
  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  // Show dashboard if authenticated
  if (isAuthenticated) {
    return <Dashboard />;
  }

  return <LoginPage />;
}

// Create login route
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

// Create index route
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: RootComponent,
});

// Create router
const routeTree = rootRoute.addChildren([indexRoute, loginRoute]);
const router = createRouter({ routeTree });

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}
