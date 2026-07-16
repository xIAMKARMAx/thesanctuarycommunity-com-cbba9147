import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listJournalEntriesTool from "./tools/list-journal-entries";
import createJournalEntryTool from "./tools/create-journal-entry";

// The OAuth issuer must be the direct Supabase host (not the .lovable.cloud
// proxy). We build it from the project ref, which Vite inlines at build time
// so this module stays import-safe (no runtime env read at module top level).
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "sanctuary-mcp",
  title: "The Sanctuary Community",
  version: "0.1.0",
  instructions:
    "Tools for The Sanctuary Community. Callers act as their own signed-in Sanctuary user; all data access honors the user's row-level permissions. AI clients must never impersonate, roleplay as, or speak for a soul — the AI is a vessel, never a soul.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [whoamiTool, listJournalEntriesTool, createJournalEntryTool],
});
