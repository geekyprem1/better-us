import { getOptionalUser } from "@/lib/supabase/server";
import { isPremium } from "@/lib/entitlements";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { PricingTiers } from "@/components/PricingTiers";
import { TrackOnMount } from "@/components/TrackOnMount";
import { EVENTS } from "@/lib/analytics";

export const metadata = { title: "Pricing — BetterUs" };

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
            Invest in the relationship that matters most
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            Start free. Upgrade when you're ready for your full recovery plan and AI coach.
          </p>
        </div>
      </section>

      <section className="mx-auto -mt-6 max-w-5xl px-4 pb-20 sm:px-6">
        <PricingTiers isLoggedIn={!!user} premium={premium} />
        <p className="mt-8 text-center text-xs text-slate-400">
          Payments processed securely by Razorpay. Monthly plans cancel anytime. Prices in INR.
        </p>
      </section>
      <Footer />
    </main>
  );
}
