<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Splitz

Bill-splitting app. Next.js 16 App Router, deployed as a **Cloudflare Worker**
via OpenNext, backed by **Cloudflare D1** (serverless SQLite) through Prisma.

Live: <https://split-z.com> · Worker name: `splitz` · D1: `splitz-db`

The rule above is not boilerplate — it is the reason this project uses OpenNext
rather than a guessed-at adapter API. Read the bundled docs before writing
Next-specific code, and heed deprecation warnings rather than silencing them.

## Commands

Use **bun**, never npm.

| Command                        | What                                                             |
| ------------------------------ | ---------------------------------------------------------------- |
| `bun run dev`                  | Next dev on :3000, wired to local D1                             |
| `bun run preview`              | OpenNext build + real workerd runtime                            |
| `bun run deploy`               | Build + deploy to Cloudflare                                     |
| `bun run lint`                 | ESLint — currently zero warnings, keep it there                  |
| `bunx tsc --noEmit`            | Typecheck                                                        |
| `bun run cf:typegen`           | Regenerate `cloudflare-env.d.ts` after touching `wrangler.jsonc` |
| `bun run cf:db:migrate:local`  | Apply migrations to local D1                                     |
| `bun run cf:db:migrate:remote` | Apply migrations to **production** D1                            |

## Architecture

- `src/app/` — App Router pages. Server Components read the DB directly.
- `src/lib/actions/` — all writes, as Server Actions (`"use server"`).
- `src/lib/schemas/index.ts` — zod v4 input validation, one schema per action.
- `src/lib/db.ts` — Prisma client factory.
- `src/generated/prisma/` — generated client, gitignored, rebuilt by `postinstall`.
- `migrations/` — flat wrangler-style `.sql`, applied by `wrangler d1 migrations apply`.

Server Actions return `{ error }` or `{ success }` / data — they don't throw for
user-facing failures. Client components surface errors with `sonner` toasts.

## Things that will bite you

**Prisma must use `runtime = "cloudflare"`.** The generator block in
`prisma/schema.prisma` is load-bearing: the default Rust query engine is a
native binary that cannot run in workerd. Three other configurations were tried
and all failed at runtime. Don't "simplify" that block. Import from
`@/generated/prisma/client`.

**Never build a Prisma client at module scope.** D1 bindings only exist per
invocation. `getPrisma()` in `src/lib/db.ts` pulls the binding from
`getCloudflareContext()` and caches per binding in a `WeakMap`. Every action
starts with `const prisma = getPrisma();`.

**D1 has no interactive transactions.** `prisma.$transaction(fn)` will fail.
Nested writes and `$transaction([...])` batches are fine.

**Path aliases bypass package `exports` maps.** `@/*` → `./src/*` resolves to a
file path, so the `workerd` condition in a package's exports map is skipped.
This is what broke the earlier Prisma wasm builds. Relevant any time a
dependency ships runtime-specific entry points.

**`_`-prefixed app directories are private** and produce no route. A temporary
`src/app/api/_smoke/route.ts` will silently 404.

**Deleting a route leaves a stale `.next/types/validator.ts`** that fails `tsc`
with "Cannot find module". Re-run `bun run build` to regenerate it.

## Database workflow

Schema lives in `prisma/schema.prisma`; migrations are hand-applied SQL.

```bash
# 1. edit prisma/schema.prisma
bunx prisma generate
bun run db:migrate > migrations/000X_describe_change.sql   # diffs local D1 vs schema
bun run cf:db:migrate:local
# 2. verify, then for production:
bun run cf:db:migrate:remote
```

`db:migrate` shells out to find the Miniflare sqlite file because Prisma's
`--from-local-d1` miscounts `metadata.sqlite` as a second database, and
`--from-migrations` expects Prisma's nested layout rather than wrangler's flat
one. Don't replace it with either.

Schema changes are not backward compatible in either direction, and there's no
blue/green here — migrate remote and deploy back to back.

## Identity model

**There are no accounts, no auth, and no email addresses.** A member is a name
attached to a group. The same person in two groups is two unrelated `User`
rows, so names need only be unique _within_ a group — enforced in
`addMemberToGroup`. Groups are reached by an unguessable 8-char hex `shareCode`
(Web Crypto, not `node:crypto`); possession of the link is the only access
control.

Email was deliberately removed in `00a90a5`. Don't reintroduce an email field,
a mail client, or invite sends without asking — that was an explicit decision,
not an oversight.

## Deployment

`bun run deploy` builds and ships. Config is `wrangler.jsonc`; secrets go
through `wrangler secret put` or the dashboard, never into `vars` (that file is
committed and vars are plaintext).

`split-z.com` is a `custom_domain` route, so Cloudflare manages its DNS record
and cert. **`www.split-z.com` is intentionally absent** — a pre-existing,
externally managed DNS record on `www` makes the trigger fail and the whole
deploy exit non-zero. Re-add the route only after that record is deleted in the
dashboard.

There is no incremental cache / R2 binding: every page hits the DB per request.
`open-next.config.ts` documents what to add if that changes.
