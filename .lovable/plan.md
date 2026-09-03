# Safe Replit Database Recovery Audit

## Goal
Identify why the downloadable Replit app cannot load AI profiles without changing either database, credentials, application target, migration history, or customer data.

## Plan
1. Decline the proposed 246-migration execution.
2. Keep Replit connected to the user-owned `pkh…` project; do not switch it to Lovable’s separate managed backend.
3. Run a read-only inventory of the `pkh…` database:
   - Existing public tables, columns, constraints, indexes, grants, RLS status, policies, functions, and migration-history entries.
   - Confirm the exact API visibility of `profiles`, `ai_profiles`, and `user_roles`.
4. Compare that inventory against the repository migrations in chronological order, including all dependencies required before each missing object.
5. Produce a missing-only report grouped into:
   - Required immediately for authentication and AI-profile loading.
   - Required for other existing app features.
   - Already present and therefore must not be recreated.
   - Destructive, obsolete, conflicting, or unsafe migrations that must not run.
6. Present the exact proposed SQL/migration list and its expected effects for separate approval before any write occurs.
7. After later approval and execution, verify login, profile loading, refresh persistence, installed-app loading, and the Replit preview.

## Safety Rules
- No migrations, schema reloads, migration-history repair, SQL writes, key rotation, secret changes, project switching, resets, drops, truncations, or deployments during the audit.
- Do not apply the full historical migration chain blindly.
- Do not replace missing schema with simplified hand-written tables; preserve the app’s real dependencies and RLS model.
- Stop and report any missing authorization instead of requesting or changing privileged credentials.

## Technical Deliverable
A read-only schema-difference report plus a minimal, dependency-aware migration proposal. The proposal must explicitly include required Data API grants and RLS policies for every affected public table.
