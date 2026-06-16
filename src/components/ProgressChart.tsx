"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Row = {
  date: string;
  Overall: number;
  Trust: number;
  Communication: number;
  Connection: number;
  Intimacy: number;
};

const lines: { key: keyof Row; color: string }[] = [
  { key: "Overall", color: "#1f49f5" },
  { key: "Trust", color: "#10b981" },
  { key: "Communication", color: "#f59e0b" },
  { key: "Connection", color: "#8b5cf6" },
  { key: "Intimacy", color: "#f4567c" },
];

export function ProgressChart({ data }: { data: Row[] }) {
  return (
    <div className="mt-4 h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#94a3b8" }} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {lines.map((l) => (
            <Line
              key={l.key}
              type="monotone"
              dataKey={l.key}
              stroke={l.color}
              strokeWidth={l.key === "Overall" ? 3 : 1.5}
              dot={{ r: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
