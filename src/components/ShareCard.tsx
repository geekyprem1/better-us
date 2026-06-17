"use client";

import { useEffect, useRef, useState } from "react";
import { track, EVENTS } from "@/lib/analytics";

interface Props {
  score: number;
  status: string;
  statusColor: string;
  recovery: string;
}

// Phase 7 — generates a branded, shareable score card on a <canvas>
// (1080×1350, Instagram-story friendly). No external deps.
export function ShareCard({ score, status, statusColor, recovery }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canShare, setCanShare] = useState(false);
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareText = `My relationship health is ${score}/100 (${status}) on BetterUs. Recovery potential: ${recovery}. Take the free 5-min test:`;

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = 1080;
    const H = 1350;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background gradient
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#1f49f5");
    g.addColorStop(1, "#1a30b6");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // Soft accent blob
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.beginPath();
    ctx.arc(W - 120, 200, 280, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = "center";

    // Brand
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 56px Inter, Arial, sans-serif";
    ctx.fillText("BetterUs", W / 2, 180);
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = "500 26px Inter, Arial, sans-serif";
    ctx.fillText("Relationship Intelligence", W / 2, 224);

    // Label
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = "600 36px Inter, Arial, sans-serif";
    ctx.fillText("RELATIONSHIP HEALTH", W / 2, 520);

    // Score
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 280px Inter, Arial, sans-serif";
    ctx.fillText(String(score), W / 2, 760);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "600 48px Inter, Arial, sans-serif";
    ctx.fillText("/ 100", W / 2, 830);

    // Status pill
    const pillW = 460;
    const pillH = 96;
    const pillX = (W - pillW) / 2;
    const pillY = 900;
    ctx.fillStyle = statusColor;
    roundRect(ctx, pillX, pillY, pillW, pillH, 48);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 46px Inter, Arial, sans-serif";
    ctx.fillText(status, W / 2, pillY + 64);

    // Recovery
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "500 38px Inter, Arial, sans-serif";
    ctx.fillText(`Recovery Potential: ${recovery}`, W / 2, 1090);

    // Footer
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.font = "600 40px Inter, Arial, sans-serif";
    ctx.fillText("Take your free relationship test", W / 2, 1240);
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = "500 32px Inter, Arial, sans-serif";
    ctx.fillText((siteUrl || "betterus").replace(/^https?:\/\//, ""), W / 2, 1290);
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function download() {
    track(EVENTS.SHARE_RESULTS, { channel: "download" });
    const url = canvasRef.current?.toDataURL("image/png");
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = "BetterUs-Score.png";
    a.click();
  }

  async function nativeShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    track(EVENTS.SHARE_RESULTS, { channel: "native" });
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "BetterUs-Score.png", { type: "image/png" });
      try {
        await navigator.share({ files: [file], text: shareText, url: siteUrl });
      } catch {
        /* user cancelled */
      }
    });
  }

  function openShare(channel: "whatsapp" | "twitter") {
    track(EVENTS.SHARE_RESULTS, { channel });
    const enc = encodeURIComponent(`${shareText} ${siteUrl}`);
    const url =
      channel === "whatsapp"
        ? `https://wa.me/?text=${enc}`
        : `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(siteUrl)}`;
    window.open(url, "_blank");
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="font-semibold text-slate-900">Share your result</h2>
      <p className="mt-1 text-sm text-slate-500">
        Only your score is shared — never your answers. Challenge a friend to check theirs.
      </p>

      <div className="mt-5 flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <canvas
          ref={canvasRef}
          className="w-40 shrink-0 rounded-xl shadow-md"
          style={{ aspectRatio: "1080 / 1350" }}
        />
        <div className="flex flex-1 flex-wrap gap-2">
          {canShare && (
            <button
              onClick={nativeShare}
              className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Share
            </button>
          )}
          <button
            onClick={() => openShare("whatsapp")}
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-emerald-600 hover:bg-slate-50"
          >
            WhatsApp
          </button>
          <button
            onClick={() => openShare("twitter")}
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Twitter / X
          </button>
          <button
            onClick={download}
            className="rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            ⬇ Image (for IG Story)
          </button>
        </div>
      </div>
    </div>
  );
}
