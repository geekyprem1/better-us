import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-aurora px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 font-extrabold text-xl">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">❤</span>
          Better<span className="text-brand-600">Us</span>
        </Link>
        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-xl">
          <h1 className="text-center text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-center text-sm text-slate-500">
            Log in or create an account to see your results.
          </p>
          <Suspense fallback={<div className="mt-8 h-40 animate-pulse rounded-xl bg-slate-50" />}>
            <LoginForm />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          By continuing you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
