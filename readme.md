# Dandere Bot

Discord bot that tracks voice channel activity — connections, disconnections, moves and
streaming — and posts a live log to a text channel of your choice. Also does bulk message
deletion.

Deploying it? See [`docs/DEPLOY.md`](docs/DEPLOY.md).

## Commands

All commands are guild-only. The permission listed is the default gate; server admins can
override it in Discord's own **Server Settings → Integrations**.

### Voice tracking

```ts
/trackvoice-all {channel: textchannel.required}
```

Track voice activity in **every** voice channel and log it to `{channel}`.
_Needs: Manage Channels._

---

```ts
/trackvoice-channel {voice-channel: voicechannel.required} {log-channel: textchannel.required}
```

Track voice activity in **one** voice channel and log it to `{log-channel}`. Run it once per
channel you want tracked.
_Needs: Manage Channels._

---

```ts
/trackvoice-channel-disable {voice-channel: voicechannel.required}
```

Stop tracking that one voice channel.
_Needs: Manage Channels._

---

```ts
/trackvoice-disable {everything: boolean.optional}
```

Turn off all-channels tracking.

Individually tracked channels **keep logging** — turning off "all" does not silently throw away
per-channel setup you did on purpose. Pass `everything:True` to switch those off too.

Disabled channels are remembered, not deleted, so `/trackvoice-channel` turns one back on.
_Needs: Manage Channels._

---

```ts
/trackvoice-ignoreuser {user: user.required}
```

Stop logging voice activity for `{user}`, in every channel.
_Needs: Manage Channels._

---

```ts
/trackvoice-unignoreuser {user: user.required}
```

Start logging `{user}` again.
_Needs: Manage Channels._

### Moderation

```ts
/clear {amount: number.required}
```

Delete the last `{amount}` messages in the current channel. Min 1, max 100. Discord will not
bulk-delete messages older than 14 days.
_Needs: Manage Messages._

### Info

```ts
/status
```

Ephemeral reply with bot status, WebSocket ping and database connectivity.
_Needs: Administrator._

## Bot permissions

Grant these to the bot's role when inviting it:

- Manage Channels
- Read Messages / View Channels
- Send Messages
- Manage Messages
- Read Message History
- Use Slash Commands

Also enable the **Server Members** privileged intent in the Discord developer portal.

## Development

```bash
pnpm install
cp .env.example .env   # fill in BOT_TOKEN, APP_ID, DATABASE_URL
pnpm dzz-migrate       # apply pending migrations
pnpm start             # hot-reloading dev server
```

There is no build step — `tsx` runs the TypeScript directly.

| Command | What it does |
| --- | --- |
| `pnpm start` / `pnpm dev` | Run with hot reload |
| `pnpm prod` | Run without the watcher |
| `pnpm commands` | Force-push slash commands to Discord |
| `pnpm lint` | ESLint over `src/` |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm dzz-generate` | Generate a migration from schema changes |
| `pnpm dzz-migrate` | Apply pending migrations |
| `pnpm dzz-studio` | Drizzle Studio GUI |

Slash commands deploy **automatically on startup**, but only when their definitions actually
changed — see [`docs/DEPLOY.md`](docs/DEPLOY.md) for how that works and why it matters.

There is no test suite. Logic with real branching gets a runnable `assert` script instead:

```bash
node --import tsx src/scripts/CheckCommandHash.ts
node --import tsx src/scripts/CheckVoiceTracking.ts
```

Architecture notes live in [`CLAUDE.md`](CLAUDE.md). Open work is in [`TODO.md`](TODO.md);
finished work is in [`docs/CHANGELOG.md`](docs/CHANGELOG.md).

## Log action IDs

Rows in the `log` table use integer action codes.

| Code | Meaning |
| --- | --- |
| 101 | user → connected to voice |
| 102 | user → moved voice channel |
| 103 | user → disconnected from voice |
| 104 | user → started streaming |
| 105 | user → stopped streaming |
| 201 | guild → created |
| 202 | guild → deleted |
| 211 | guild → ignore user |
| 212 | guild → unignore user |
| 301 | channel → tracked |
| 302 | channel → untracked |
| 303 | channel → tracked all |
| 304 | channel → untracked all |

## To-do

- [ ] Bug reporting command
- [ ] Command suggestion command
- [x] Bot usage tracking
- [x] Switch from Prisma to Drizzle
- [x] Switch from Node to tsx
