import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

/**
 * Root authenticated layout: sidebar + main content area.
 * TopNav is rendered per-page so each page can pass its own title/actions.
 */
export function AppShell() {
  return (
    <div className="flex h-dvh overflow-hidden bg-surface-app">
      {/* Sidebar — hidden on mobile, always visible md+ */}
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
