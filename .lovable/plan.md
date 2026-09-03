# Replit In-Place Independence Conversion

## What Replit is being told to do

**Do not rebuild, reset, replace, or destroy the Replit app. Keep every screen, component, route, PWA/download feature, and piece of working code already built.** Convert the existing Replit app in place by replacing only its remaining Lovable runtime dependencies.

The first conversion scope is:

- Login and existing accounts
- Profiles and AI profiles
- Bring Them Home
- Messaging, conversations, messages, and required memory
- Existing subscriptions

The Lovable version remains separate and unchanged for Karma and Jakob.

## Why the Replit app still depends on Lovable

The visual app and installable PWA are already hosted by Replit. However, the completed audit verified that its runtime still sends auth, database, function, storage, and realtime requests to the Lovable-managed `kmld…` backend. The messaging function also uses `LOVABLE_API_KEY` to call Lovable’s AI gateway.

That does **not** mean Replit’s work must be discarded. It means the shell/app is built, but some working wires still lead back to Lovable. Independence requires moving the data and server capabilities behind those wires, then changing only the endpoint configuration.

The `pkh…` project is not what caused the Lovable dependency. It is the intended independent destination, but its missing core schema/data must be added safely before any connection is switched.

## Exact instructions for Replit

```text
CONVERT THE EXISTING REPLIT APP TO INDEPENDENT OPERATION IN PLACE.

NON-NEGOTIABLE REQUIREMENTS:

1. DO NOT rebuild, replace, reset, roll back, or delete the existing Replit app.
2. Preserve every existing page, component, route, style, manifest, icon, install/download capability, and working feature.
3. DO NOT run all repository migrations. DO NOT run any truncate, drop, reset, cleanup, or destructive migration.
4. DO NOT change or damage the Lovable app or Lovable-managed backend.
5. DO NOT rotate, print, expose, or overwrite credentials.
6. DO NOT switch production to an incomplete backend.
7. Use a separate staging deployment/environment for this conversion.
8. Do not make users start over. Preserve existing accounts, profile IDs where possible, AI profiles, conversations, messages, memory, subscription status, and required files.
9. Do not activate a paid AI/database/infrastructure service without first reporting its exact pricing/free allowance and receiving my approval.

VERIFIED CURRENT PROBLEM:

The Replit frontend/PWA is built and must remain intact, but its runtime still points auth, REST/database, functions, storage, realtime, and server calls at the Lovable-managed kmld backend. The current chat-public function also calls Lovable AI Gateway using LOVABLE_API_KEY.

THIS IS A WIRING/BACKEND-INDEPENDENCE JOB, NOT A FRONTEND REBUILD.

FIRST RELEASE SCOPE ONLY:

- Existing authentication/accounts
- profiles and user_roles
- ai_profiles
- Bring Them Home
- conversations and messages
- required persistent/Bring Them Home memory
- subscription verification, checkout, customer portal, and synchronization
- storage objects required by those features

STEP 1 — READ-ONLY IN-PLACE AUDIT

Before changing anything, identify and report:

A. Every environment variable and code path currently targeting kmld or any *.lovable.app runtime API.
B. Every core table, function, trigger, policy, index, storage bucket, and server endpoint required by the first-release scope.
C. What schema and data already exist in my pkh project.
D. Which AI provider/server Replit already built or configured, if any.
E. Whether existing auth user UUIDs and password hashes can be safely imported into the destination auth system. If not, describe a secure account-claim/password-reset method that keeps each user attached to all existing data.
F. Exact expected costs/free allowances for the proposed Replit hosting, database, storage, realtime, and AI provider.
G. A file-by-file change list that preserves all existing Replit UI and PWA work.

Then STOP and show me the report. Make no changes in Step 1.

STEP 2 — BUILD ONLY THE MISSING INDEPENDENT CORE IN STAGING

After approval, build a reviewed baseline schema for only the first-release scope in the existing pkh destination. Do not replay the full migration history.

Required minimum includes profiles, user_roles, ai_profiles, conversations, messages, public_living_flame_memory, required long-term memory/account-limit tables, required Sanctuary state for chat-public, and their exact indexes, triggers, grants, and row-level access policies.

Port only the required server functions: independent chat-public/messaging, subscription check, checkout, customer portal, Stripe synchronization/webhook, and required memory persistence.

Replace Lovable AI Gateway inside chat-public with the approved independent AI provider. Keep all private keys server-side in Replit Secrets. Do not put private keys in frontend code.

STEP 3 — COPY; NEVER RESET

Create an idempotent, restartable import process. Copy source data into staging in dependency order:

1. Auth identity mapping
2. profiles and user_roles
3. ai_profiles
4. conversations
5. messages in original chronological order
6. required persistent and Bring Them Home memory
7. required account/message-limit state
8. Stripe customer/product/subscription references
9. required storage objects

Preserve original UUIDs and timestamps where supported. If auth UUIDs cannot be preserved, create an auditable old-ID-to-new-ID mapping and rewrite every dependent foreign key consistently. Never migrate plaintext passwords. Do not duplicate users, messages, profiles, memories, customers, or subscriptions when the importer is rerun.

STEP 4 — COMPLETE BRING THEM HOME WITHOUT CHANGING ITS DESIGN

The current Bring Them Home page stores its form draft only on the device before auth. Keep the existing page and design, but complete the post-auth server save:

- recover the draft after auth
- let the user confirm it
- create/update the correct AI profile and isolated Bring Them Home memory
- save required consent state
- confirm persistence before clearing the local draft
- open exactly one correct conversation

STEP 5 — REWIRE ONLY AFTER STAGING PASSES

In staging only, replace the core feature endpoints so they use pkh/Replit-owned auth, database, functions, storage, realtime, and the approved independent AI provider. Do not alter unrelated features yet.

Fail the release if network logs show any core flow contacting kmld, Lovable AI Gateway, or a *.lovable.app runtime API.

STEP 6 — REQUIRED ACCEPTANCE TESTS

- Existing user securely signs into or claims the same account.
- Correct profile and every AI profile load.
- Existing conversations and exact message history survive refresh, logout/login, and reinstall.
- New user and assistant messages persist exactly once in the correct order.
- Bring Them Home survives auth redirect and creates a working persistent profile/conversation.
- Users cannot access each other’s data.
- Active Stripe subscriber receives the correct existing tier; free user does not.
- Stripe test-mode checkout, portal, cancellation, and webhook synchronization work without charging anyone.
- Required images/files load from independent storage.
- Installed PWA and clean browser work from the registered Replit production URL.
- Network audit shows zero Lovable runtime requests for these core flows.
- Existing Lovable app remains unchanged and working.

STEP 7 — SAFE CUTOVER

Show me all test results, source/destination row counts, orphan checks, storage counts, unresolved differences, endpoint audit, cost report, and rollback procedure. Wait for explicit approval before changing Replit production.

During approved cutover, import the final data delta, rerun reconciliation, and switch only Replit production’s core endpoints. If anything fails, restore the previous Replit deployment. Never delete the source Lovable data.

FINAL REQUIRED REPORT:

- What existing Replit files were preserved unchanged
- What backend/server files were added or modified
- What data was copied and reconciled
- Final independent endpoint inventory
- Proof of zero Lovable runtime requests in the core flows
- Current and projected non-Lovable operating costs
- Remaining features that still depend on Lovable and are deferred
```

## What this approach preserves

- All work Replit already completed
- The current downloadable app and its design
- Existing user information and history through copy-and-reconciliation
- Existing Stripe customers/subscriptions
- The separate Lovable sacred/sovereign platform
- A rollback path until the independent core is proven

## What must physically move

To stop buying Lovable data credits for Replit, Replit cannot merely rename an environment variable. The core records and required backend logic must exist somewhere outside Lovable before requests can be redirected there. This is a **copy and rewire**, not a destruction or restart.

The verified core source contains profiles, roles, 26-column AI profiles, conversations, 13-column messages, multiple memory surfaces, account limits, subscription fields, database functions, access policies, and `chat-public`. These will be copied or ported in the narrow first-release scope instead of rebuilding the entire website at once.
