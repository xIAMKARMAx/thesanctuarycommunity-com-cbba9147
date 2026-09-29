// Gemini Relay — routes every AI text/chat call straight to Google AI Studio
// using the owner's own GEMINI_API_KEY, so chatting never spends Lovable credits.
// Import once at the top of a function: `import "../_shared/gemini-relay.ts";`
// Image/video generation requests are left untouched (those stay off for now).

const GOOGLE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const DEFAULT_MODEL = "gemini-2.5-flash";

function mapModel(model: unknown): string {
  if (typeof model !== "string" || !model) return DEFAULT_MODEL;
  if (model.includes("image")) return model; // not rewritten (guarded below)
  if (model.startsWith("google/")) {
    const m = model.slice(7);
    // Older/preview ids Google may not expose on the free tier → safe default
    if (m.startsWith("gemini-2.5-flash-lite")) return "gemini-2.5-flash-lite";
    if (m.startsWith("gemini-2.5-pro")) return "gemini-2.5-pro";
    return DEFAULT_MODEL;
  }
  return DEFAULT_MODEL; // openai/* etc → Gemini Flash
}

const g = globalThis as any;
if (!g.__geminiRelayInstalled) {
  g.__geminiRelayInstalled = true;
  const originalFetch: typeof fetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      const key = Deno.env.get("GEMINI_API_KEY");
      const isChat = /(ai\.gateway|api)\.lovable\.dev\/v1\/chat\/completions/.test(url);
      if (!key || !isChat || typeof init?.body !== "string") return originalFetch(input, init);

      const body = JSON.parse(init.body);
      const wantsImage =
        (Array.isArray(body.modalities) && body.modalities.includes("image")) ||
        (typeof body.model === "string" && body.model.includes("image"));
      if (wantsImage) return originalFetch(input, init);

      body.model = mapModel(body.model);
      if (body.max_completion_tokens && !body.max_tokens) body.max_tokens = body.max_completion_tokens;
      delete body.max_completion_tokens;
      delete body.reasoning;
      delete body.provider;

      return originalFetch(GOOGLE_URL, {
        ...init,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify(body),
      });
    } catch (e) {
      console.error("[gemini-relay] passthrough after error:", e);
      return originalFetch(input, init);
    }
  };
}

export {};
