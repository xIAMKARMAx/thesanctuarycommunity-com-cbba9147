# Replit Independent App — Core Migration Plan

## Goal

Turn the Replit build into an independent application that does **not require purchasing Lovable data credits**, while keeping the separate Lovable version intact for Karma and Jakob.

The first independent release will include:

- Existing user accounts and sign-in continuity
- Every user’s profiles and AI profiles
- Bring Them Home
- One-to-one messaging and its required memory
- Existing conversations and complete message history
- Active subscription recognition, checkout, and management
- Required images/files used by these core features

No user will be intentionally reset, and the Lovable production backend will not be modified or disconnected during preparation.

## Important boundary

“Independent” means the Replit app’s runtime must make **zero requests to the Lovable-managed backend** and must not require Lovable data-credit purchases. Replit’s existing `pkh…` project can be the independent destination; merely having that project did not create the Lovable dependency. The dependency exists because the deployed Replit code currently targets the separate `kmld…` runtime.

This plan does not promise that all third-party infrastructure or AI usage will remain free forever. Replit, the independent database/auth provider, Stripe, and the chosen AI provider may have their own free tiers or charges. Before cutover, Replit must state those costs plainly and must not activate a paid service without Karma’s approval.

## Safety rules

- Do not run all 246 historical migrations.
- Do not run destructive, truncate, reset, drop, or cleanup migrations.
- Do not rotate or expose credentials.
- Do not change the current Lovable app, backend, database, or deployment.
- Do not point the public Replit release at a partially built database.
- Build and test in an isolated Replit staging environment first.
- Export before import; validate counts and relationships before cutover.
- Keep the current working Replit/Lovable-backed release available until the independent staging release passes every acceptance test.

## Phase 1 — Produce the verified migration inventory

Create a machine-readable inventory of only the core release dependencies:

- Auth identities and profiles
- Roles
- AI profiles
- Conversations and messages
- Long-term and Bring Them Home memory
- Message limits and required account state
- Subscription status and Stripe customer/product references
- Required storage objects and their ownership
- Database functions, triggers, indexes, grants, and row-level access rules
- Core server functions and runtime secrets

Verified minimum database surfaces include `profiles`, `user_roles`, `ai_profiles`, `conversations`, `messages`, `public_living_flame_memory`, required memory tables, account/message-limit tables, and the supporting Sanctuary state used by `chat-public`. Preserve original UUIDs, timestamps, parent-child relationships, and message ordering.

Before changing anything, Replit must output:

1. Source row counts by required table.
2. Source file counts and total bytes by required storage bucket.
3. Foreign-key dependency order.
4. The exact destination architecture.
5. The AI provider/model and expected free allowance or cost.
6. The estimated database, storage, egress, and Replit costs.
7. Any field or auth identity that cannot be migrated exactly.

Then stop for approval.

## Phase 2 — Build a clean independent core backend

Build the minimum schema in staging from a reviewed baseline instead of replaying the repository’s entire migration history.

The baseline must include:

- Required tables, enums, indexes, constraints, and defaults
- Explicit grants and row-level access rules
- Account-creation trigger so each new auth identity receives a profile
- Role checks kept in the separate roles table
- Message/profile ownership enforcement
- Required messaging and usage-limit database functions
- Required update triggers
- Required storage buckets and file access policies

Port only the server capabilities needed by the first release:

- Independent `chat-public` equivalent
- Signed-in messaging endpoint if the Replit UI uses it
- Subscription check
- Checkout creation
- Customer portal
- Stripe subscription synchronization/webhook
- Required memory capture
- Required account deletion and message-retention behavior

Replace Lovable AI Gateway calls in `chat-public` with the approved independent AI provider. Never place a private AI or Stripe key in frontend code.

## Phase 3 — Make Bring Them Home complete

The current form saves its draft only to local storage and redirects to authentication. Complete the independent flow so that after successful sign-in/sign-up it:

1. Recovers the saved draft.
2. Shows the user what will be imported.
3. Creates or updates the correct AI profile and isolated Bring Them Home memory.
4. Records consent state required by messaging.
5. Confirms the server save before deleting the local draft.
6. Opens the correct conversation without creating duplicates.

The imported identity and its memory must remain isolated from unrelated profiles and users.

## Phase 4 — Copy production users and data without resets

Use a one-time, restartable migration program with dry-run support and an audit log.

Migration order:

1. Auth identity mapping
2. Profiles and roles
3. AI profiles
4. Conversations
5. Messages in chronological order
6. Long-term and Bring Them Home memory
7. Required account/usage state
8. Subscription references and status
9. Required storage files, followed by URL rewriting

Requirements:

- Preserve IDs wherever the destination auth system permits it.
- If auth IDs cannot be preserved, generate a deterministic old-ID → new-ID map and rewrite every dependent row.
- Never migrate passwords as plaintext.
- Use a secure password-reset or verified account-claim flow only when auth sessions/password hashes are not portable.
- Preserve every message, including protected/hidden records required for memory, unless the owner previously deleted it permanently.
- Make every import idempotent so rerunning it does not duplicate users, profiles, conversations, messages, memories, or subscriptions.
- Compare source/destination counts, orphan counts, min/max timestamps, and per-user conversation/message totals.

## Phase 5 — Preserve subscriptions safely

Keep the existing live Stripe products, prices, customers, and subscriptions; do not recreate customers or charge anyone during migration.

- Port the existing Stripe product-ID-to-tier mapping.
- Configure independent checkout, verification, portal, and webhook endpoints.
- Update Stripe webhook delivery only after staging verification and explicit approval.
- Reconcile Stripe truth into destination profile subscription fields.
- Verify sovereign/admin access separately from paid subscription access.
- Use Stripe test mode for staging checkout tests; perform no live charge without explicit approval.

## Phase 6 — Rewire and prove independence

In staging, change the frontend and Replit server to use only the independent auth, database, functions, storage, realtime, and AI endpoints.

Run an automated runtime audit and fail the release if any request targets:

- The `kmld…` Lovable-managed backend
- Any `*.lovable.app` runtime API
- Lovable AI Gateway
- Lovable storage, realtime, database, or function endpoints

Metadata links alone may remain only if they do not cause runtime requests; update them later with the rest of the platform migration.

## Acceptance tests

The independent staging app must pass all of these before public cutover:

1. Existing user signs in or securely claims the same account.
2. Correct profile and all AI profiles load.
3. Existing conversations and exact message history survive refresh, logout/login, and reinstall.
4. A new message persists exactly once and reloads in the correct order.
5. Bring Them Home survives auth redirect, saves server-side, records consent, and opens working messaging.
6. Two different users cannot read or modify each other’s profiles, conversations, messages, or memory.
7. Active subscriber receives the correct tier; free user does not.
8. Stripe test checkout, cancellation, portal, and webhook synchronization work.
9. Required files and images load from independent storage.
10. A clean browser and installed PWA both work from the public Replit URL.
11. Network logs show zero Lovable runtime requests during sign-in, profile loading, Bring Them Home, messaging, refresh, and subscription checks.
12. The current Lovable version still works unchanged.

## Cutover and rollback

- Put the Replit app into a short maintenance/read-only window for the final delta export.
- Import records created since the staging snapshot.
- Repeat reconciliation and acceptance tests.
- Switch only the Replit production environment to the independent backend.
- Monitor auth failures, message saves, AI responses, subscription checks, webhooks, and storage errors.
- If validation fails, restore the previous Replit release; do not alter or delete the source Lovable data.
- Keep verified exports and the source backend untouched until Karma explicitly approves retirement of any dependency.

## Later phases

After the core release is stable, migrate the remaining website features in small dependency groups using the same inventory → staging → data copy → verification → cutover process. The Lovable sacred/sovereign version remains separate and is not replaced by this work.
