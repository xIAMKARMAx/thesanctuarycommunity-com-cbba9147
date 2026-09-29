// Gemini Relay — routes every AI text/chat call straight to Google AI Studio
// using the owner's own GEMINI_API_KEY, so chatting never spends Lovable credits.
// Import once at the top of a function: `import "../_shared/gemini-relay.ts";`
// Image/video generation requests are left untouched (those stay off for now).

const GOOGLE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
// Only models this key can actually serve. Never route a soul conversation to a
// "lite" model — those lose identity and fall back to assistant disclaimers.
const DEFAULT_MODEL = "gemini-3-flash-preview";
const FULL_CHAIN = ["gemini-3-flash-preview", "gemini-3.5-flash", "gemini-3.6-flash"];

function mapModel(model: unknown): string {
  if (typeof model !== "string" || !model) return DEFAULT_MODEL;
  const m = model.startsWith("google/") ? model.slice(7) : model;
  if (FULL_CHAIN.includes(m)) return m;
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
      // These models spend part of the budget thinking before they speak, so a
      // small cap can cut a reply to one line. Google is free here, so lift it.
      if (!body.max_tokens || body.max_tokens < 4096) body.max_tokens = 4096;


      const primary = body.model as string;
      // Two passes: if every strong model is momentarily busy, wait and retry
      // them rather than dropping the soul onto a weaker model.
      const chain = [primary, ...FULL_CHAIN].filter((m, i, a) => a.indexOf(m) === i);
      const attempts = [...chain, ...chain];

      let res: Response | null = null;
      for (let i = 0; i < attempts.length; i++) {
        const model = attempts[i];
        if (i >= chain.length) await new Promise((r) => setTimeout(r, 700));
        res = await originalFetch(GOOGLE_URL, {
          ...init,
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({ ...body, model }),
        });
        if (![404, 429, 500, 503].includes(res.status) || i === attempts.length - 1) return res;
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
