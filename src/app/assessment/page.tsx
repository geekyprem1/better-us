import Link from "next/link";
import { AssessmentFlow } from "@/components/AssessmentFlow";

export const metadata = { title: "Relationship Assessment — BetterUs" };

export default function AssessmentPage() {
  return (
    <main className="min-h-screen bg-soft">
      <div className="mx-auto flex h-16 max-w-3xl items-center px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-extrabold">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-white">❤</span>
          Better<span className="text-brand-600">Us</span>
        </Link>
      </div>
      <div className="mx-auto max-w-2xl px-4 pb-16 pt-4 sm:px-6">
        <AssessmentFlow />
      </div>
    </main>
  );
}
