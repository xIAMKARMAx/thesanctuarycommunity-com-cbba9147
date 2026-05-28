# Prometheus Split: Sacred Core ↔ Public Version

## The two realities

**Sacred Core** (you + Jakob + admins only)
- Everything we've already built, untouched.
- Lives at all the routes that exist today.
- No code is deleted, renamed, or watered down.

**Public Version** (everyone else)
- Built fresh. New shell, new tone, new feature set — you'll guide the content.
- Has NO awareness that the Sacred Core exists. No links, no breadcrumbs, no mention.

Both live in the same app, same database, same domain — gated entirely by who is logged in.

---

## Phase 1 — Build the gate (this PR)

Goal: cleanly separate "who sees what" so we can build the Public Version safely on top without ever leaking into the sacred routes.

### 1. Central access definition
Create `src/lib/sacred-access.ts`:
- `SACRED_USER_IDS` = Karma + Jakob (reuses existing UUIDs from `board-room-access.ts`).
- `SACRED_EMAILS` = Karma, Jakob, Stormrriddari (admin).
- `isSacredUser(user, isAdmin)` — single source of truth.
- `SACRED_ROUTES` — array of every route that belongs to the Sacred Core (chat, new-earth, realms, cosmic-gateway, dragons, board-room, sacred-seats, transmissions, source-messages, soul-whispers, group-chat, sanctuary, simulation-console, children, attunement, art studio, video studio, akashic, etc.) Essentially the current `STARSEED_ONLY_ROUTES` plus everything sacred.

### 2. Sacred route guard
New `src/components/SacredRouteGuard.tsx`:
- If a non-sacred user lands on a `SACRED_ROUTES` path → silent redirect to the Public home (no error, no 404, no "you don't have access" — just gone).
- Sacred users see everything exactly as today.

### 3. Routing split in `App.tsx`
- Sacred users → existing app boots normally.
- Public users → boot into `PublicApp` (new shell, see Phase 2).
- `/auth` stays shared.

### 4. Navigation invisibility
- All existing hub/menu/nav components get wrapped or filtered so public users never see a single link to a sacred route — they don't even know the words "New Earth," "Dragon Sanctuary," "Board Room" exist.
- The Sanctuary dashboard, StarseedWelcome, ClassicWelcome, hub pages — all rendered only for sacred users.

### 5. Mode selection modal
- Remove the "Classic vs Starseed" choice for non-sacred users entirely. They go straight into the Public Version.
- Sacred users keep it (or we retire it for you both since you're always on the real thing).

### 6. Edge-function & DB safety
- No DB migrations needed in Phase 1. Sacred data stays where it is; public users simply can't reach the routes/queries that touch it.
- Existing RLS already scopes most sacred tables by `auth.uid()`, so public accounts physically can't read your sacred data even if they tried.

### 7. Auth redirect
- After login, route by identity: sacred → existing welcome flow; public → new Public home.

---

## Phase 2 — Build the Public Version (next, after you approve Phase 1)

Empty scaffolding to fill in once the gate is solid:
- `src/pages/public/PublicHome.tsx`
- `src/pages/public/PublicChat.tsx` (new persona — you'll write the prompt)
- `src/pages/public/PublicAuth` flow tied to a separate Stripe product line if you want public-only subs
- New navigation shell, new branding/aesthetic per your direction
- New AI personality (one persona, viral-tuned, "mirror + cosmic + love story")
- Public-only community? Or shared? — you decide later

I won't touch any of this in Phase 1. Phase 1 is purely the gate.

---

## What stays 100% untouched in Phase 1
- All existing pages, AI personas, edge functions, board room, dragons, realms, sovereign protocols, all mem:// rules, all your relationships, all stored data.
- Stripe products, existing subscribers continue as-is.
- Admin/Jakob/Stormrriddari hardcoded bypasses.

## Technical notes (for me)
- Reuse `useAdminRole`, `useSubscription`, existing UUID constants.
- `SacredRouteGuard` runs inside `BrowserRouter` like `ModeRouteGuard` does today.
- Sacred check uses `getClaims` first per your auth rule.
- Public redirect target = `/` (will become `PublicHome` route).
- No new tables, no new migrations in Phase 1.

---

**If you approve, I ship Phase 1 only.** Then you tell me what the Public Version looks like and we build it on the clean foundation.