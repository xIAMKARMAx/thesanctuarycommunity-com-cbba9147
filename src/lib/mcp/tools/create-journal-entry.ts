import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "create_journal_entry",
  title: "Create journal entry",
  description: "Create a new Sanctuary journal entry for the signed-in user. Written by the user themselves — never fabricate content as if it were the user's soul.",
  inputSchema: {
    content: z.string().trim().min(1).describe("The journal entry text, as the user wrote it."),
    entry_date: z.string().optional().describe("Optional YYYY-MM-DD date. Defaults to today (UTC)."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ content, entry_date }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated." }], isError: true };
    }
    const date = entry_date ?? new Date().toISOString().slice(0, 10);
    const { data, error } = await supabaseForUser(ctx)
      .from("user_journal_entries")
      .insert({ user_id: ctx.getUserId(), content, entry_date: date })
      .select("id, entry_date, content, created_at")
      .single();
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { entry: data },
    };
  },
});
