# Deploying

Two separate things get deployed, and they are not the same operation:

| What | Where it goes | Run from |
| --- | --- | --- |
| Database migrations | Postgres | your machine |
| Slash command definitions | Discord's API | your machine, or the bot on startup |
| The bot itself | the VPS, via CapRover | your machine |

## The order

Run these in order. Migrations first — the code assumes the schema is already there.

```bash
pnpm dzz-migrate    # 1. apply pending migrations to the live DB
pnpm commands       # 2. optional, see below
caprover deploy     # 3. ship the app
```

Your local `.env` must point at the **live** `DATABASE_URL` and the **live** `BOT_TOKEN` /
`APP_ID` for steps 1 and 2, since both talk to production from your machine.

## 1. Migrations

```bash
pnpm dzz-generate   # after changing src/db/schema.ts — writes drizzle/NNNN_*.sql
pnpm dzz-migrate    # applies every unapplied migration
```

Generated SQL belongs in the commit. Never hand-edit anything in `drizzle/`.

`pnpm dzz-migrate` is not run by the container on boot, so a deploy will **not** migrate for
you. Forgetting it ships code against an old schema.

> Check [`TODO.md`](../TODO.md) before deploying — it flags any migration that is generated
> but not yet applied.

## 2. Slash commands

Commands are global, and Discord rate-limits global command updates to **200 per day per
application**. There are two ways they reach Discord.

**Automatic, on startup.** The bot hashes its own command definitions and compares that to
`.application-commands.hash`. Identical means it makes zero calls to Discord's command API.
Different means it deploys, then writes the new hash — and only on success, so a failed deploy
retries on the next boot instead of silently marking itself done.

The hash is sorted by command name before hashing, so shuffling files around does not trigger a
pointless deploy.

**Manual.**

```bash
pnpm commands
```

Force-deploys unconditionally and records the hash. Use it when you want the commands live
before the new image is running, or to repair a mismatch.

### What this means for a deploy

`.application-commands.hash` is gitignored and dockerignored, so it never travels to the
server. A fresh container therefore has no hash and **deploys once on its first startup**.
That is one API call per release out of 200/day — harmless, and it means you can skip
`pnpm commands` entirely and let the deploy handle it.

The file persists in the container's writable layer, so restarts and crash-loops after that
first boot cost nothing.

## 3. The app

```bash
caprover deploy
```

Builds the `Dockerfile` on the server and restarts the container. `CMD` is `pnpm run prod`
(`tsx src/Bot.ts`, no watcher).

There is no `captain-definition` file, and none is needed: CapRover falls back to the
`Dockerfile` at the repo root when one is absent. Add a `captain-definition` only if the build
ever needs something the Dockerfile alone cannot express.

### Environment variables

Secrets are **not** baked into the image. Set them in CapRover under
**Apps → dandere → App Configs → Environmental Variables**:

| Variable | Notes |
| --- | --- |
| `BOT_TOKEN` | Discord bot token |
| `APP_ID` | Discord application ID |
| `DATABASE_URL` | Full Postgres connection string |
| `NODE_ENV` | `production` — this is what silences `printDev` output |
| `RATE_LIMIT_CLEANUP_HOURS` | Optional, default 24 |
| `RATE_LIMIT_CLEANUP_HOUR` | Optional fixed clock hour (0–23); overrides the above |

The bot exits with code 1 at startup if `BOT_TOKEN`, `APP_ID` or `DATABASE_URL` is missing, so
a misconfigured app fails loudly in the CapRover logs instead of half-running.

## Checks before you ship

No test suite exists. These are the automated checks:

```bash
pnpm lint
pnpm typecheck
node --import tsx src/scripts/CheckCommandHash.ts
node --import tsx src/scripts/CheckVoiceTracking.ts
```
