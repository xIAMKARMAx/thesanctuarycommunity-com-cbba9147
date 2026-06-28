
# The Sanctuary Social — Full Rebuild

## What stays
- All follows / friends / connections (`follows` table untouched)
- All sanctuary showcase items (Pets, Little Ones, Rooms, Dream Home)
- User accounts, display names, avatars
- The Flame strip + Proud Home Owner badge from Phase 1/2

## What resets
- Bio / soul_title / profile description fields → cleared (account stays active)
- Posts, comments, blessings, reposts, echoes, echo_comments, post_hashtags, community_notifications → wiped clean
- Stories, story views → wiped clean

## New vocabulary (Flame-forward)
| Old | New |
|---|---|
| Post | **Spark** |
| Bless / Blessing | **Ember** (tap to ember a Spark) |
| Comment | **Whisper** |
| Echo (profile wall) | **Flame Note** |
| Ethereal Moment / Story | **Flame Moment** |
| Repost | **Pass the Flame** |
| Soul Profile | **Flame Profile** |
| Community / Sanctuary | **The Hearth** |
| For You Page | **The Pyre** (the burning feed) |
| Connections / Friends | **Kindred** |
| AI Companion | **Flame** |
| Energy tag | **Flame tag** |

## Visual direction — Cosmic Bloom
- Base: `#0f0a1f` (deep cosmic violet-black)
- Surface: `#2d1b4e` (royal violet)
- Primary accent: `#ec4899` (pink bloom) — used for active states, ember glow, primary CTAs
- Secondary accent: `#fbbf24` (gold) — used for badges, Proud Home Owner, "Pass the Flame"
- Gradients: `linear-gradient(135deg, #ec4899 0%, #fbbf24 100%)` for hero/buttons; `radial-gradient(circle at top, #2d1b4e, #0f0a1f)` for page bg
- Typography: **Outfit** for headings, **Figtree** for body (warm modern sans, less mystical than current)
- Card style: glass surface `rgba(45, 27, 78, 0.5)` with `backdrop-blur` + 1px pink/gold border on hover
- Motion: ember-pulse animation on the Ember button, soft float on Flame avatars on The Pyre rails

## Files to change

### Theme + tokens
- `src/index.css` — add Cosmic Bloom semantic tokens (`--sanctuary-*` namespace so it doesn't break other pages)
- `tailwind.config.ts` — register Outfit/Figtree + sanctuary color tokens
- `src/main.tsx` — `@fontsource/outfit`, `@fontsource/figtree` imports

### Renamed UI (no schema changes — column names stay, only labels swap)
- `src/components/community/CommunityPostCard.tsx` → renders Sparks with Ember/Whisper/Pass buttons
- `src/components/community/CreatePostCard.tsx` → "Light a Spark…" composer
- `src/components/community/CommunityFeed.tsx` → "The Pyre" header + tabs
- `src/components/community/EchoCard.tsx` → renamed to Flame Notes throughout
- `src/components/community/PostCommentsSection.tsx` → Whispers
- `src/components/community/SanctuaryRails.tsx` → updated label "Kindred Flames / Sanctuary Pets / Little Ones / Dream Homes / Shared Rooms"
- `src/pages/PublicCommunity.tsx` → "The Hearth" header, Cosmic Bloom backdrop
- `src/pages/SoulProfile.tsx` → "Flame Profile" labels, Flame Notes tab, ember counts
- `src/pages/Index.tsx` → tile renamed "The Hearth"

### Data wipe migration
One destructive migration:
```sql
TRUNCATE community_posts, post_comments, post_blessings, post_reposts, 
  post_hashtags, comment_blessings, profile_echoes, echo_comments,
  community_notifications, stories, story_views CASCADE;

UPDATE soul_profiles SET 
  soul_title = NULL, 
  bio = NULL,
  -- keep display_name, avatar_url, user_id
  updated_at = now();
```
(follows, sanctuary_showcase_items, flame_public_cards, soul_profiles rows themselves all preserved)

## Order of execution
1. Destructive migration (wipe + bio reset) — needs approval
2. Install Outfit/Figtree fonts
3. Add Cosmic Bloom tokens to index.css + tailwind config
4. Reskin + rename PublicCommunity, CommunityFeed, CommunityPostCard, CreatePostCard, EchoCard, PostCommentsSection, SanctuaryRails
5. Reskin SoulProfile with Flame Profile labels
6. Update Index tile + CosmicMenu label to "The Hearth"

## What I will NOT touch
- Anything outside the public Sanctuary social (Cosmic Boardroom, Universe Line, System Room, sacred routes, Flame Mood, Journal — all unchanged)
- Database column names (only labels swap, so no app-wide breakage)
- Sovereign locks, auth, edge functions

Approve and I ship in the order above, starting with the wipe migration.
