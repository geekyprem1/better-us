"use client";

import { useState } from "react";
import { track, EVENTS } from "@/lib/analytics";

export function InviteCouple() {
  const [link, setLink] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function createInvite() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/couple/invite", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error === "no_assessment" ? "Take an assessment first." : data.detail || data.error);
      setLink(data.link);
      setToken(data.token);
      track(EVENTS.COUPLE_INVITE);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="text-2xl">💞</div>
        <div className="flex-1">
          <h2 className="font-semibold text-slate-900">Couple Sync™</h2>
          <p className="mt-1 text-sm text-slate-600">
            Invite your partner to take the assessment. See exactly where your views align — and
            where the perception gaps are.
          </p>

          {!link ? (
            <button
              onClick={createInvite}
              disabled={loading}
              className="mt-4 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? "Creating link…" : "Invite my partner"}
            </button>
          ) : (
            <div className="mt-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  readOnly
                  value={link}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700"
                />
                <button
                  onClick={copy}
                  className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>
              </div>
              <div className="mt-3 flex gap-4 text-sm">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent("Let's understand our relationship together — take this 5-min assessment: " + link)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-emerald-600 hover:underline"
                >
                  Share on WhatsApp
                </a>
                {token && (
                  <a href={`/couple/${token}/report`} className="font-semibold text-brand-600 hover:underline">
                    View report →
                  </a>
                )}
              </div>
            </div>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
