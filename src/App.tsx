import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import Dashboard from '@/pages/Dashboard'
import RodBuilder from '@/pages/RodBuilder'

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col h-full items-center justify-center text-center gap-3 p-8">
      <p className="text-2xl font-bold text-text-primary">{title}</p>
      <p className="text-sm text-text-secondary">Coming soon — check the roadmap.</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="rods/build" element={<RodBuilder />} />
          <Route path="rods" element={<PlaceholderPage title="My Rods" />} />
          <Route path="components" element={<PlaceholderPage title="Components" />} />
          <Route path="orders" element={<PlaceholderPage title="Orders" />} />
          <Route path="team" element={<PlaceholderPage title="Team" />} />
          <Route path="settings" element={<PlaceholderPage title="Settings" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
