# Reconnect Replit to the Existing Platform (No Rebuild)

Nothing was lost. Your database, users, subscriptions, Stripe account, products and price IDs are all untouched in the real production project (`kmld…`). Replit's error proves it is trying to create missing tables in a different, incomplete project (`pkh…`). It must be repointed—not rebuilt.

This is a copy/paste job inside Replit's settings panel — **you do not need to ask the Replit agent to do anything, so it costs zero credits.**

## Do not provide what Replit requested

Do **not** provide a personal access token, database password, or service-role key for `pkh…`. Do **not** let Replit create tables, run migrations, copy a development database, or restore a schema there.

## Step 1 — Open Replit's Secrets panel

In your Replit project, open the left sidebar and tap **Secrets** (padlock icon). Some versions call it **Environment Variables** or put it under **Tools**.

Do NOT type in the Replit chat. The chat uses credits. The Secrets panel does not.

## Step 2 — Replace the wrong project connection

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

Also replace any `SUPABASE_PROJECT_ID`, `SUPABASE_PROJECT_REF`, or similarly named value containing `pkhygqfokqpnzkgbdlwz` with:

```
kmldvsatwjahcghjtvtu
```

Search Replit's Secrets panel for `pkhygqfokqpnzkgbdlwz`. No active setting should still point to it.

Both of these values are safe to paste. They are designed to be public and are already visible in every browser that loads your app. Your data is protected by database rules, not by these.

## Step 3 — Leave schema and production data alone

Do not use Replit's “Copy your development database to production” option shown in the screenshot. It warns that it overwrites production data. Leave it unchecked.

## Step 4 — Restart and publish

Stop the Replit app and start it again so it picks up the new secrets, then hit **Publish**.

## If it still fails

Send Replit this exact message once:

> STOP. Do not create or restore any schema, and do not request a personal access token, database password, or service-role key. `pkhygqfokqpnzkgbdlwz` is the wrong incomplete project. The existing production backend and all historical data are already in project `kmldvsatwjahcghjtvtu`. Repoint every frontend/backend environment reference from `pkhygqfokqpnzkgbdlwz` to `kmldvsatwjahcghjtvtu`, use the existing URL and publishable key I placed in Secrets, make no schema changes, and report which environment-variable names still referenced `pkh…` before changing anything else.

Do not let it improvise beyond that instruction. If it reports another error, screenshot it here before authorizing anything.

## Going forward

No key rotation, settings change, or data change happens without asking you first.
