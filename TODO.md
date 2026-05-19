# TODO

## Bugs

- **`src/commands/mod/clear.ts`** — `isNaN(amount)` guard is dead code: `getInteger()` returns a `number`, never `NaN`. Remove the redundant check on lines 26–31 and keep only the range validation.

- **`src/events/trackVoice.ts` ~L75–82** — Early-return logic is inverted. The conditions `if (oldState.mute !== newState.mute) return` etc. cause the function to bail out when a mute/deaf/camera toggle occurs, which is the desired case to track. Review the intent: if the goal is to skip _non-channel_ state changes, the returns need to be wrapped in an "and channel didn't change" guard.

- **`src/db/client.ts` L10** — `max: 1` caps the connection pool to a single connection. Under concurrent voice-state events and slash commands this becomes a serial bottleneck. Raise to a sane default (e.g. 10) or remove the override to use the driver default.

- **`src/commands/trackvoice/all.ts` L21** and **`src/commands/trackvoice/disable.ts` L24** — `.returning()` returns an array; array-destructured result (e.g. `[upsert]`) is `undefined` if the operation matches 0 rows. Add a guard before accessing `.logChannelId` / `.enabled` on those variables.

- **`.env.example` `DZZ_PORT`** — Example shows `3306` (MySQL default). The bot uses PostgreSQL; default port should be `5432`.

## Missing Error Handling

- **`src/Bot.ts`** — `bot.login(process.env.BOT_TOKEN)` has no `.catch()`. An invalid token produces a confusing unhandled rejection at startup. Add explicit error handling and log the cause.

- **`src/db/migrate.ts`** — Migration runs with no error handling. If it fails, the bot starts anyway with a broken schema. Wrap in try/catch and call `process.exit(1)` on failure.

- **`src/events/trackVoice.ts` L41, L52, L88, L102** — `bot.channels.fetch()` can reject if the channel was deleted. Each call should be wrapped in try/catch (or use `.catch()`), and the event handler should bail out gracefully on a missing channel rather than throwing an unhandled rejection.

- **`src/events/commandsEvent.ts`** — The catch block attempts `reply()` or `editReply()` without its own error handling. A second failure (e.g. the interaction already timed out) will produce an unhandled rejection. Wrap the catch body in its own try/catch.

- **`src/events/commandsCreate.ts`** — Files that fail to load are logged as warnings but execution continues. A command that partially loaded (wrong export shape) will cause a runtime crash later when invoked. Consider a stricter validation on load.

- **`src/events/guildCreate.ts` / `guildDelete.ts`** — Catch handlers use `console.log()` for errors. Switch to `console.error()` so errors are distinguishable from info output.

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
