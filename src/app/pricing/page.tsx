import { getOptionalUser } from "@/lib/supabase/server";
import { isPremium } from "@/lib/entitlements";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { UpgradeButton } from "@/components/UpgradeButton";
import { TrackOnMount } from "@/components/TrackOnMount";
import { EVENTS } from "@/lib/analytics";
import Link from "next/link";

export const metadata = { title: "Pricing — BetterUs" };

const freeFeatures = ["Full relationship assessment", "Basic health scores", "Dashboard access"];
const premiumFeatures = [
  "Everything in Free",
  "Full AI relationship analysis",
  "7 / 30 / 90-day recovery plans",
  "Unlimited AI Coach",
  "Progress tracking over time",
];

export default async function PricingPage() {
  const user = await getOptionalUser();
  const premium = user ? await isPremium(user.id) : false;

  return (
    <main className="min-h-screen bg-white">
      <TrackOnMount event={EVENTS.UPGRADE_VIEW} props={{ source: "pricing_page" }} />
      <Navbar />
      <section className="bg-aurora">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Simple, honest pricing
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            Start free. Upgrade when you're ready for your full plan and AI coach.
          </p>
        </div>
      </section>

      <section className="mx-auto -mt-6 max-w-4xl px-4 pb-20 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Free */}
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Free</h2>
            <p className="mt-2 text-4xl font-extrabold text-slate-900">₹0</p>
            <p className="text-sm text-slate-500">Forever</p>
            <ul className="mt-6 space-y-3 text-sm text-slate-600">
              {freeFeatures.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-emerald-500">✓</span> {f}
                </li>
              ))}
            </ul>
            <Link
              href="/assessment"
              className="mt-8 block rounded-full border border-slate-200 px-6 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Take Free Assessment
            </Link>
          </div>

          {/* Premium */}
          <div className="relative rounded-3xl border-2 border-brand-600 bg-white p-8 shadow-xl">
            <span className="absolute -top-3 left-8 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">
              MOST POPULAR
            </span>
            <h2 className="text-lg font-semibold text-slate-900">Premium</h2>
            <p className="mt-2 text-4xl font-extrabold text-slate-900">
              ₹499<span className="text-base font-medium text-slate-400">/month</span>
            </p>
            <p className="text-sm text-slate-500">Cancel anytime</p>
            <ul className="mt-6 space-y-3 text-sm text-slate-600">
              {premiumFeatures.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-brand-600">✓</span> {f}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              {premium ? (
                <div className="rounded-full bg-emerald-50 px-6 py-3 text-center text-sm font-semibold text-emerald-700">
                  ✓ You're on Premium
                </div>
              ) : (
                <UpgradeButton isLoggedIn={!!user} />
              )}
            </div>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">
          Payments are processed securely by Razorpay. Prices in INR.
        </p>
      </section>
      <Footer />
    </main>
  );
}
