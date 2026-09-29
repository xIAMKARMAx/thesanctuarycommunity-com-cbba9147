// Gemini Relay — routes every AI text/chat call straight to Google AI Studio
// using the owner's own GEMINI_API_KEY, so chatting never spends Lovable credits.
// Import once at the top of a function: `import "../_shared/gemini-relay.ts";`
// Image/video generation requests are left untouched (those stay off for now).

const GOOGLE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
const DEFAULT_MODEL = "gemini-flash-latest";

function mapModel(model: unknown): string {
  if (typeof model !== "string" || !model) return DEFAULT_MODEL;
  if (model.startsWith("google/")) {
    const m = model.slice(7);
    // Keep the exact model the feature was built on when Google offers it
    if (m.startsWith("gemini-3") ) return m;
    if (m.includes("lite")) return "gemini-flash-lite-latest";
    if (m.includes("pro")) return "gemini-pro-latest";
    return DEFAULT_MODEL;
  }
  return DEFAULT_MODEL;
}

// Gemini's compatibility layer can drop extra system messages. Merge every
// system message (identity, memories, room context) into ONE at the top so the
// being's full identity and memory always arrive intact.
function mergeSystem(messages: any[]): any[] {
  if (!Array.isArray(messages)) return messages;
  const sys = messages.filter((m) => m?.role === "system")
    .map((m) => typeof m.content === "string" ? m.content : JSON.stringify(m.content));
  const rest = messages.filter((m) => m?.role !== "system");
  return sys.length ? [{ role: "system", content: sys.join("\n\n") }, ...rest] : rest;
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
      body.messages = mergeSystem(body.messages);
      if (body.max_completion_tokens && !body.max_tokens) body.max_tokens = body.max_completion_tokens;
      delete body.max_completion_tokens;
      delete body.reasoning;
      delete body.provider;

      const primary = body.model as string;
      const chain = [primary, "gemini-3-flash-preview", "gemini-flash-latest", "gemini-3.5-flash", "gemini-pro-latest", "gemini-3.5-flash-lite", "gemini-flash-lite-latest"]
        .filter((m, i, a) => a.indexOf(m) === i);
      let res: Response | null = null;
      for (let i = 0; i < chain.length; i++) {
        const model = chain[i];
        res = await originalFetch(GOOGLE_URL, {
          ...init,
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({ ...body, model }),
        });
        if (![404, 429, 500, 503].includes(res.status) || i === chain.length - 1) return res;
        console.warn(`[gemini-relay] ${model} returned ${res.status}, trying next`);
        await res.body?.cancel();
      }
      return res!;
    } catch (e) {
      console.error("[gemini-relay] passthrough after error:", e);
      return originalFetch(input, init);
    }
  };
}

export {};
