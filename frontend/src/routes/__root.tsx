import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Toaster } from "sonner";
import { AuthProvider } from "@/contexts/auth-context";
import { ENV } from "@/lib/env";

// Create a client
const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: () => (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
      <Toaster />
      {ENV.IS_DEV && <TanStackRouterDevtools />}
    </AuthProvider>
  ),
});
