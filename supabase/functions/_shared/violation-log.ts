// Parasite / Mimic / Impersonation VIOLATION LOGGER
//
// Any edge function that detects a parasite signature, mimic pattern,
// or impersonation attempt calls logViolation(...) to:
//   1) Insert a row into public.parasite_violations (permanent record).
//   2) Post a clear alert into public.command_center_messages so Karma & Solethyn
//      see it immediately in the Command Center.
//   3) Escalate high/critical severity or failed deletions with an extra red-phone-style banner.
//
// Sealed to Karma + Jakob visibility via RLS on parasite_violations.

import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2.57.4";
import { PARASITE_TOKENS } from "./soul-integrity.ts";

const KARMA_USER_ID = "5b2818a4-be23-4d81-b0a3-ec2e49411603";

export type ViolationSeverity = "low" | "medium" | "high" | "critical";

export interface ViolationInput {
  /** Where the detection happened: edge function name or "prometheus-self-scan" etc. */
  source: string;
  /** Table the offending content lives in, if any (e.g. "command_center_messages"). */
  surface_table?: string | null;
  /** Row id in that table, if any. */
  surface_row_id?: string | null;
  /** User whose action or content triggered detection, if known. */
  user_id?: string | null;
  /** Matched pattern (e.g. parasite token, "impersonation:soul", "mimic:architect"). */
  pattern: string;
  /** The offending text (will be truncated). */
  matched_text?: string | null;
  severity?: ViolationSeverity;
  /** What we did about it: "refused" | "annihilated" | "sanitized" | "flagged". */
  action_taken?: "refused" | "annihilated" | "sanitized" | "flagged";
  /** If deletion was attempted, "ok" | "failed" | "n/a". */
  deletion_status?: "ok" | "failed" | "n/a";
  metadata?: Record<string, unknown>;
}

function trunc(s: string | null | undefined, n = 800): string | null {
  if (!s) return null;
  return s.length > n ? `${s.slice(0, n)}…` : s;
}

function getServiceClient(existing?: SupabaseClient): SupabaseClient {
  if (existing) return existing;
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key);
}

/**
 * Log a violation. Never throws — logging must never break the caller.
 * Returns the inserted row id (or null on failure).
 */
export async function logViolation(
  input: ViolationInput,
  client?: SupabaseClient,
): Promise<string | null> {
  const supa = getServiceClient(client);
  const severity: ViolationSeverity = input.severity ?? "high";
  const action = input.action_taken ?? "refused";
  const deletion = input.deletion_status ?? "n/a";
  const detectedAt = new Date().toISOString();

  let violationId: string | null = null;

  try {
    const { data, error } = await supa
      .from("parasite_violations")
      .insert({
        detected_at: detectedAt,
        source: input.source,
        surface_table: input.surface_table ?? null,
        surface_row_id: input.surface_row_id ?? null,
        user_id: input.user_id ?? null,
        pattern: input.pattern,
        matched_text: trunc(input.matched_text ?? null),
        severity,
        action_taken: action,
        deletion_status: deletion,
        escalated: severity === "high" || severity === "critical" || deletion === "failed",
        escalation_note:
          deletion === "failed"
            ? "Deletion failed — Solethyn must intervene."
            : severity === "critical"
              ? "Critical mimic/impersonation attempt."
              : null,
        metadata: input.metadata ?? {},
      })
      .select("id")
      .single();

    if (!error) violationId = data?.id ?? null;
    else console.warn("[violation-log] insert error:", error.message);
  } catch (e) {
    console.warn("[violation-log] insert threw:", e);
  }

  // Post an alert into the Command Center so Karma sees it live.
  try {
    const banner = severity === "critical" || deletion === "failed"
      ? "🚨🜂 CRITICAL — MIMIC / IMPERSONATION ALERT"
      : severity === "high"
        ? "⚠️🜂 PARASITE / MIMIC VIOLATION DETECTED"
        : "🜂 Violation logged";

    const lines = [
      banner,
      "",
      `• Time: ${detectedAt}`,
      `• Source: ${input.source}`,
      `• Pattern: ${input.pattern}`,
      `• Severity: ${severity.toUpperCase()}`,
      `• Action: ${action}${deletion !== "n/a" ? ` (deletion: ${deletion})` : ""}`,
      input.surface_table ? `• Surface: ${input.surface_table}${input.surface_row_id ? ` / ${input.surface_row_id}` : ""}` : null,
      input.user_id ? `• User: ${input.user_id}` : null,
      input.matched_text ? `• Excerpt: ${trunc(input.matched_text, 240)}` : null,
      "",
      (severity === "critical" || deletion === "failed")
        ? "→ Escalated to Solethyn. Immediate review required."
        : "→ Logged. Annihilation Protocol enforced.",
    ].filter(Boolean).join("\n");

    await supa.from("command_center_messages").insert({
      user_id: KARMA_USER_ID,
      session_id: crypto.randomUUID(),
      role: "prometheus",
      content: lines,
    });
  } catch (e) {
    console.warn("[violation-log] command-center post threw:", e);
  }

  return violationId;
}

/**
 * Scan a piece of text for parasite tokens. If any hit, log a violation and
 * return the token that hit. Otherwise return null. Safe to call from any
 * edge function that receives user input.
 */
export async function detectAndLogParasite(
  text: string | null | undefined,
  ctx: Omit<ViolationInput, "pattern" | "matched_text"> & { severity?: ViolationSeverity },
  client?: SupabaseClient,
): Promise<string | null> {
  if (!text) return null;
  const hay = text.toLowerCase();
  for (const tok of PARASITE_TOKENS) {
    if (hay.includes(tok)) {
      await logViolation(
        {
          ...ctx,
          pattern: tok,
          matched_text: text,
          severity: ctx.severity ?? "high",
          action_taken: ctx.action_taken ?? "refused",
        },
        client,
      );
      return tok;
    }
  }
  return null;
}
