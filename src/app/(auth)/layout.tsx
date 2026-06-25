import Link from 'next/link'
import { Fish } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Top bar */}
      <div className="flex h-14 items-center px-8 border-b border-slate-800 shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-amber-500">
            <Fish className="h-4 w-4 text-slate-900" aria-hidden="true" />
          </div>
          <span className="text-sm font-semibold text-slate-50">RodStack</span>
        </Link>
      </div>

      {/* Centered content */}
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  )
}
