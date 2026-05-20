# TODO

## Missing Features / Next Steps

- **Premium subscription feature** — The `premiumPlans` and `premiumSubscription` tables exist in the schema but no commands or logic use them. Either implement the feature or remove the dead schema to avoid confusion.

- **Rate limiting for commands** — There is no per-user or per-guild cooldown on slash commands. Add a simple in-memory cooldown map to prevent command spam from triggering Discord rate limits.

- **Auto-deploy commands on startup** — Instead of a manual `npm run commands` step, compare a hash of the local serialized command definitions against what Discord currently has registered and only call `PUT applicationCommands` when they differ. Discord rate-limits global command updates to 200/day per app, so change-detection is necessary before enabling this.

- **Remove `DeleteCommands.ts`** — `PUT applicationCommands` with a body already replaces all commands atomically; the delete step is redundant. Remove the script and drop the delete step from the `commands` npm script.

- **Replace `require()` with dynamic `import()` in command loading** — `src/events/commandsCreate.ts` and `src/scripts/DeployCommands.ts` use `require(filePath)` on `.ts` files. Switch to `await import(filePath)` for idiomatic ESM and forward-compatibility if the project ever moves off `tsx`.

- **Per-channel tracking** — The `channelTracking` table and `trackvoice-all` command suggest per-channel opt-in was planned but only `trackAll` is implemented. The per-channel enable/disable flow is incomplete.

## Pending DB Changes

_Batch these together and run `dzz-generate` + `dzz-migrate` once there are enough to justify a migration._

- **`src/db/schema.ts` `channelTracking`** — Remove redundant `index("voicetrack_guildId_idx")`; the unique index already covers the column.

## Pending Dependency Updates

_Do a full dependency update pass in one go._

- **`drizzle-kit`** — pinned to `0.18.1` but `drizzle-orm` is `0.44.2`; `drizzle.config.ts` uses `dialect` which doesn't exist in the old kit's `Config` type. Upgrade `drizzle-kit` to a version compatible with `drizzle-orm@0.44` and verify the config shape.

## Completed

- **Graceful shutdown** — Added `SIGTERM`/`SIGINT` handlers in `src/Bot.ts`; exported `sql` pool from `db/client.ts` so both the Discord client and DB connection close cleanly on shutdown.
- **`/status` command** — Added `src/commands/info/status.ts`; Administrator-only, ephemeral reply with bot online status, WebSocket ping, and DB connectivity.
- **Dockerfile production build** — Added `prod` script (`tsx src/Bot.ts`, no `--watch`); updated `CMD` to use it instead of `npm start`.

- **`src/db/ignoreUsers.ts`** — Extracted `addIgnoredUser(guildId, userId)` and `removeIgnoredUser(guildId, userId)` helpers; updated `ignoreuser.ts` and `unignoreuser.ts` to use them.
- **`src/types/ClientType.d.ts`** — Defined `Command` interface (`{ data: SlashCommandBuilder; execute: (interaction: ChatInputCommandInteraction) => Promise<void> }`); `commands` collection now typed as `Collection<string, Command>`.
- **`src/events/commandsCreate.ts`** — Added comment documenting that `.ts` filter is intentional since `tsx` is the only runtime.
- **`src/events/trackVoice.ts`** — Rewrote unclear comment on cross-guild transitions.

- **`Dockerfile`** — Removed `ARG`/`ENV` lines for `BOT_TOKEN`, `APP_ID`, `DATABASE_URL`; secrets are now injected at runtime by CapRover.
- **`src/Bot.ts`** — Added startup validation: checks all required env vars are non-empty and calls `process.exit(1)` with a clear message if any are missing.
- **`src/commands/trackvoice/ignoreuser.ts`** — Added regex guard (`/^\d{17,20}$/`) on `user.id` before writing to the database.
- **`src/db/schema.ts` `ignoreUsers`** — Changed from `varchar` to `text[]`; updated `ignoreuser.ts` and `unignoreuser.ts` to use array operations. Migration applied to live DB.

- **`src/commands/mod/clear.ts`** — Removed dead `isNaN(amount)` guard; added missing `return` after range-check reply.
- **`src/events/trackVoice.ts`** — Replaced inverted mute/deaf/video early-returns with a single guard that only skips when neither channel nor streaming changed.
- **`src/db/client.ts`** — Raised connection pool from `max: 1` to `max: 10`.
- **`src/commands/trackvoice/disable.ts`** — Added null guard on `trackUpdate` before accessing `.trackAll`.
- **`.env.example`** — Fixed `DZZ_PORT` from `3306` (MySQL) to `5432` (PostgreSQL).
- **`src/Bot.ts`** — Added `.catch()` to `bot.login()` with `process.exit(1)` on failure.
- **`src/db/migrate.ts`** — Wrapped migration in `.catch()` with `process.exit(1)` on failure.
- **`src/events/trackVoice.ts`** — Wrapped both `bot.channels.fetch()` calls in try/catch; added top-level try/catch in the event handler (with helper calls now properly awaited).
- **`src/events/commandsEvent.ts`** — Wrapped the catch body's `reply()`/`followUp()` in its own try/catch.
- **`src/events/commandsCreate.ts`** — Wrapped `require(filePath)` in try/catch to prevent a broken command from crashing the load loop; switched warning to `console.warn`.
- **`src/events/guildCreate.ts` / `guildDelete.ts`** — Switched catch handlers from `console.log` to `console.error`.
- **All command catch blocks** (`all.ts`, `disable.ts`, `ignoreuser.ts`, `unignoreuser.ts`, `clear.ts`) — Switched to `console.error`; wrapped error reply calls in their own try/catch.
- **Inconsistent logging** — All logs now route through `printDev(...args)`, `printWarn(force, ...args)`, and `printError(force, ...args)` in `src/helpers/functions.ts`. Startup/script errors use `force: true`; runtime handler errors use `force: false`.
