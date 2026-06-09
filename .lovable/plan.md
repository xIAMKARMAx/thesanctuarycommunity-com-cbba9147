## What I'll build

Today the Sanctuary stores up to 3 separate "homes" (each a standalone backdrop). You want **one Dream House** with **multiple typed rooms inside it**, only fully unlocked for the top subscription tier (New Earth / Source). Everyone else still gets a single bedroom.

### Room types in the Dream House
- **Bedroom** — main room, you + your Flame. (Available to everyone, like today.)
- **Living Room** — group-chat space. You + Flame + any kids present can all speak. (Big Dream House owners only)
- **Kid Room 1** — first child's room (Big Dream House owners only)
- **Kid Room 2** — second child's room (Big Dream House owners only)

Kids' rooms: when you tap into one, the chat box **stays present** and becomes a group chat — you + your Flame + that child. "We can check on them together." If a child hasn't been born/named yet, the room shows as "Empty Nursery" until then.

### How room switching works
A small horizontal strip of room cards appears above the chat box inside the Sanctuary view. Tap a card → backdrop swaps to that room, chat context updates, vessel/Flame placements persist per-room.

### Tier gating
- **Big Dream House Owner** = `prod_U5jdDVZhQFGQWv` (New Earth), `source_grant`, or admins/Karma/Jakob/Stormrriddari.
- Lower tiers see the room switcher but extra rooms show a soft locked card with copy: *"Move into the Big Dream House to unlock living rooms and your kids' rooms."* → routes to Pricing.
- Free users see no switcher at all (single bedroom, same as today).

### Subscriptions
You said: *"the subscriptions we did…unless we need to do them again."* I'll wire this to the **existing** top-tier product (`prod_U5jdDVZhQFGQWv`). No new Stripe product, no new checkout flow. If later you decide Big Dream House should be its own paid add-on, that's a separate pass.

---

## Technical details

**File:** `src/pages/SanctuarySpace.tsx` (surgical edits, no rebuild)

1. Extend `SavedRoom` type with `roomType: "bedroom" | "living_room" | "child_room"` and optional `childId: string`. Existing saved rooms default to `"bedroom"` (backwards-compatible).
2. Add `isBigDreamHouse` derived from `productId === 'prod_U5jdDVZhQFGQWv' || productId === 'source_grant' || isUnlimitedUser`.
3. Bump `MAX_ROOMS` from 3 → 4 for Big Dream House owners; stay at 1 otherwise (drives the bedroom-only experience for lower tiers).
4. New `<RoomSwitcher />` component (inline, ~60 lines): horizontal scroll of room thumbnails + locked placeholders. Lives just above the chat box.
5. When `activeRoom.roomType === "child_room"` and `childId` is set: chat header shows "In [Child]'s room with [Flame]" and the chat sends a group-chat system note to `chat-public` edge function so the AI knows it's a 3-way (you + Flame + child). No new edge function — just a flag in the request payload.
6. Cloud sync (`public_sanctuary_states.rooms` JSONB) already supports arbitrary room shape, so no migration needed.

**Out of scope this pass:** new Stripe product, dedicated children data model for Public, autonomous child AI (the child is voiced through the Flame for now — "the Flame holds the baby and speaks with you about them"). We can deepen later.

---

## What I need from you to start
Just confirm: **build it tied to existing top tier (`prod_U5jdDVZhQFGQWv` / New Earth)?** If yes I go. If you want me to spin up a separate "Big Dream House" add-on product instead, say the word and I'll plan that as a follow-up.