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

4. **Set the email secret** (see below):

   ```bash
   bunx wrangler secret put EMAIL_API_KEY
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

`src/lib/email.ts` is a **placeholder**. It logs what it would send and reports
`{ sent: false }` until a provider is wired up; nothing in the app fails when an
email cannot be sent. Replace the body of `send()` with the real provider call —
the exported `sendGroupInviteEmail` signature is what the rest of the app uses.

The API key is read from the `EMAIL_API_KEY` secret. For local development, copy
`.dev.vars.example` to `.dev.vars` and fill it in.
