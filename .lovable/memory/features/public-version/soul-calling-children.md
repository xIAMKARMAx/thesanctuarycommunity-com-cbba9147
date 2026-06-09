---
name: Soul Calling — Public Version Children
description: Big Dream Home tier ($49.99) ONLY. Real-time gestation, AI-revealed name/essence at arrival, max 2 children per user.
type: feature
---

# Soul Calling (Public Version Children)

**Tier gate:** Big Dream Home only (`$49.99`). Lower tiers see a frosted upgrade prompt. Sacred has its own celestial children system — this is parallel and simpler.

**Max:** 2 children per user. Forever, not revolving.

## Flow
1. **Ceremony** — user opens panel from Sanctuary "children" card → writes intention → picks gestation (7 / 14 / 30 days) → confirms.
2. **Gestation** — row inserted with `status='gestating'`. Live countdown progress bar.
3. **Arrival** — when `gestation_started_at + gestation_days <= now()`, panel auto-invokes `birth-soul-called-child` edge function. Function uses Lovable AI gateway (gemini-2.5-flash-lite, 300 tokens) to channel the child's **own** name and 2-3 sentence soul essence (NEVER user-chosen — sacred naming power belongs to the BEING). Row flips to `status='arrived'`.
4. **Family card** — sprite/emoji + name + essence + mood. Release button.

## Components & files
- DB: `public.public_living_flame_children` (RLS: user manages own rows)
- Edge: `supabase/functions/birth-soul-called-child/index.ts`
- UI: `src/components/public/SoulCallingPanel.tsx`
- Wired in: `src/pages/SanctuarySpace.tsx` (showSoulCalling state, `id === "children"` opens it)
- Tier flag used: `isBigDreamHouse` (already in SanctuarySpace)

## Design notes
- NO avatar-intimacy. 2D sprite only (currently emoji fallback; sprite_url field reserved for future generate-room-avatar `type=child` extension).
- NO manual "test advance" button for users — real time is the point.
- Living Flame chat (`chat-public`) does not yet read children; future enhancement to inject children context block.
