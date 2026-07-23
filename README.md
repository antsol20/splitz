# Splitz

Split bills with friends. Next.js 16 (App Router) running as a **Cloudflare Worker**
via [OpenNext](https://opennext.js.org/cloudflare), backed by **Cloudflare D1**.

## Local development

```bash
bun install
bun run cf:db:migrate:local   # apply migrations to the local D1 (.wrangler/state)
bun run dev                   # http://localhost:3000
```

`next dev` gets its D1 binding from the local Miniflare state via
`initOpenNextCloudflareForDev()` in `next.config.ts`, so it talks to the same
local database the Worker does.

To exercise the actual workerd runtime instead of Node:

```bash
bun run preview
```

## First-time Cloudflare setup

1. **Authenticate** (interactive — run this yourself):

   ```
   bunx wrangler login
   ```

2. **Create the D1 database** and paste the returned `database_id` into
   `wrangler.jsonc` (it currently reads `REPLACE_WITH_D1_DATABASE_ID`):

   ```bash
   bun run cf:db:create
   ```

3. **Apply the schema** to the remote database:

   ```bash
   bun run cf:db:migrate:remote
   ```

4. **Set the mail API key** (see [Email](#email)):

   ```bash
   bunx wrangler secret put MAIL_API_KEY
   ```

5. **Deploy**:

   ```bash
   bun run deploy
   ```

### DNS for split-z.com

`wrangler.jsonc` declares `split-z.com` and `www.split-z.com` as **custom
domains**. Because the zone already uses Cloudflare nameservers, the first
`bun run deploy` creates the proxied DNS records and issues the certificate
automatically — no manual record entry needed. Certificate issuance usually
takes a few minutes on the first deploy.

## Database

The schema lives in `prisma/schema.prisma`. Prisma runs through the
`@prisma/adapter-d1` driver adapter with `runtime = "cloudflare"`, which uses
the TypeScript query compiler instead of the Rust engine (the engine binary
cannot run in a Worker).

Migrations are plain SQL in `migrations/`, applied with `wrangler d1 migrations
apply`. After changing the schema, generate the next migration with:

```bash
bun run db:migrate > migrations/000X_your_change.sql
bun run cf:db:migrate:local
```

> D1 does not support interactive transactions. Avoid `prisma.$transaction(fn)`;
> nested writes and `$transaction([...])` batches are fine.

## Email

`src/lib/email.ts` talks to the Splitz mail API (`API_USAGE.md`) — a send-only
`POST /send` endpoint authenticated with a bearer token. Every send is
best-effort: `sendGroupInviteEmail` returns `{ sent, messageId?, error? }` and
never throws, so a mail failure cannot roll back the write it accompanies.

- Sender is `hello@split-z.com` — the API rejects any other domain with `403`.
- Both `html` and `text` are always sent; interpolated names are HTML-escaped.
- `502`s and network errors are retried 3× with exponential backoff. `4xx` is
  never retried, since the request itself is what's wrong.

Configuration:

| Name           | Kind       | Where                                                         |
| -------------- | ---------- | ------------------------------------------------------------- |
| `MAIL_API_URL` | var        | `wrangler.jsonc` (defaults to `https://mail-api.split-z.com`) |
| `MAIL_API_KEY` | **secret** | `wrangler secret put` or the dashboard — see below            |

With no `MAIL_API_KEY` set, sends are skipped and logged rather than attempted,
which keeps local development working without a key.

### Setting MAIL_API_KEY

CLI (recommended — writes straight to the deployed Worker):

```bash
bunx wrangler secret put MAIL_API_KEY
```

Dashboard: **Workers & Pages → splitz → Settings → Variables and Secrets → Add**,
set type to **Secret**, name `MAIL_API_KEY`, paste the key, **Save and deploy**.
Encrypted secrets are write-only — you can replace the value but never read it
back. Do **not** add it under `vars` in `wrangler.jsonc`; that file is committed
and its values are plaintext.

For local development, copy `.dev.vars.example` to `.dev.vars` and fill it in.
`.dev.vars` is gitignored.

> The Worker fetches `mail-api.split-z.com`, which is in the same zone as the
> app. The `global_fetch_strictly_public` compatibility flag in `wrangler.jsonc`
> is what makes that request leave for the public internet instead of looping
> back into this Worker — don't remove it.
