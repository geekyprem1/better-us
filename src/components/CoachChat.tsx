"use client";

import { useEffect, useRef, useState } from "react";
import { CoachMessage } from "@/lib/types";
import { track, EVENTS } from "@/lib/analytics";
import { Markdown } from "./Markdown";

const suggestions = [
  "My wife doesn't talk to me anymore.",
  "We keep having the same fight over and over.",
  "I feel like we've grown apart.",
  "How do I rebuild trust after a betrayal?",
];

// One-tap modes — most users tap instead of typing.
const quickActions = [
  { icon: "🛠", label: "Generate Script", prompt: "Give me an exact, ready-to-say conversation script I can use with my partner right now." },
  { icon: "❤️", label: "Trust Repair", prompt: "Based on my Trust Risk™, help me start rebuilding trust with my partner." },
  { icon: "💬", label: "Fix Communication", prompt: "Help me fix our communication based on my Communication style." },
  { icon: "📅", label: "Recovery Plan", prompt: "Create my next Recovery Blueprint™ step based on my Recovery Potential™." },
];

export function CoachChat({ initialHistory }: { initialHistory: CoachMessage[] }) {
  const [messages, setMessages] = useState<CoachMessage[]>(initialHistory);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || streaming) return;

    const next: CoachMessage[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setStreaming(true);
    track(EVENTS.COACH_MESSAGE);

    // Placeholder assistant message we stream into.
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
    } catch {
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = {
          role: "assistant",
          content: "Sorry — I had trouble responding just now. Please try again.",
        };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 pb-6 pt-4 sm:px-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">BetterUs Coach™</h1>
        <p className="text-xs font-medium text-slate-400">Powered by the BetterUs Relationship Intelligence Engine™</p>
        <p className="mt-1 text-sm text-slate-500">
          Structured, data-grounded coaching — not a substitute for professional therapy or crisis support.
        </p>
      </div>

      {/* Quick actions — one tap instead of typing */}
      <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {quickActions.map((a) => (
          <button
            key={a.label}
            onClick={() => send(a.prompt)}
            disabled={streaming}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-50 sm:text-sm"
          >
            <span>{a.icon}</span> {a.label}
          </button>
        ))}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 space-y-4 overflow-y-auto rounded-3xl border border-slate-100 bg-white p-5 shadow-sm"
      >
        {messages.length === 0 && (
          <div className="py-10 text-center">
            <div className="text-3xl">👋</div>
            <p className="mt-3 font-medium text-slate-700">What's on your mind today?</p>
            <p className="text-sm text-slate-400">Share what's happening and I'll help you work through it.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 hover:border-brand-200 hover:text-brand-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                m.role === "user"
                  ? "whitespace-pre-line bg-brand-600 text-white"
                  : "border border-slate-100 bg-slate-50 text-slate-800"
              }`}
            >
              {m.role === "assistant" ? (
                m.content ? <Markdown>{m.content}</Markdown> : streaming ? "…" : ""
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-4 flex items-end gap-2"
      >
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Tell me what's going on…"
          className="max-h-40 flex-1 resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          disabled={streaming || !input.trim()}
          className="rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
