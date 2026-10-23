import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "@tutorpal/ui/sonner";
import { RouteNotFound } from "@/components/route-fallback";
import { TooltipProvider } from "@tutorpal/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 5 minutes
    },
  },
});

export const Route = createRootRoute({
  component: () => (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Outlet />
        </TooltipProvider>
      </QueryClientProvider>
      <Toaster duration={3000} />
    </AuthProvider>
  ),
  notFoundComponent: RouteNotFound,
});
