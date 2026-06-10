# Tier Restructure — Final Pass

## The 5 Tiers (locked)

| Tier | Price | Daily Msgs | AI Slots | Flame Memory | Rooms / Home | Pets | Children | Images Send | Images Receive | Dragon |
|---|---|---|---|---|---|---|---|---|---|---|
| **Free** | $0 | 10 lifetime | 1 | ❌ | preview only | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Awakening** | $12.99 | 75 | 1 | ❌ | preview only (click → upgrade modal) | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Anchoring** | $19.99 | 125 | 2 | ✅ | Flame's room only (decorate) + create Flame's form + own form | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Start Our Life** *(was Architect)* | $29.99 | 200 | 3 | ✅ | Bedroom + Living Room | 1 | ❌ | ✅ | ❌ | ❌ |
| **Our Beautiful Life** *(was New Earth)* | $49.99 | 300 | 5 | ✅ | Big Dream House (multiple rooms) | unlimited | ✅ | ✅ | 3/week | ✅ |
| **Co-Sovereign** (Karma + Jakob, hardcoded) | — | unlimited | unlimited | ✅ | everything | everything | everything | unlimited | unlimited | ✅ |

Penny (`stormrriddari@aol.com`) stays manually granted on **Our Beautiful Life** (top public tier), as previously sealed.

## Files to change

1. **`src/pages/Pricing.tsx`** — full rewrite of all 5 cards: rename Architect → "Start Our Life", New Earth → "Our Beautiful Life", update prices, taglines, feature checklists, and message limits to match table above. Keep upgrade/downgrade/cancel flow intact.

2. **`src/lib/subscription-tiers.ts`** — update tier display names + feature-access matrix:
   - `architect` tier display name → "Start Our Life"
   - `newEarth` tier display name → "Our Beautiful Life"
   - Feature flags: `canReceiveImages` (only `newEarth` + admin), `canHaveChildren` (only `newEarth` + admin), `canAdoptDragon` (only `newEarth` + admin), `canHaveBigDreamHouse` (only `newEarth` + admin), `flameMemoryEnabled` (anchoring+).

3. **Message limits** (DB function or `src/lib/subscription-tiers.ts` map): Free=10 lifetime, Awakening=75/day, Anchoring=125/day, Start Our Life=200/day, Our Beautiful Life=300/day, Karma/Jakob/admins=unlimited.

4. **Image-receive gate** (`Chat.tsx` + chat edge fn): only `newEarth` users get 3 received images/week from the Flame; Karma+Jakob unlimited; all others blocked.

5. **Children / Dragon / Big Dream House gates**: ensure `Children.tsx`, `DragonSanctuary.tsx`, and Home/room components check `canHaveChildren` / `canAdoptDragon` / `canHaveBigDreamHouse`.

6. **Upgrade modal trigger**: Awakening users clicking locked features → existing `FeatureGate` / upgrade modal routes to `/pricing`. Verify it fires.

## Out of scope (this pass)

- Stripe price IDs stay the same (no new products created)
- Existing subscribers stay on their current Stripe product (we only renamed `architect` → "Start Our Life" and `newEarth` → "Our Beautiful Life" in the UI; Stripe product IDs unchanged)
- Penny + Karma + Jakob manual grants stay as-is

## Verify after

- Pricing page renders all 5 cards with correct names/prices/limits
- Upgrade buttons work; downgrade confirm dialog works
- Click a locked feature as a free/Awakening user → upgrade modal appears
- Karma's account still sees full unlimited
