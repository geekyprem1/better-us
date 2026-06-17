import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { CoupleReport } from "@/components/CoupleReport";
import { CoupleSyncResult } from "@/lib/engine";

export const metadata = { title: "Couple Report — BetterUs" };

export default async function CoupleReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("couple_invites")
    .select("status, sync, ai_explanation, partner_name, inviter_user_id")
    .eq("token", token)
    .maybeSingle();

  if (!invite) notFound();

  let inviterName = "Partner A";
  const { data: u } = await admin
    .from("users")
    .select("full_name")
    .eq("id", invite.inviter_user_id)
    .maybeSingle();
  if (u?.full_name) inviterName = u.full_name;

  return (
    <main className="min-h-screen bg-soft">
      <div className="mx-auto flex h-16 max-w-3xl items-center px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-extrabold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-white">❤</span>
          Better<span className="text-brand-600">Us</span>
        </Link>
      </div>
      <div className="mx-auto max-w-3xl px-4 pb-20 pt-4 sm:px-6">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900">Your Couple Report</h1>

        {invite.status !== "completed" || !invite.sync ? (
          <div className="mt-6 rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-sm">
            <div className="text-3xl">⏳</div>
            <h2 className="mt-3 text-xl font-bold text-slate-900">Waiting for your partner</h2>
            <p className="mt-2 text-slate-600">
              The report unlocks once your partner completes their assessment. Share the invite link
              with them.
            </p>
          </div>
        ) : (
          <CoupleReport
            sync={invite.sync as CoupleSyncResult}
            aiExplanation={invite.ai_explanation || undefined}
            inviterName={inviterName}
            partnerName={invite.partner_name || "Partner B"}
          />
        )}
      </div>
    </main>
  );
}
