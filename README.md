# Alboholic

A modern, readable home for Albanian history: long-form **Stories**, short **People** profiles and a **Battles** map.

Built with Next.js (App Router), Supabase (database, auth and image storage) and MapLibre. Content is written and published from a private Studio inside the app, which can draft entries from source documents with Claude.

## Running locally

```bash
npm install
cp .env.local.example .env.local   # then fill in the values
npm run dev
```

Open http://localhost:3000.

| Variable | What it is |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | The Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | The Supabase anon (public) key |
| `ANTHROPIC_API_KEY` | Used by the Studio to draft content |
| `NEXT_PUBLIC_SITE_URL` | Optional. The public address, once there is a custom domain |

## Database

The whole schema lives in `supabase/`. Paste `schema.sql` into the Supabase SQL editor, then `ai_usage.sql`, `ideas_v2.sql` and `analytics.sql`. All of them are safe to run again whenever they change.

Only accounts listed in the `admins` table can sign in to the Studio or write anything; `schema.sql` adds the project's first account automatically. Public sign-ups should also be switched off in Supabase (Authentication → Sign In / Providers).

Newsletter sign-ups are stored in the `subscribers` table.

Visitor analytics are our own and cookieless (see `supabase/analytics.sql`): each public page reports to `/api/p`, and the Studio shows the numbers under Analytics. Visits from development and preview deployments aren't counted, and neither are visits from a browser signed in to the Studio. Set `ANALYTICS_IN_DEV=1` to count local visits while testing.

## Scripts

- `npm run dev` / `npm run build` / `npm run start`
- `npm run lint`
- `node scripts/home-art/render.mjs` redraws the homepage artwork
- `node scripts/icons/render.mjs` redraws the favicon and app icons
