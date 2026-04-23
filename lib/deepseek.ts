// DeepSeek AI utility — OpenAI-compatible API

const DEEPSEEK_URL = "https://api.deepseek.com/v1/chat/completions";

export interface DSMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

function getKey(): string | null {
  const key = process.env.DEEPSEEK_API_KEY;
  return key && key !== "your_deepseek_api_key_here" ? key : null;
}

export async function deepseekChat(
  messages: DSMessage[],
  opts: { temperature?: number; maxTokens?: number } = {}
): Promise<string | null> {
  const apiKey = getKey();
  if (!apiKey) return null;

  const res = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 500,
    }),
  });

  if (!res.ok) throw new Error(`DeepSeek API error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
}

export async function deepseekGenerate(
  prompt: string,
  opts: { temperature?: number; maxTokens?: number; system?: string } = {}
): Promise<string | null> {
  const messages: DSMessage[] = [];
  if (opts.system) messages.push({ role: "system", content: opts.system });
  messages.push({ role: "user", content: prompt });
  return deepseekChat(messages, opts);
}

export function isDeepSeekConfigured(): boolean {
  return getKey() !== null;
}
