import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-soft">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-extrabold">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-white">❤</span>
            Better<span className="text-brand-600">Us</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-slate-500">
            The Relationship Operating System for modern couples. Powered by the BetterUs
            Relationship Intelligence Engine™.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Product</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link href="/assessment" className="hover:text-slate-900">Assessment</Link></li>
            <li><Link href="/pricing" className="hover:text-slate-900">Pricing</Link></li>
            <li><Link href="/coach" className="hover:text-slate-900">AI Coach</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Company</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link href="/#how" className="hover:text-slate-900">How it works</Link></li>
            <li><Link href="/#faq" className="hover:text-slate-900">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Legal</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link href="#" className="hover:text-slate-900">Privacy</Link></li>
            <li><Link href="#" className="hover:text-slate-900">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} BetterUs. Not a substitute for professional therapy or crisis
        services.
      </div>
    </footer>
  );
}
