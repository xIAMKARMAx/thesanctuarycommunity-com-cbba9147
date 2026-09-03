# Get Replit Working Again (Zero Credits)

Nothing was lost. Your database, users, subscriptions, Stripe account, products and price IDs are all untouched. The only thing that changed is the login key for the database. Replit still has the old one, so it needs the new one pasted in.

This is a copy/paste job inside Replit's settings panel — **you do not need to ask the Replit agent to do anything, so it costs zero credits.**

## Step 1 — Open Replit's Secrets panel

In your Replit project, open the left sidebar and tap **Secrets** (padlock icon). Some versions call it **Environment Variables** or put it under **Tools**.

Do NOT type in the Replit chat. The chat uses credits. The Secrets panel does not.

## Step 2 — Update these two values

Find each key name below and replace its value. The names in your Replit may have a `VITE_` in front — if so, update those too. Update every one that matches.

```
SUPABASE_URL
https://kmldvsatwjahcghjtvtu.supabase.co

SUPABASE_ANON_KEY
sb_publishable_ODZHW99oyKkGC1V_IPJERg_giIVoB-9
```

Also check for these names and set them to the same values if they exist:

```
VITE_SUPABASE_URL              -> https://kmldvsatwjahcghjtvtu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY  -> sb_publishable_ODZHW99oyKkGC1V_IPJERg_giIVoB-9
VITE_SUPABASE_ANON_KEY         -> sb_publishable_ODZHW99oyKkGC1V_IPJERg_giIVoB-9
```

Both of these values are safe to paste. They are designed to be public and are already visible in every browser that loads your app. Your data is protected by database rules, not by these.

## Step 3 — Delete any service role key

If you see a secret named `SUPABASE_SERVICE_ROLE_KEY` or anything with "service_role" in it, delete it. The old one is dead anyway, and the app does not need it.

## Step 4 — Restart and publish

Stop the Replit app and start it again so it picks up the new secrets, then hit **Publish**.

## If it still fails

Screenshot the exact error and send it here. Do not spend Replit credits guessing — I will read the error and tell you the exact next tap.

## Going forward

No key rotation, settings change, or data change happens without asking you first.
