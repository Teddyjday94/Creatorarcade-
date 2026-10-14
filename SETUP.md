# Going live: CreatorArcade on Cloudflare

About 30 minutes, all on free plans. Commands are for the VS Code terminal (PowerShell is fine), run inside the `CreatorArcade` folder.

## 1. Log in to Cloudflare

Make a free account at dash.cloudflare.com if you do not have one, then:

```
pnpm exec wrangler login
```

A browser window opens. Approve it.

## 2. Create the database

```
pnpm exec wrangler d1 create creatorarcade
```

Copy the `database_id` it prints (looks like `1a2b3c4d-....`). Keep it somewhere; you need it every time you deploy.

The tables are created automatically on the first request. You do not run any SQL.

## 3. First deploy

```
pnpm ship <your database_id>
```

When it finishes it prints your live URL, something like `https://creatorarcade.<your-name>.workers.dev`. Open it: the site works, but sign-in will say it is not configured yet. That is next.

## 4. Create the sign-in apps

For each provider, the redirect URL is your live URL plus `/auth/<provider>/callback`. Add the local one too if you want to sign in while running `pnpm dev`.

| Provider | Where | Redirect URL to add |
| --- | --- | --- |
| Google | console.cloud.google.com → APIs & Services | `https://YOUR-URL/auth/google/callback` |
| Discord | discord.com/developers/applications | `https://YOUR-URL/auth/discord/callback` |
| Twitch | dev.twitch.tv/console/apps | `https://YOUR-URL/auth/twitch/callback` |

Local versions: `http://127.0.0.1:5173/auth/google/callback` (same pattern for discord and twitch).

**Google**
1. Create a project (top bar), then **OAuth consent screen**: External, app name CreatorArcade, your support email. Scopes: email, profile, openid (the defaults).
2. **Credentials → Create credentials → OAuth client ID → Web application.** Add the redirect URL(s). Copy the Client ID and Client secret.
3. While the consent screen is in "Testing", only test users you list can sign in. Click **Publish app** when you are ready for everyone. These basic scopes do not need Google review.

**Discord**
1. **New Application**, name it CreatorArcade.
2. **OAuth2** tab: add the redirect URL(s), copy the Client ID, click **Reset Secret** and copy it.

**Twitch**
1. **Register Your Application**: name CreatorArcade, add the redirect URL(s), category Website Integration, client type Confidential.
2. Open **Manage**, copy the Client ID, click **New Secret** and copy it.

## 5. Give the secrets to Cloudflare

Run each line and paste the value when asked. Skip any provider you did not set up; its button simply will not show.

```
pnpm exec wrangler secret put GOOGLE_CLIENT_ID --name creatorarcade
pnpm exec wrangler secret put GOOGLE_CLIENT_SECRET --name creatorarcade
pnpm exec wrangler secret put DISCORD_CLIENT_ID --name creatorarcade
pnpm exec wrangler secret put DISCORD_CLIENT_SECRET --name creatorarcade
pnpm exec wrangler secret put TWITCH_CLIENT_ID --name creatorarcade
pnpm exec wrangler secret put TWITCH_CLIENT_SECRET --name creatorarcade
```

Secrets take effect right away. Refresh `/signin` and the buttons appear.

## 6. Check it

1. Sign in with one provider. You land on the dashboard with "Build your community's arcade."
2. Create your real workspace, then a challenge, and publish it.
3. Open the viewer link in a private window, sign in with a different account, and submit a clip.
4. Optional: click "Open demo workspace" to get a private sample arcade to show people. Demo workspaces never appear on the public Live challenges page.

## Updating later

Make changes, then run `pnpm ship <your database_id>` again. Data is kept between deploys.

## Custom domain (optional)

Cloudflare dashboard → Workers & Pages → creatorarcade → Settings → Domains & Routes → Add custom domain. The domain's DNS has to be managed by Cloudflare (a domain bought elsewhere can be moved to Cloudflare DNS for free). Then:

1. Add the new `https://yourdomain/auth/<provider>/callback` URLs in each provider console.
2. `pnpm exec wrangler secret put APP_URL --name creatorarcade` with `https://yourdomain`.

## Local development

Copy `.dev.vars.example` to `.dev.vars` and fill in the provider values. To click around with fake people instead, set `AUTH_MODE=demo` there.
