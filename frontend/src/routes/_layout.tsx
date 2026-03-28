import { createFileRoute, Outlet } from '@tanstack/react-router'
import { TopAppBar } from '@/components/layout/TopAppBar'
import { BottomNav } from '@/components/layout/BottomNav'

export const Route = createFileRoute('/_layout')({
  component: LayoutRoute,
})

function LayoutRoute() {
  return (
    <div className="min-h-screen bg-surface">
      <TopAppBar />
      <main className="pt-[72px] pb-28 px-6">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
