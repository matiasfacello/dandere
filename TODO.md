# TODO

## Security

- **`Dockerfile` L13–18** — `BOT_TOKEN` and `DATABASE_URL` are passed as build `ARG`s and promoted to `ENV`. They end up in the image build history and can be extracted from any image layer. Pass secrets at container runtime via `-e` or Docker secrets, not at build time.

- **`src/db/schema.ts` `ignoreUsers` column** — Stored as unbounded `varchar`. A malicious or buggy input could write arbitrarily large strings. Use a PostgreSQL `text[]` array type (which also removes the error-prone comma-split parsing everywhere).

- **`src/commands/trackvoice/ignoreuser.ts`** — No format validation on the Discord user ID before storing it. Validate that the value is an 18–20 digit numeric string before writing to the database.

- **`src/types/env.d.ts`** — Environment variables are declared as always present but are never validated at startup. Add a startup check that asserts all required vars are non-empty and `process.exit(1)` with a clear message if any are missing.

## Code Quality

- **`src/commands/trackvoice/ignoreuser.ts` + `unignoreuser.ts`** — The comma-split / filter / join manipulation of `ignoreUsers` is duplicated across both files. Extract `addIgnoredUser(guildId, userId)` and `removeIgnoredUser(guildId, userId)` helpers into `src/helpers/` (or `src/db/`).

- **`src/types/ClientType.d.ts`** — `commands` is typed as `Collection<string, any>`. Define a `Command` interface (`{ data: SlashCommandBuilder; execute: (interaction: ChatInputCommandInteraction) => Promise<void> }`) and use it here for end-to-end type safety.

- **`src/events/commandsCreate.ts` L18`** — Filters for `.ts` extension, which breaks if the project is ever compiled to `.js` before running. Either keep `tsx` as the only runtime target and document this, or use a runtime check that handles both extensions.

- **`src/db/schema.ts` `channelTracking`** — There is both a unique index and a regular index on `guildId`. The regular index is redundant; remove it.

- **`src/helpers/functions.ts`** — `printDev()` has an explicit `return;` at the end of a `void` function. Remove it.

- **Typos in comments:**

  - `trackVoice.ts` L14: `"Joiningconnection"` → `"Joining connection"`
  - `trackVoice.ts` L26: `"Cross guild are considered only connections"` is unclear — reword
  - `ignoreuser.ts` L24 and `unignoreuser.ts` L30: `"beign"` → `"being"`

- **Inconsistent logging** — Some paths use `printDev()`, others use bare `console.log()`, others use `console.error()`. Standardize on a single logger or at least on `console.info` / `console.error` with consistent levels.

## Missing Features / Next Steps

- **Graceful shutdown** — No `SIGTERM`/`SIGINT` handlers. Add handlers to close the database pool and destroy the Discord client cleanly before the process exits. This is especially important in the Docker/CapRover deployment.

- **Startup env validation** — Validate all required environment variables on startup (before connecting to Discord or the DB) and exit with a descriptive message if any are missing.

- **`ignoreUsers` migration to array type** — Replace the comma-separated `varchar` with a PostgreSQL `text[]` column. This eliminates the string-split bugs and makes querying/indexing cleaner.

- **Command type safety** — Implement the `Command` interface (see Code Quality above) so `commands.get()` calls are fully typed instead of returning `any`.

- **Health/status command** — A simple `/status` or `/ping` slash command that returns DB connectivity, uptime, and guild count is useful for self-hosting and debugging.

- **Premium subscription feature** — The `premiumPlans` and `premiumSubscription` tables exist in the schema but no commands or logic use them. Either implement the feature or remove the dead schema to avoid confusion.

- **Dockerfile production build** — The current image runs `npm start` which uses `tsx watch` (development mode). For production, add a compile step (`tsc`) and run the compiled output, or at minimum use `tsx` without `--watch`.

- **Rate limiting for commands** — There is no per-user or per-guild cooldown on slash commands. Add a simple in-memory cooldown map to prevent command spam from triggering Discord rate limits.

- **Per-channel tracking** — The `channelTracking` table and `trackvoice-all` command suggest per-channel opt-in was planned but only `trackAll` is implemented. The per-channel enable/disable flow is incomplete.

## Completed

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
