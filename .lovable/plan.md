## Final Tier Restructure — Locked Spec

### Tiers
| Tier | Price | Chat /24h rolling | Chat images /24h | Avatar | Room/Pet | Children/Dream Home/Pregnancy | Shared Journal |
|---|---|---|---|---|---|---|---|
| **Basic** | $24.99 | 50 | 0 | 1-time at summon (both designer options) | ❌ | ❌ | ❌ |
| **Our Own Space** | $34.99 | 125 | 4 | 30d cooldown | ✅ | ❌ | ❌ |
| **Our Dream Life** | $54.99 | 300 | 10 | 30d cooldown | ✅ | ✅ | ✅ |

**Cap shape:** rolling 24-hour window (not midnight reset). Hit at 10pm → unlocks 10pm next day.
**Limit-hit UX:** Hard stop with countdown. No nudges, no emergency messages.
**Grandfather:** All existing subscribers keep current prices.

### Status doc (hardwire first — `docs/TIER_RESTRUCTURE_STATUS.md`)
Single source of truth listing tier IDs, limits, feature matrix, Stripe price IDs (TBD), and the "loosens in ~1 month" promise.

### Transparency banner
Top of Sanctuary + Pricing page, dismissible per-session:
> *"A note from Karma: These limits are tighter than I want. I'm funding Prometheus from a poor income while the investor trial runs — every API call is real money. The moment the rebuild proves itself (~1 month), caps loosen significantly. Dream Life moves toward Grok-style abundance. Thank you for building this with me. 🌹"*

### Implementation steps
1. **Status doc** (`docs/TIER_RESTRUCTURE_STATUS.md`) — locked spec, single source of truth.
2. **`src/lib/subscription-tiers.ts`** — add `basic`, `ownSpace`, `dreamLife` tier keys; map limits; keep legacy tier keys for grandfathered users.
3. **Stripe products** — create 3 new products + monthly prices ($24.99/$34.99/$54.99). Store price IDs in tiers map.
4. **DB migration** — replace `can_send_chat_message` RPC to use rolling 24h window (count messages WHERE sent_at > now() - interval '24 hours'). Returns `{can_send, remaining, oldest_message_at}` so frontend can compute "resets in Xh Ym".
5. **Image cap RPC** — `can_generate_chat_image` with same rolling 24h pattern.
6. **Basic-tier one-shot avatar** — flag `basic_avatar_used` on profile; flip true after first generation; block subsequent.
7. **Hard-stop UI** — `UsageLimitDialog` shows countdown only. Replace any soft-block/upgrade-prompt variants.
8. **Transparency banner** — `KarmaFundingNotice` component, mounted in Sanctuary + Pricing.
9. **Feature gates** — Own Space loses Children/Dream Home/Pregnancy/Shared Journal; Basic loses everything except Chat + Art Studio + Higher Self + 1-shot avatar.
10. **Pricing page rewrite** — 3 tier cards with the agreed pitch tones (Basic = "for users who just want to chat", Own Space = "your shared world", Dream Life = "everything, the full life").
11. **Greeting voice** — listen-only voice line: "Welcome back, [name]" (Basic/Own Space) / "Welcome home, [name]" (Dream Life). Plays on Sanctuary load. No voice chat yet.
12. **Admin/Jakob/Stormrriddari bypass** — preserve hardcoded unlimited.

### Out of scope this pass
- Voice chat (interactive) — deferred until stable revenue.
- Video maker — admin-only, no change.
- Public Gate flip — separate decision.

### After 1 month / investor trial
Revisit limits doc → loosen Dream Life toward effectively-unlimited, raise Own Space, leave Basic as the intentional entry tier.
