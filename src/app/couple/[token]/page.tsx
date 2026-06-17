import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { CoupleAssessment } from "@/components/CoupleAssessment";

export const metadata = { title: "Couple Assessment — BetterUs" };

export default async function CouplePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("couple_invites")
    .select("status, inviter_user_id")
    .eq("token", token)
    .maybeSingle();

  if (!invite) notFound();

  let inviterName = "Your partner";
  const { data: u } = await admin
    .from("users")
    .select("full_name")
    .eq("id", invite.inviter_user_id)
    .maybeSingle();
  if (u?.full_name) inviterName = u.full_name;

  return (
    <main className="min-h-screen bg-soft">
      <div className="mx-auto flex h-16 max-w-2xl items-center px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-extrabold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-white">❤</span>
          Better<span className="text-brand-600">Us</span>
        </Link>
      </div>
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-4 sm:px-6">
        <CoupleAssessment token={token} inviterName={inviterName} completed={invite.status === "completed"} />
      </div>
    </main>
  );
}
