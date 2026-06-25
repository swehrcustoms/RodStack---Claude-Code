import Link from 'next/link'
import { Fish, Wrench, Archive, DollarSign, ArrowRight } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-400">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-amber-500">
              <Fish className="h-4.5 w-4.5 text-slate-900" aria-hidden="true" />
            </div>
            <span className="text-sm font-semibold text-slate-50">RodStack</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm text-slate-400 hover:text-slate-50 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-amber-400 transition-colors"
            >
              Get started
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-500 mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
          Now in V2 — rebuilt from scratch
        </div>

        <h1 className="text-4xl sm:text-5xl font-semibold text-slate-50 leading-tight mb-6">
          The operating system
          <br />
          for rod builders.
        </h1>

        <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
          Plan builds. Track inventory. Calculate costs. Manage every custom rod from blank
          to finished product — with precision.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-6 py-3 text-base font-semibold text-slate-900 hover:bg-amber-400 transition-colors"
          >
            Start building free
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-800 px-6 py-3 text-base font-medium text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Sign in
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Wrench,
              title: 'Rod Builder',
              desc: 'Spec out builds with length, power, action, material, and guide estimates calculated automatically.',
            },
            {
              icon: Fish,
              title: 'Saved Builds',
              desc: 'Every build saved, searchable, and ready to revisit. Your complete build history in one place.',
            },
            {
              icon: Archive,
              title: 'Inventory',
              desc: 'Track blanks, guides, thread, reel seats, and hardware with quantity and cost per unit.',
            },
            {
              icon: DollarSign,
              title: 'Costing',
              desc: 'Know your numbers. Parts + labor estimates help you price builds accurately.',
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-lg border border-slate-800 bg-slate-800/50 p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Icon className="h-5 w-5 text-amber-500" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-slate-100 mb-2">{title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between">
          <p className="text-xs text-slate-600">© {new Date().getFullYear()} RodStack V2</p>
          <p className="text-xs text-slate-600">Built for serious rod builders.</p>
        </div>
      </footer>
    </div>
  )
}
