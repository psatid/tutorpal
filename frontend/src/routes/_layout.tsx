import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TopAppBar } from "@/components/layout/top-app-bar";
import { BottomNav } from "@/components/layout/bottom-nav";

export const Route = createFileRoute("/_layout")({
  component: LayoutRoute,
});

function LayoutRoute() {
  return (
    <div className="min-h-dvh bg-surface flex flex-col">
      <TopAppBar />
      <main className="p-4 grow shrink">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
