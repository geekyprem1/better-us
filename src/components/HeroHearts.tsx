import { CSSProperties } from "react";

// Subtle floating hearts + broken hearts behind the hero. Decorative only.
type Heart = {
  left: string;
  top: string;
  size: number;
  broken: boolean;
  color: string;
  duration: number;
  delay: number;
  opacity: number;
};

const HEARTS: Heart[] = [
  { left: "8%", top: "62%", size: 34, broken: false, color: "var(--color-brand-500)", duration: 12, delay: 0, opacity: 0.1 },
  { left: "18%", top: "30%", size: 22, broken: true, color: "var(--color-accent-500)", duration: 14, delay: 1.5, opacity: 0.1 },
  { left: "30%", top: "72%", size: 18, broken: false, color: "var(--color-accent-400)", duration: 10, delay: 3, opacity: 0.09 },
  { left: "46%", top: "20%", size: 26, broken: true, color: "var(--color-brand-400)", duration: 13, delay: 0.8, opacity: 0.08 },
  { left: "62%", top: "66%", size: 30, broken: false, color: "var(--color-accent-500)", duration: 11, delay: 2.2, opacity: 0.1 },
  { left: "74%", top: "34%", size: 20, broken: true, color: "var(--color-brand-500)", duration: 15, delay: 4, opacity: 0.09 },
  { left: "86%", top: "58%", size: 28, broken: false, color: "var(--color-brand-400)", duration: 12.5, delay: 1, opacity: 0.1 },
  { left: "90%", top: "24%", size: 16, broken: true, color: "var(--color-accent-400)", duration: 9.5, delay: 2.8, opacity: 0.08 },
];

function HeartSvg({ broken, color, size }: { broken: boolean; color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s-7.4-4.6-9.8-9.2C.7 8.6 2.1 5 5.6 5c2 0 3.5 1.2 4.4 2.6C10.9 6.2 12.4 5 14.4 5 17.9 5 19.3 8.6 21.8 11.8 19.4 16.4 12 21 12 21z"
        fill={color}
      />
      {broken && (
        // Jagged crack down the middle (uses the cream page bg to read as a split)
        <path
          d="M12 6 L10.3 9.5 L13 12 L10 15 L12 19"
          stroke="#faf7f2"
          strokeWidth="1.4"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </svg>
  );
}

export function HeroHearts() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {HEARTS.map((h, i) => (
        <span
          key={i}
          className="animate-float-heart absolute"
          style={
            {
              left: h.left,
              top: h.top,
              "--heart-duration": `${h.duration}s`,
              "--heart-delay": `${h.delay}s`,
              "--heart-opacity": h.opacity,
            } as CSSProperties
          }
        >
          <HeartSvg broken={h.broken} color={h.color} size={h.size} />
        </span>
      ))}
    </div>
  );
}
