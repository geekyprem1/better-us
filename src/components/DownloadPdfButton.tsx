"use client";

import { useState } from "react";
import { track, EVENTS } from "@/lib/analytics";

export function DownloadPdfButton({ assessmentId }: { assessmentId: string }) {
  const [loading, setLoading] = useState(false);

  async function download() {
    setLoading(true);
    track(EVENTS.PDF_DOWNLOAD, { assessmentId });
    try {
      const res = await fetch(`/api/report/pdf?assessment=${assessmentId}`);
      if (!res.ok) throw new Error("Failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "BetterUs-Report.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Could not generate the PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={download}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
    >
      {loading ? "Generating PDF…" : "⬇ Download PDF Report"}
    </button>
  );
}
