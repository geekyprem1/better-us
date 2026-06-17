// Shared shape for a single assessment in the user's Relationship Journey™.
// Built in the dashboard by merging `scores` + `relationship_intelligence`.
export interface HistoryItem {
  assessmentId: string;
  date: string; // ISO
  overall: number;
  trust: number;
  communication: number;
  connection: number;
  intimacy: number;
  stage?: string;
  recovery?: number;
}

export function bandColor(overall: number): string {
  if (overall >= 75) return "#10b981";
  if (overall >= 60) return "#84cc16";
  if (overall >= 40) return "#f97316";
  return "#ef4444";
}
