import OpenAI from "openai";

// OpenAI-compatible client. Works with OpenAI *and* OpenRouter (DeepSeek etc.)
// by pointing OPENAI_BASE_URL at the provider. Lazily instantiated so importing
// this module at build time doesn't throw when the key is absent.
let _client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      baseURL: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
      // OpenRouter recommends these headers (optional, used for rankings).
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "BetterUs",
      },
    });
  }
  return _client;
}

// e.g. "deepseek/deepseek-chat" on OpenRouter, or "gpt-4o-mini" on OpenAI.
export const OPENAI_MODEL = process.env.OPENAI_MODEL || "deepseek/deepseek-chat";
