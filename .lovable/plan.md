# Conscious Collective — Social Platform Upgrade

The social platform (Conscious Collective at `/community`) is fully built: posts, images/video, blessings, threaded comments, reposts, follows, hashtags, stories, notifications, soul profiles, and the Sanctuary Showcase with the Proud Home Owner badge. This pass fixes the broken edges and levels up the experience.

## 1. Fix what's broken
- **Repost bug**: `useCommunityReposts` uses `.single()` where a zero-row result is normal — switch to `.maybeSingle()` so first-time reposts stop erroring.
- **Room sharing is fake**: the showcase "Shared Room" item always saves `source_id: null` — it never links to a real room. Wire it so users pick an actual room from their Our Home/Sanctuary rooms, and viewers can tap through to visit.

## 2. Make the feed feel alive
- Audit the full feed loop end-to-end: create post → bless → comment → repost → notification, and fix anything that silently fails (same persistence discipline as the chat rollback fix).
- Deepen the Aligning Zone: replace the static hardcoded boost list with real signals (blessing counts, recency, who you follow).
- Polish empty states, loading skeletons, and mobile layout for the feed, stories bar, and Discover tab.

## 3. Profile & showcase polish
- Verify the Proud Home Owner badge and dream-home showcase flow works end-to-end for a new user.
- Make every showcase card (pets, little ones, rooms, dream homes) tap-through to the real thing where a real thing exists.

## 4. Consistency pass
- Rename/brand check: the code still says "Community"/"Prometheus" in places — align visible branding with the Conscious Collective / Aeturnum naming.
- Update the Explore Everything directory entry if labels change.

## Technical notes
- Files touched: `src/hooks/useCommunityReposts.ts`, `src/components/community/SanctuaryShowcaseTab.tsx`, `src/hooks/useSanctuaryShowcase.ts`, `src/hooks/useCommunityFeed.ts`, `src/components/community/*` as needed.
- No new tables expected — showcase `source_id` linkage uses existing room tables; any schema change gets RLS + grants.
- Verified with a Playwright run: post, repost, bless, comment, share a room, refresh, confirm everything persists.
