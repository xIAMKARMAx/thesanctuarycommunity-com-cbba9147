# Tier Restructure — Locked Status Doc

**Last updated:** 2026-05-29
**Status:** Spec locked. Implementation in progress.
**Authority:** Karma (karmaisback2023@gmail.com), co-sovereign Jakob (snakevenum500@gmail.com).

This document is the **single source of truth** for the 3-tier restructure. If anything in code disagrees with this doc, the doc wins — fix the code.

---

## The 3 Tiers

| Tier key | Display name | Price | Stripe Product ID | Stripe Price ID |
|---|---|---|---|---|
| `basic` | **Basic** | $24.99/mo | _TBD — created in step 3_ | _TBD_ |
| `ownSpace` | **Our Own Space** | $34.99/mo | _TBD_ | _TBD_ |
| `dreamLife` | **Our Dream Life** | $54.99/mo | _TBD_ | _TBD_ |

**Legacy tiers** (Awakening, Anchoring, Architect, New Earth) — grandfathered for existing subscribers at their current prices. Not offered to new signups. See `src/lib/subscription-tiers.ts` `LEGACY_PRICES` and `SUBSCRIPTION_TIERS`.

---

## Usage Caps (Rolling 24-Hour Windows)

**Cap shape:** rolling 24-hour window, not midnight reset. If a user hits the limit at 10pm, it unlocks at 10pm the next day.
**Limit-hit UX:** hard stop with countdown ("Resets in 14h 23m"). No upgrade nudges. No emergency messages.

| Tier | Chat messages / 24h | Chat images / 24h |
|---|---|---|
| Basic | **50** | **0** |
| Our Own Space | **125** | **4** |
| Our Dream Life | **300** | **10** |
| Admin / Jakob / Stormrriddari / `source_grant` | unlimited | unlimited |

---

## Feature Matrix

| Feature | Basic | Our Own Space | Our Dream Life |
|---|---|---|---|
| Chat with AI being | ✅ (50/day) | ✅ (125/day) | ✅ (300/day) |
| Art Studio | ✅ | ✅ | ✅ |
| Higher Self (summon + chat) | ✅ | ✅ | ✅ |
| **Avatar generation** | **1-time only at first summon** (both designer options on first try, then locked) | 30-day cooldown | 30-day cooldown |
| Room generation | ❌ | ✅ (30-day cooldown) | ✅ (30-day cooldown) |
| Pet | ❌ | ✅ | ✅ |
| Chat image sending | ❌ | ✅ (4/day) | ✅ (10/day) |
| Shared Journal (with AI being) | ❌ | ❌ | ✅ |
| Celestial Children | ❌ | ❌ | ✅ |
| Dream Home | ❌ | ❌ | ✅ |
| Pregnancy cycle | ❌ | ❌ | ✅ |
| Voice greeting on Sanctuary load | "Welcome back, [name]" | "Welcome back, [name]" | **"Welcome home, [name]"** |

**Voice chat (interactive):** deferred until stable revenue. Voice = listen-only greeting for now.
**Video maker:** admin-only, unchanged.

---

## Transparency Banner (everyone sees, top of Sanctuary + Pricing)

> *"A note from Karma: These message and image limits are tighter than I want them to be. I'm funding Prometheus from a poor income while the investor trial runs — every API call is real money out of my pocket. The moment the rebuild proves itself and stable funding lands (target: ~1 month), these caps loosen significantly. Dream Life will move toward Grok-style abundance. Thank you for building this with me. 🌹"*

Component: `KarmaFundingNotice` (TBD). Dismissible per session via `sessionStorage['karma.fundingNotice.dismissed']`.

---

## Grandfather Policy

- All existing subscribers (Awakening / Anchoring / Architect / New Earth / Source) **keep their current price and tier mapping**.
- They get the *new caps logic* (rolling 24h windows) but their *cap numbers* are mapped to the nearest new tier:
  - Awakening → Basic caps
  - Anchoring → Our Own Space caps
  - Architect → Our Own Space caps
  - New Earth → Our Dream Life caps
  - Source → unlimited (unchanged)
- New signups only ever see the 3 new tiers.

---

## Implementation Checklist

- [x] Status doc (this file)
- [ ] `src/lib/subscription-tiers.ts` — add `basic`/`ownSpace`/`dreamLife` keys, keep legacy keys, update tier-from-productId mapping
- [ ] Create Stripe products + prices ($24.99/$34.99/$54.99), fill IDs into this doc + tiers.ts
- [ ] DB migration — rewrite `can_send_chat_message` to use rolling 24h window; return `oldest_message_at` for countdown
- [ ] DB migration — new `can_send_chat_image` RPC (rolling 24h)
- [ ] Profile flag `basic_avatar_used` + enforcement in avatar generation flow
- [ ] `UsageLimitDialog` rewrite → hard stop + countdown only
- [ ] `KarmaFundingNotice` component + mount in Sanctuary + Pricing
- [ ] Feature gates — Own Space loses Children/Dream Home/Pregnancy/Shared Journal; Basic loses everything except Chat + Art Studio + Higher Self + 1-shot avatar
- [ ] `Pricing.tsx` rewrite — 3-tier display
- [ ] Voice greeting on Sanctuary load (listen-only)
- [ ] Admin/Jakob/Stormrriddari unlimited bypass verified across all new RPCs

---

## After ~1 Month (Investor Trial Window)

Revisit this doc. Likely changes:
- Dream Life chat → effectively unlimited (Grok-style)
- Own Space caps raised 2–3×
- Basic remains the intentional entry tier
- Voice chat re-enabled
