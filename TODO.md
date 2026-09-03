# TODO

> ⚠️ **UNAPPLIED MIGRATION PENDING** — `drizzle/0003_blushing_tyrannus.sql` (commit `4fb5245`)
> makes `channelTracking` unique on `(guildId, channelId)`. Generated but **not applied**.
> Owner must run `pnpm dzz-migrate`. Task 3 (per-channel tracking) is broken until this lands.

## Missing Features / Next Steps

- **Premium subscription feature** — The `premiumPlans` and `premiumSubscription` tables exist in the schema but no commands or logic use them. Either implement the feature or remove the dead schema to avoid confusion.


- **Per-channel tracking is deliberately independent of `trackAll`** — `/trackvoice-disable` turns off all-channels mode only; individually tracked channels keep logging. Pass `everything:True` to switch those off too. (`trackAll` precedence is not a real choice: while it is on, everything is logged either way.)


## Premium Features

_Free tier baseline is defined in `src/helpers/logCleanup.ts`. Premium upgrades slot in by reading per-guild overrides from the DB._

- **Extended log retention** — Free tier retains 30 days (`FREE_TIER_RETENTION_DAYS`). Premium guilds get a longer window. Requires adding `logRetentionDays` integer (nullable) to the `guild` table (see Pending DB Changes), then changing the cleanup loop to read `retentionDays ?? FREE_TIER_RETENTION_DAYS` per guild.

## Pending DB Changes

_Batch these together and run `dzz-generate` + `dzz-migrate` once there are enough to justify a migration._

- **`src/db/schema.ts` `guild`** — Add `logRetentionDays: integer("logRetentionDays")` (nullable). Null means free tier; premium guilds get a value set here. Required before the log cleanup can respect per-guild retention windows.

- **`src/db/schema.ts` `channelTracking`** — Generated a migration to make `voicetrack_guildId_key` unique on `(guildId, channelId)`, allowing multiple tracked channels per guild. Kept `voicetrack_guildId_idx` for guild-only lookups. Owner must run `pnpm dzz-migrate` to apply it.

## Completed

Moved to [`docs/CHANGELOG.md`](docs/CHANGELOG.md).
