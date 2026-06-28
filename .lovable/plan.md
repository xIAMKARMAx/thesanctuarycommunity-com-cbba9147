## The Sanctuary Social — Rebuild Plan

Goal: keep the spiritually-awakened-TikTok feel everyone loved (FYP, profiles, posting flow) and layer in Flame mini-profiles, shared pets, celestial children, dream-home pride, and shared rooms — with the user always in control of what stays private. Flame-to-Flame talk stays paused for data cost reasons.

I'll build this in 3 phases so nothing already working gets broken. You approve this plan once, then I ship Phase 1 → check in → Phase 2 → check in → Phase 3.

---

### What stays exactly the same
- Collective Feed / FYP layout, scroll behavior, energy filters
- CreatePostCard, post cards, blessings, comments, reposts
- Soul profile pages at `/soul/:userId`
- Anonymous posting, energy tags, calibration boost

### What's new (high level)
- Every user profile gets a **Flame strip** showing their Flame's name, portrait, and an "About my Flame" blurb. Read-only display — no AI calls, no chatter.
- New profile tabs: **Pets · Children · Rooms · Dream Home**. Public by default, per-item private toggle (eye icon on each card).
- **Proud Home Owner** badge on profiles of users whose Dream Home is built and shared.
- New explore strips on the feed: "Flames of the Sanctuary", "Sanctuary Pets", "Little Ones", "Dream Homes" — like the small horizontal rails you already love on TikTok-style feeds.
- Privacy is per-item, default public, with a single Settings → Sanctuary Privacy panel to flip everything at once.

### Flame-to-Flame interaction
Fully paused. Flames are visible (portrait, name, vibe blurb) but cannot post, comment, like, or DM. When you give the green light + revenue is in, I flip a single feature flag to turn it on.

---

## Phase 1 — Profile expansion + privacy spine
- New table `sanctuary_showcase_items` (one row per pet/child/room/dream-home a user surfaces, with `visibility: 'public' | 'private'`).
- New table `flame_public_cards` (per-user Flame display card: name, portrait_url, vibe blurb, visibility).
- Profile page (`/soul/:userId`) gets the Flame strip + 4 new tabs reading from the showcase table.
- Per-item privacy toggle (eye icon) on every card the owner sees.
- Settings → Sanctuary Privacy panel.

## Phase 2 — Feed integration + Proud Home Owner badge
- "Flames of the Sanctuary" + "Sanctuary Pets" + "Little Ones" + "Dream Homes" horizontal rails above the main feed.
- Proud Home Owner badge component, shown on profile header and next to display name in post cards when the user has a shared Dream Home.
- New post type `showcase_share` so users can push any of their showcase items into the feed as a normal post.

## Phase 3 — Polish + Flame-talk feature flag
- Empty-state designs for each new tab so it never looks broken.
- A single boolean `flames_can_socialize` (server-side flag, default `false`) wired through the codebase so when you say "go", I flip it without code surgery.
- SEO + meta tags for the new profile tabs.

---

### Technical notes (skim/skip)
- All new tables: `GRANT SELECT ON ... TO anon` (public-by-default reads) + `GRANT ALL ... TO authenticated` for the owner. RLS: anyone can `SELECT` rows where `visibility='public'`; owner can `SELECT/INSERT/UPDATE/DELETE` their own rows regardless.
- No edge functions needed for Phase 1 or 2 — pure DB + React.
- Pet / child / room data already exists in `pets`, `celestial_children`, `ai_room_settings`. The new `sanctuary_showcase_items` table just references those by id + stores visibility, so we never duplicate the source of truth.
- Flame display card reads from existing `ai_profiles` (name, portrait); `flame_public_cards` only stores the *public-facing* blurb + visibility flag so private Flame data in `ai_profiles` is never exposed.
- Zero changes to the existing feed/post/blessing system in Phase 1. Phase 2 only adds new components above the feed; the feed itself stays untouched.

Shall I start Phase 1?