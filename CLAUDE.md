# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Dandere is a Discord bot built with TypeScript that tracks voice channel activity (connections, disconnections, channel moves, streaming events) and posts real-time logs to a configured text channel. It also provides moderation utilities like bulk message deletion.

## Commands

```bash
npm run start          # Run bot with tsx watch (hot reload — use for development)
npm run dev            # Alias for start
npm run commands       # Delete and redeploy all slash commands to Discord
npm run dzz-generate   # Generate Drizzle migration files from schema changes
npm run dzz-migrate    # Run pending database migrations
npm run dzz-studio     # Open Drizzle Studio GUI for the database
npm run dzz-introspect # Introspect existing PostgreSQL schema
```

There is no separate build step — TypeScript runs directly via `tsx`. No test suite exists.

To lint: `npx eslint src/` — ESLint is configured but has no npm script.

## Architecture

**Entry point:** `src/Bot.ts` — creates the Discord client, registers all events, and starts the bot.

**Events (`src/events/`):** Each file handles one Discord gateway event. `commandsCreate.ts` dynamically loads all `.ts` files from `src/commands/**/` at startup and stores them in a `commands` Collection on the client. `commandsEvent.ts` routes incoming interactions to the right handler. `trackVoice.ts` is the core feature — it processes `voiceStateUpdate` events and writes log entries.

**Commands (`src/commands/`):** Each command exports `data` (a `SlashCommandBuilder`) and an `execute(interaction)` function. They are discovered automatically by filesystem scan — no manual registration needed. Organized into subfolders by category (`mod/`, `trackvoice/`).

**Database (`src/db/`):**
- `schema.ts` — Drizzle table definitions (source of truth for the data model)
- `client.ts` — exports the `dzz` Drizzle instance; import from here using the `db/client` base-URL alias
- `migrate.ts` — standalone script to run migrations; call via `dzz-migrate`

The schema has 5 tables: `guild`, `channelTracking`, `log`, `premiumPlans`, `premiumSubscription`. The `log` table uses integer action codes (101–105 for voice events, 201–202 for guild events, 211–212 for ignore events, 301–304 for channel events).

**Types (`src/types/`):** `ClientType.d.ts` extends the discord.js `Client` with a `commands` Collection. `env.d.ts` declares all required environment variables — add new ones here.

**Helpers (`src/helpers/functions.ts`):** `printDev()` logs only when `NODE_ENV !== "production"`.

## Environment Variables

Copy `.env.example` to `.env`. Required variables:

| Variable | Purpose |
|---|---|
| `BOT_TOKEN` | Discord bot token |
| `APP_ID` | Discord application ID |
| `DATABASE_URL` | Full PostgreSQL connection string |
| `DZZ_HOST`, `DZZ_PORT`, `DZZ_USER`, `DZZ_PASSWORD`, `DZZ_DATABASE` | Individual DB credentials (used by Drizzle Kit) |
| `NODE_ENV` | `"development"` or `"production"` |

## Key Conventions

- Imports use the `src/` baseUrl alias — e.g., `import { dzz } from "db/client"` instead of relative paths.
- All slash commands require `GuildOnly` — there is no DM support.
- When adding new slash commands, place them in `src/commands/<category>/` — they are auto-loaded. No registration code needed.
- When modifying the schema, run `dzz-generate` then `dzz-migrate`. Do not hand-edit files in `drizzle/`.
- The premium subscription tables exist in the schema but are not yet used in any commands.
