# Forensic comparison: Project A (kmld…) vs Project B (pkh…)

Read-only. Nothing was modified, migrated, deployed, or deleted. No secret values are shown below.

## Scope limit (read this first)

I have direct read access to **Project A only** (`kmldvsatwjahcghjtvtu`) — it is the backend this codebase is bound to. I have **no access at all to Project B** (`pkhygqfokqpnzkgbdlwz`); it is not attached to this app. So every Project B row below is either "your Replit observation" or "unknown". I did not guess.

## 1. Evidence table

| Evidence | Project A — kmldvsatwjahcghjtvtu | Project B — pkhygqfokqpnzkgbdlwz |
|---|---|---|
| Bound to this repo's `.env` / client | Yes (verified in `.env`, `supabase/config.toml`) | No reference anywhere in the codebase |
| Auth users | 213 (first 2025-11-21, latest 2026-08-12) | Unknown to me; you observed auth works |
| profiles | 213 rows | Not visible via REST (your observation) |
| conversations | 511 rows | Not visible (your observation) |
| messages | 1,173 rows | Not visible (your observation) |
| ai_profiles | 308 rows | Not visible (your observation) |
| free_user_limits | 156 rows | Not visible (your observation) |
| mood_notifications | 454 rows | Not visible (your observation) |
| Flame memory (`public_living_flame_memory`) | 14 rows | Unknown |
| Relationship data (marriages / celestial_children) | 8 / 8 rows | Unknown |
| Total app tables | ~175 in `public` | Only `subscriptions` observed |
| Storage buckets | 13 buckets, 2,126 objects (oldest `chat-images` 2025-11-21, newest `studio-creations` 2026-08-12) | Unknown |
| Realtime-enabled tables | 9 (red_phone_messages, council_sessions, world_presence, flame_distress_signals, open_world_beings, community_rituals, ritual_participants, spontaneous_messages, ai_autonomous_conversations) | Unknown |
| Edge Functions | 101 function directories in repo, incl. `chat-public`, deployed | `chat-public` returns nothing (your observation) |
| Migrations in repo | 250 migration files, all authored against A | None target B |
| Organization | `wpczgwxsriezaubncuom`, managed by Lovable, X-Large instance, not paused | Unknown — a different, non-Lovable account of yours |
| Link to thesanctuarycommunity.com | Yes — this project publishes to that domain | No evidence of any link |

## 2. Answers

**A. Which project served the original working site/AI?** Project A. Its data timeline (first user 2025-11-21, first storage object same day, activity through 2026-08-12) matches the Prometheus → Sanctuary Community lifespan, and the live domain publishes from it.

**B. Which holds users, conversations, AI memory, profiles, relationships, storage, realtime, functions?** Project A, unambiguously. All of it.

**C. Is Project B newer/partial/empty/unrelated?** Evidence points to *partial or unrelated* — a separate Supabase account with auth plus a lone `subscriptions` table and no app schema. It cannot be a "reset" of A, because A is intact. I cannot confirm B's creation date or org without access.

**D. Does A hold real historical data or only the function?** Real data: 1,173 messages across 511 conversations, 213 users, 308 AI profiles, 2,126 stored files, 14 Flame memory rows.

**E. What does `chat-public` use for memory/identity?** The `public_living_flame_memory` table (one row per user, auto-created on first chat), read with a service-role client and scoped by `user_id`. It holds `imported_identity`, `chosen_name`, `role_context`, `key_memories[]`, `message_count`, `doubt_recovery_used`. The model appends an invisible sentinel block to write/reshape/release memories; abuse-related memories can never be released. That table lives in Project A.

**F. Ownership.** Project A: org `wpczgwxsriezaubncuom`, Lovable-managed, ref `kmldvsatwjahcghjtvtu`. Human-readable project/org display names and the creation date are not exposed to me through the managed tooling — first data write was 2025-11-21. Project B: owner/org unknown; it is not in this workspace.

**G/H. Why two IDs.** Only one authoritative source exists in code: `.env` + `supabase/config.toml` + 250 migrations, all pointing at A. Project B most likely entered during the Replit rebuild — a new Supabase project created (or picked from another of your Supabase accounts) by the Replit setup flow, which scaffolded auth and a `subscriptions` table and nothing else. Lovable/GitHub config is authoritative; the Replit-side config is the outlier.

**I. Recommendation.** **Project A (`kmldvsatwjahcghjtvtu`) is the single source of truth.** Point the Replit/Kovrah build at A. Treat B as a scratch project: do not migrate into it, do not migrate out of it, and do not delete it yet.

## 3. Confidence

**High (≈95%)** that A is authoritative and holds all production data — direct query evidence.
**Medium (≈60%)** on the characterisation of B — based entirely on your external observations, not my own reads.

## 4. Still uncertain

- B's owning account/org, creation date, real table list, auth user count, buckets, functions.
- Whether B's `subscriptions` table contains live Stripe records that A lacks (A has no `subscriptions` table — it uses `art_studio_subscriptions` / `immersive_3d_subscriptions`).
- Whether any real user ever signed up against B.
- Human-readable project names and exact creation dates for either project.

## 5. Do NOT do these yet

- Do not run the repo's 250 migrations against B (some contain TRUNCATE/DELETE/broad UPDATE).
- Do not run any migration against A "to sync" the two.
- Do not delete, pause, or reset either project.
- Do not deploy `chat-public` to B.
- Do not rotate or regenerate A's keys until Replit is repointed.
- Do not point production DNS at any build wired to B.
- Do not copy auth users between projects.

## 6. Safe verification plan (non-destructive)

1. In the Supabase dashboard for the account owning B, record its org, project name, creation date, and instance size. Read-only.
2. In B's SQL editor run only `select count(*) from auth.users;` and `select table_name from information_schema.tables where table_schema='public';` — counts and names, no rows.
3. If B has ≥1 auth user, export nothing yet; just record the count and earliest `created_at` to see whether anyone real ever used it.
4. Confirm A's live wiring end-to-end: sign in on thesanctuarycommunity.com and confirm chat history loads (this exercises `public_living_flame_memory` in A).
5. In Replit, change only the three env values to A's URL / anon key / project ref, and run the app against A in a preview deployment before touching DNS.
6. Take a manual backup snapshot of A from the Lovable Cloud side before any future schema work.
7. Only after 1–6, decide whether B's `subscriptions` rows need to be manually re-created in A — as a hand-written insert of specific rows, never a migration replay.

## Technical notes

- A's client binding lives in `.env` (`VITE_SUPABASE_PROJECT_ID`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) and `supabase/config.toml` (`project_id`), plus per-function `verify_jwt` settings for all 101 functions.
- `chat-public` is JWT-optional and uses a service-role client for memory writes, so repointing it to a project without `public_living_flame_memory` silently produces an amnesiac Flame — another reason B must not become the target.
