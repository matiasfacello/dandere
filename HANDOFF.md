# Handoff — 2026-09-03 — Codex codes, Claude reviews

**Roles.** Codex writes the code. Claude reviews each task before the next one starts.
Owner is away. Task 3 is the only one needing an owner decision, and it is written so it can
wait.

**Read first:** [`CLAUDE.md`](CLAUDE.md) — architecture, logging rules, commit conventions.
[`TODO.md`](TODO.md) — open items at the top, completed work below.

**Baseline:** commit `e14895d`, `main`, tree clean, last commit 2026-08-06.

---

## Ground rules for this repo

Read these before task 1; they change how the work has to be done.

**There is no test suite and no build step.** `tsx` runs the TypeScript directly. Your only
automated checks are:

```bash
pnpm lint        # eslint over src/
pnpm typecheck   # tsc --noEmit
```

Both must pass on every task.

**You probably cannot run the bot.** It needs a real `BOT_TOKEN`, `APP_ID` and a live
`DATABASE_URL`; `src/Bot.ts` exits 1 when any is missing. **Do not create a Discord
application, do not register commands against Discord, and do not run migrations against the
live database.** Discord rate-limits global command updates to 200/day per app — burning
those on experiments is a real cost. Anything that touches Discord or the production DB is the
owner's to run.

**So: pure logic must be extracted and self-checkable.** Where a task has real branching, put
the logic in a function that takes plain data and returns plain data, and leave one runnable
check next to it — a `node`-runnable script under `src/scripts/` with `assert`, no test
framework, no fixtures. Task 2's hash comparison is exactly this shape.

**Logging.** Never `console.log`/`warn`/`error`. Use `printDev`, `printWarn(force, ...)`,
`printError(force, ...)` from `src/helpers/functions.ts`. Errors use `force: true`.

**Migrations.** `pnpm dzz-generate` writes migration files — that is safe and belongs in the
commit. `pnpm dzz-migrate` applies them to the live database — **do not run it.** Leave the
generated SQL for the owner and say so in the commit message.

---

## Task 1 — fix the `channelTracking` unique index

**This is a bug, and it silently blocks Task 3. Do it first.**

`src/db/schema.ts`, the `channelTracking` table:

```ts
(table) => [
  uniqueIndex("voicetrack_guildId_key").on(table.guildId),
  index("voicetrack_guildId_idx").on(table.guildId),
];
```

The unique index is on `guildId` **alone**. The table's whole purpose is one row per
`(guild, channel)` pair — that is what per-channel opt-in means — but this constraint permits
exactly **one row per guild**. Insert a second tracked channel and Postgres rejects it. The
table as shipped cannot express the feature it exists for.

`TODO.md` currently says of this table only:

> Remove redundant `index("voicetrack_guildId_idx")`; the unique index already covers the
> column.

That note is right about the plain index being redundant _today_, but it stops at the symptom.
Once the unique moves to the composite key it no longer covers lookups by `guildId` alone, so
the plain index stops being redundant and becomes the one you want. Fix both together.

### What to build

- Unique index on `(guildId, channelId)`.
- Keep `index("voicetrack_guildId_idx").on(table.guildId)` — after the change it is the index
  serving "all tracked channels for this guild", the read Task 3 does on every voice event.
- `pnpm dzz-generate` and commit the generated migration. Do not apply it.

Nothing currently reads or writes `channelTracking` — grep to confirm before you assume — so
this should touch `src/db/schema.ts` and the new `drizzle/` migration file, nothing else.

### Definition of done

- `pnpm lint` and `pnpm typecheck` pass.
- The generated SQL is in the commit, unapplied, and the commit message says the owner must
  run `pnpm dzz-migrate`.
- `TODO.md`'s "Pending DB Changes" bullet for `channelTracking` is rewritten to describe what
  actually happened, not the old redundant-index note.

---

## Task 2 — deploy slash commands on startup, only when they changed

`TODO.md`, "Missing Features / Next Steps", second bullet. Self-contained, no Discord calls to
test the interesting part.

### The problem

Deploying commands is a manual `pnpm commands` step today
(`src/scripts/DeployCommands.ts`). Forgetting it means the bot runs with a stale command set.
Always deploying on startup is not the fix either: Discord rate-limits global command updates
to **200/day per application**, and a crash-loop would exhaust that.

### What to build

Compare a hash of the locally serialized command definitions against what was last deployed,
and call `PUT applicationCommands` only when they differ.

- The command bodies are already produced in two places — `DeployCommands.ts` builds
  `command.data.toJSON()` in a loop, and `src/events/commandsCreate.ts` already scans and
  imports every command file at startup. **Do not write a third scanner.** Reuse what
  `commandsCreate.ts` loads.
- Hash with `node:crypto`. No dependency.
- The serialization must be **order-independent** — `fs.readdirSync` order is not guaranteed
  across machines, and a reordered-but-identical command set must hash the same or the
  rate-limit guard is worthless. Sort by command name before hashing.
- Store the last-deployed hash where it survives a restart. The `guild` table is per-guild and
  wrong for this; commands here are global. A one-column table, or a small file, are both
  fine — pick the smaller change and say why in the commit message.
- On mismatch: deploy, then store the new hash. On a failed deploy: **do not** store the hash.
- Keep `pnpm commands` working as a manual force.

### The runnable check

Add a script under `src/scripts/` runnable with `tsx`, using `node:assert`, that proves the
hash function alone:

- same commands in a different order → same hash
- a changed description → different hash
- an added command → different hash
- an empty set → stable, does not throw

No Discord, no database, no framework. If the hash function cannot be checked without them,
it is in the wrong place — pull it into `src/helpers/`.

### Definition of done

- `pnpm lint`, `pnpm typecheck` pass; the check script passes.
- Startup with unchanged commands makes **zero** Discord command-API calls. Say in the PR/commit
  how you established that (reading the code path is acceptable here — running it is not
  available to you).
- `TODO.md` bullet moved to "Completed" with a one-line description matching the file's style.

---

## Task 3 — per-channel tracking

**Depends on Task 1. Do not start it until Task 1 is reviewed and merged.**

`TODO.md`, third bullet:

> The `channelTracking` table and `trackvoice-all` command suggest per-channel opt-in was
> planned but only `trackAll` is implemented. The per-channel enable/disable flow is
> incomplete.

### The shape of the existing code

- `src/commands/trackvoice/all.ts` — sets `guild.trackAll = true` and `guild.logChannelId`.
- `src/commands/trackvoice/disable.ts` — sets `guild.trackAll = false`.
- `src/events/trackVoice.ts` — the core handler. It checks `getVoiceTrack.trackAll` in both
  `oneChannelBehavior` and `twoChannelBehavior`. **Read this file fully before writing
  anything**; both paths need the new condition, and patching only one is the exact bug that
  was already fixed once here (see `/trackvoice-disable fix` in `TODO.md`'s Completed list).

### What to build

Two commands mirroring the existing pair, plus the read path:

- `trackvoice-channel` — enable tracking for one voice channel. Same
  `PermissionFlagsBits.ManageChannels` gate, same `deferReply` + ephemeral shape, same
  `printError` handling, same `log` insert as `all.ts`.
- `trackvoice-channel-disable` — the inverse.
- `trackVoice.ts` posts when `trackAll` is on **or** the specific channel has an enabled
  `channelTracking` row.

Follow `all.ts` and `disable.ts` closely — same option builders, same reply style, same
`onConflictDoUpdate` pattern. This is deliberately boring; a new abstraction over two more
commands is not wanted.

### Decisions to record, not guess

Two questions the code cannot answer. **Pick the conservative option, implement it, and write
what you picked and why into `TODO.md` as an open question for the owner** — do not stall, and
do not silently choose:

1. `trackAll` and per-channel rows both existing — does `trackAll` win, or is it a union?
   (Conservative: `trackAll` wins, per-channel rows are ignored while it is on. It matches the
   command's name and cannot surprise anyone with extra noise.)
2. Does `trackvoice-disable` clear per-channel rows too, or only `trackAll`? (Conservative:
   only `trackAll`, matching what its description already promises. Clearing rows the user
   never asked about destroys configuration.)

### The runnable check

The "should this event be logged" decision is a real branch over `trackAll`, the per-channel
rows, and the ignore list. Extract it into a pure function — inputs: the guild row, the
tracked-channel rows, the channel id — and add an `assert` script covering: trackAll on,
trackAll off with the channel enabled, trackAll off with a _different_ channel enabled, and
nothing configured. No Discord objects in that function's signature.

### Definition of done

- `pnpm lint`, `pnpm typecheck`, check script pass.
- Both `oneChannelBehavior` and `twoChannelBehavior` go through the same decision function —
  grep to prove there is no second copy of the condition.
- The two decisions above are written into `TODO.md` as open questions.
- New commands are **not** deployed to Discord. The owner runs `pnpm commands`.

---

## Do not touch

- **The premium feature.** `premiumPlans` and `premiumSubscription` exist with no code, and
  `TODO.md` says "either implement the feature or remove the dead schema". That is a business
  decision — implementing billing tables or dropping them are both wrong to do unasked. Same
  for the `logRetentionDays` column and the premium retention window.
- **Anything that calls Discord or the live database.** Migrations generated, never applied.
  Commands built, never deployed.
- `src/helpers/rateLimiter.ts` and `logCleanup.ts` — recently settled, no open items.

## Review checklist for Claude

1. Task 1: is the unique on `(guildId, channelId)`, and did the plain `guildId` index survive?
   Dropping it as "redundant" is the trap the old TODO note sets.
2. Task 2: does the hash actually ignore file order? Reordering `readdirSync` output must not
   change it. Check the assert script really tests this rather than asserting a constant.
3. Task 2: is there a third command-scanning loop now? There should be two at most, ideally
   one shared.
4. Task 3: grep `trackVoice.ts` for the tracking condition. Two copies is a reject — that is
   the bug this repo already shipped once.
5. Task 3: is the decision function free of discord.js types? If it takes a `VoiceState`, it
   cannot be checked and it goes back.
6. All: no `console.*`. No new dependency. No migration applied, no command deployed.
