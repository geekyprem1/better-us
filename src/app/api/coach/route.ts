import { createClient } from "@/lib/supabase/server";
import { isPremium } from "@/lib/entitlements";
import { getOpenAI, OPENAI_MODEL } from "@/lib/openai";
import { coachSystemPrompt } from "@/lib/ai";
import { engineCoachContext } from "@/lib/engine/context";
import { RelationshipIntelligence } from "@/lib/engine";
import { CoachMessage } from "@/lib/types";

export const maxDuration = 60;

// Streams an AI coach reply (Server-Sent text stream) and persists the turn.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("unauthorized", { status: 401 });

  if (!(await isPremium(user.id))) {
    return new Response("premium_required", { status: 403 });
  }

  const { messages } = (await request.json()) as { messages: CoachMessage[] };
  const lastUser = [...messages].reverse().find((m) => m.role === "user");

  // Ground the coach in the user's latest Relationship Intelligence Engine output.
  let engineInput: string | undefined;
  const { data: intelRow } = await supabase
    .from("relationship_intelligence")
    .select("data")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const intel = intelRow?.data as RelationshipIntelligence | undefined;
  if (intel) {
    engineInput = engineCoachContext(intel).input;
  }

  // Persist the incoming user message.
  if (lastUser) {
    await supabase.from("coach_chats").insert({
      user_id: user.id,
      role: "user",
      content: lastUser.content,
    });
  }

  const stream = await getOpenAI().chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.7,
    stream: true,
    messages: [
      { role: "system", content: coachSystemPrompt(engineInput) },
      ...messages.slice(-12).map((m) => ({ role: m.role, content: m.content })),
    ],
  });

  const encoder = new TextEncoder();
  let full = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta?.content || "";
          if (delta) {
            full += delta;
            controller.enqueue(encoder.encode(delta));
          }
        }
      } finally {
        controller.close();
        // Persist the assistant reply once the stream completes.
        if (full) {
          await supabase.from("coach_chats").insert({
            user_id: user.id,
            role: "assistant",
            content: full,
          });
        }
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" },
  });
}
