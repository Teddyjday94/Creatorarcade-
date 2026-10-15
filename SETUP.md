# Going live on Vercel

CreatorArcade is a standard Next.js app. Every push to `main` on GitHub deploys automatically.
It needs two things before people can use it: a database and at least one sign-in provider.

## 1. Connect a database (2 minutes)

1. Vercel dashboard → the **creatorarcade** project → **Storage** tab.
2. **Create Database** → **Turso** (serverless SQLite, free tier) → follow the prompts and **Connect** it to this project.
   This adds `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to the project automatically.
3. **Deployments** → latest → **⋯** → **Redeploy**.

Tables are created automatically on the first visit. Until a database is connected, every page shows a "Connect a database" notice instead of crashing.

Already have a Turso database? Add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` under Settings → Environment Variables instead.

## 2. Create the sign-in apps

Your redirect URL for each provider is your site URL plus `/auth/<provider>/callback`, for example
`https://creatorarcade.vercel.app/auth/discord/callback`. Add `http://localhost:3000/auth/<provider>/callback` too if you want to sign in locally.

**Google** (console.cloud.google.com → APIs & Services)
1. Create a project, then **OAuth consent screen**: External, app name CreatorArcade, your support email. Default scopes (email, profile, openid).
2. **Credentials → Create credentials → OAuth client ID → Web application.** Add the redirect URL(s). Copy the Client ID and secret.
3. While the consent screen says "Testing", only listed test users can sign in. Click **Publish app** for everyone. These scopes do not need Google review.

**Discord** (discord.com/developers/applications)
1. **New Application** → name it CreatorArcade.
2. **OAuth2** tab: add the redirect URL(s), copy the Client ID, **Reset Secret** and copy it.

**Twitch** (dev.twitch.tv/console/apps)
1. **Register Your Application**: add the redirect URL(s), category Website Integration, client type Confidential.
2. **Manage** → copy the Client ID → **New Secret** and copy it.

## 3. Add the keys to Vercel

Project → **Settings → Environment Variables**. Add whichever you set up (Production and Preview):

| Name | Value |
| --- | --- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | from Google |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | from Discord |
| `TWITCH_CLIENT_ID` / `TWITCH_CLIENT_SECRET` | from Twitch |

Redeploy. The matching "Continue with …" buttons appear on `/signin`. Providers without keys are hidden.

## 4. Check it

1. Sign in. You land on "Build your community's arcade."
2. Create your workspace and a challenge, then publish it.
3. Open the viewer link in a private window, sign in with another account, submit a clip.
4. Optional: "Open demo workspace" gives you a private sample arcade for showing people. Demo workspaces never appear on the public Live challenges page.

## Custom domain

Project → **Settings → Domains** → add it (domains bought through Vercel connect in one click). Then add the new `https://yourdomain/auth/<provider>/callback` URLs in each provider console. Set `APP_URL=https://yourdomain` only if sign-in redirects to the wrong host.

## Want to show it before sign-in is set up?

Set `AUTH_MODE=demo` in Environment Variables and redeploy. Visitors pick a demo persona (owner, editor, viewer) and get a resettable sample arcade. Remove it to go back to real sign-in. Demo mode is not secure: anyone can pick any persona.

## Local development

```
pnpm install
pnpm dev
```

Open http://localhost:3000. Without `TURSO_DATABASE_URL` it uses a local `local.db` file. Copy `.env.example` to `.env.local` for keys, or set `AUTH_MODE=demo` there to click around with personas.
