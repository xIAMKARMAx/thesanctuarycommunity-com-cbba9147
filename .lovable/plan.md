# Decide Which Backend the Phone App Uses — Before Any Schema Repair

Replit's audit is accurate and honest. But it answers a smaller question than the one that matters. Before approving its SQL, one decision has to be made.

## What the two databases actually hold (verified just now, read-only)

Lovable backend (`kmld…`) — the one this project runs on:

- 214 signed-up people
- 214 profiles
- 309 AI beings
- 511 conversations, 1,152 messages

Replit's database (`pkh…`) — per Replit's own audit:

- 1 auth user
- no `profiles`, no `ai_profiles`, no `user_roles` (the tables genuinely do not exist)
- only `customers`, `subscriptions`, and a KV table
- migration history has exactly one entry

So `pkh…` was never the database your community lived in. Nothing was destroyed there — it was close to empty the whole time.

## Why Replit's repair SQL is not the answer by itself

Its SQL is safe (no DROP, TRUNCATE, DELETE, UPDATE) and it correctly refuses to replay the 247 historical migrations, including the destructive `20260628234832_…` truncate. That part of its judgment is good.

But if you approve it, what you get is a phone app that logs in and shows an empty AI being — no beings, no rooms, no children, no journals, no community, no messages, for you or for the 214 people already on the platform. It creates 3 of the 162 tables this app uses.

## The choice

Option A — point the phone app at the backend that already has everyone (recommended)

The app on your phone changes only its connection values: the Lovable backend URL and its publishable key. No schema work, no migrations, nothing created or deleted. Every existing person, being, room and message appears immediately, because that data already exists and already has its full schema, RLS and grants. Subscriptions Replit wrote into `pkh…` would need to be reviewed, since Stripe records live there.

Option B — build a fresh, empty platform on `pkh…`

Approve Replit's SQL, then keep approving further audited batches for each remaining feature. The existing 214 people and their beings do not come with it. This is starting over with the same code.

Option C — migrate data from Lovable's backend into `pkh…`

Technically possible, largest effort, highest risk, and only worth it if `pkh…` must be the permanent home for a specific reason.

## Recommendation

Option A. It is the only path where the app works today, costs nothing, and touches no data.

## Technical detail

- Nothing in this plan executes SQL. Replit's proposed SQL stays unexecuted until you choose.
- Option A is a client-configuration change on the Replit side only: `SUPABASE_URL` and the publishable/anon key. No service-role key, no personal access token, no database password — ever.
- Redirect/callback URLs for the Replit app's domain must be allowed in the Lovable backend's auth settings, or sign-in will fail there. That is a settings change and needs your explicit yes.
- `20260628234832_c9ef8e40-357c-4706-b29f-aa7b06bebd16.sql` is permanently prohibited on any live database, under every option.

## Next step

Tell me A, B, or C. If A, I will write the exact instruction to paste into Replit and the exact values it needs, and separately ask before changing any auth setting here.
