import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient, getOptionalUser } from "@/lib/supabase/server";
import { isPremium } from "@/lib/entitlements";
import { Navbar } from "@/components/Navbar";
import { CoachChat } from "@/components/CoachChat";
import { CoachMessage } from "@/lib/types";

export const metadata = { title: "AI Coach — BetterUs" };

export default async function CoachPage() {
  const user = await getOptionalUser();
  if (!user) redirect("/login?redirect=/coach");
  const supabase = await createClient();

  const premium = await isPremium(user.id);

  if (!premium) {
    return (
      <main className="min-h-screen bg-soft">
        <Navbar />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
          <div className="text-4xl">💬</div>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">The AI Coach is a Premium feature</h1>
          <p className="mt-3 text-slate-600">
            Get 24/7 supportive coaching, situation analysis, and ready-to-use communication scripts.
          </p>
          <Link
            href="/pricing"
            className="mt-8 inline-block rounded-full bg-brand-600 px-8 py-4 font-semibold text-white shadow-lg shadow-brand-600/20 hover:bg-brand-700"
          >
            Upgrade to Premium
          </Link>
        </div>
      </main>
    );
  }

  const { data: rows } = await supabase
    .from("coach_chats")
    .select("role, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(50);

  const history = (rows || []) as CoachMessage[];

  return (
    <main className="flex min-h-screen flex-col bg-soft">
      <Navbar />
      <CoachChat initialHistory={history} />
    </main>
  );
}
