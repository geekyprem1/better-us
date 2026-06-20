import Link from "next/link";
import { getOptionalUser } from "@/lib/supabase/server";
import { LogoutButton } from "./LogoutButton";

// Pass `user` from the page to avoid a duplicate auth round-trip; if omitted,
// the navbar resolves it itself (used on public pages).
export async function Navbar({ user: providedUser }: { user?: { id: string } | null } = {}) {
  const user = providedUser !== undefined ? providedUser : await getOptionalUser();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-lg tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
            ❤
          </span>
          <span>Better<span className="text-brand-600">Us</span></span>
        </Link>

        <div className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
          <Link href="/#how" className="hover:text-slate-900">How it works</Link>
          <Link href="/pricing" className="hover:text-slate-900">Pricing</Link>
          <Link href="/#faq" className="hover:text-slate-900">FAQ</Link>
          {user && <Link href="/dashboard" className="hover:text-slate-900">Dashboard</Link>}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 sm:block"
              >
                Dashboard
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900"
              >
                Log in
              </Link>
              <Link
                href="/assessment"
                className="rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
              >
                Take Free Assessment
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
