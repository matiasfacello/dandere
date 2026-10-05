# TODO

<!-- headlines-stamp: b8652efd0999 -->
## Headlines


### Backlog (`TODO.md`)
- [S] Drop the `esbuild` override in `pnpm-workspace.yaml` once drizzle-kit ships without `@esbuild-kit/*`
- [L][you] Premium §1 — freeze the v1 product contract: retention period, one tier or many, price/duration units, provisioning path, overlap policy. Blocks everything below.
- [L] Premium §2 — repair the data model: `planId` type mismatch, real FKs, `retentionDays` on plans, validity constraints, migration
- [M] Premium §3 — one entitlement helper resolving guild retention at an injected timestamp
- [M] Premium §4 — apply resolved retention in `src/helpers/logCleanup.ts`, per-guild error isolation
- [M] Premium §5 — `/premium` status command + owner-only grant/revoke
- [M] Premium §6 — assertion scripts for the boundary cases, then readme/CLAUDE.md update

### Background — agent work, low priority (`## Background` below)

- [S] B1. Check moderation permissions on the actual channel, not just guild-level — `src/commands/mod/clear.ts`. **Start here.**
- [M] B2. Make `/clear` report partial deletion accurately — a mid-run failure currently claims nothing happened
- [S] B3. Isolate retention cleanup failures between guilds — `src/helpers/logCleanup.ts`. Free-tier slice of Premium §4, unblocked today.
- [S] B4. Add one credential-free `pnpm check` — typecheck + lint + the existing assertion scripts
<!-- /headlines -->

## Missing Features / Next Steps

- **Per-channel tracking is deliberately independent of `trackAll`** — `/trackvoice-disable` turns off all-channels mode only; individually tracked channels keep logging. Pass `everything:True` to switch those off too. (`trackAll` precedence is not a real choice: while it is on, everything is logged either way.)


- **Drop the `esbuild` override** — `pnpm-workspace.yaml` pins `esbuild: ">=0.25.0"` only because drizzle-kit 0.31.10 still depends on the deprecated `@esbuild-kit/esm-loader`, which pinned esbuild 0.18.20 and tripped GHSA-67mh-4wv8-2f99. The bug is in `esbuild serve`, which nothing here runs, so this was alert noise rather than exposure. When drizzle-kit ships a version without `@esbuild-kit/*`, bump it, delete the `overrides` block, and check `pnpm why esbuild` no longer lists 0.18.x.


## Premium Features

_Premium is guild-scoped. The only premium benefit currently identified in the project is extended log retention. Voice tracking, per-channel setup, ignored users, moderation, and `/status` have no premium checks and remain free unless the product scope is deliberately changed._

### Findings and intended application

- `premiumPlans` and `premiumSubscription` exist only in `src/db/schema.ts` and the initial migration; no runtime code reads or writes either table.
- Free retention is 30 days (`FREE_TIER_RETENTION_DAYS`) and cleanup runs at startup and every 24 hours from `src/Bot.ts`. `src/helpers/logCleanup.ts` is therefore the first premium integration point.
- Do not put a persistent `logRetentionDays` override on `guild`: it could survive subscription expiry and accidentally leave the benefit enabled. Retention should be a plan entitlement resolved from a subscription active at cleanup time (`premiumFrom <= now < premiumUntil`), with 30 days as the fallback.
- The existing schema is not implementation-ready: `premiumSubscription.planId` is `varchar` while `premiumPlans.id` is `serial`; the declared Drizzle relations do not create database foreign keys; price/duration units and currency are unspecified; and multiple overlapping subscriptions are currently allowed.
- A newly upgraded guild can retain future logs for longer, but logs already deleted under the free policy cannot be restored. When premium expires, the next cleanup should remove rows older than the free-tier window.

### Work plan

1. **Freeze the v1 product contract**
   - Confirm the premium retention period and whether there is one plan or multiple tiers.
   - Define duration and price units, currency, activation/expiry boundary, renewal behavior, cancellation/refund behavior, and any grace period.
   - Choose how subscriptions are provisioned. For a manual first release, define an owner-only grant/revoke path; for paid activation, choose the billing provider and webhook/source-of-truth model before finalizing provider IDs and status fields.
   - Decide whether subscription history may contain adjacent/overlapping rows. Prefer rejecting overlaps; otherwise define a deterministic rule such as using the greatest active retention entitlement.

2. **Repair and extend the data model**
   - Make `premiumSubscription.planId` the same integer type as `premiumPlans.id` and add real foreign keys from subscription to plan and guild.
   - Store `retentionDays` on `premiumPlans` (positive integer), not on `guild`, so the benefit belongs to the purchased plan.
   - Give plans a stable unique code and make monetary fields explicit (for example `priceMinorUnits` plus `currency`) if billing remains database-owned.
   - Add the provider subscription/customer IDs, lifecycle status, and event-deduplication fields required by the chosen provisioning model; omit them for a deliberately manual v1.
   - Add constraints/indexes for active lookups and date validity (`premiumUntil > premiumFrom`). Preserve subscription history while enforcing the overlap policy chosen above.
   - Generate the migration with `pnpm dzz-generate`, inspect it, apply it with `pnpm dzz-migrate`, and seed/upsert the plan catalog without hand-editing migration files.

3. **Create one entitlement boundary**
   - Add a premium service/helper that resolves guild entitlements at an injected timestamp and returns free defaults only when the query confirms there is no active subscription.
   - Keep date-window, overlap, missing-plan, and invalid-value handling in this helper so future premium features do not query subscription tables independently.
   - Treat lookup failures and inconsistent premium data as errors rather than as free-tier results. Feature gates may fail closed, but destructive retention cleanup must skip that guild so a transient error cannot delete premium history.

4. **Apply extended retention**
   - Update `src/helpers/logCleanup.ts` to obtain each guild's resolved `retentionDays` and calculate its cutoff, retaining `FREE_TIER_RETENTION_DAYS` as the free default.
   - Use one cleanup-run timestamp for consistent boundary decisions and validate/clamp retention values before deletion.
   - Isolate errors per guild: report and skip a guild whose entitlement cannot be resolved, while allowing the rest of the cleanup run to continue.
   - Keep the existing startup plus 24-hour schedule. Confirm expected downgrade behavior: expiry does not delete logs immediately, but the next scheduled cleanup does.

5. **Add subscription visibility and administration**
   - Add a guild-only, ephemeral `/premium` status command showing the active plan, effective retention, and expiry; do not expose payment/customer identifiers.
   - Implement the selected owner-only manual commands or billing webhook flow for grant, renewal, cancellation, and expiry. Guild administrators must not be able to self-grant premium.
   - Record auditable lifecycle events without putting secrets or full billing payloads in Discord messages or application logs.

6. **Verify and document**
   - Add runnable assertion scripts for no subscription, active/future/expired subscriptions, exact expiry boundary, invalid plan data, overlap policy, upgrade, and downgrade cleanup behavior.
   - Run `pnpm typecheck`, `pnpm lint`, the assertion scripts, and a migration smoke test against a disposable database.
   - Update `readme.md` with the final free/premium matrix and commands; update `CLAUDE.md` once the tables are genuinely used; document provisioning secrets and deployment steps without committing credentials.

### Future premium candidates (not yet approved scope)

- Limits on tracked channels or ignored users, exports/search over retained logs, alternate destinations, analytics, and richer log formatting are possible entitlements, but the current codebase contains no requirement or partial implementation for them. Evaluate them separately instead of silently gating today's free behavior.

## Background — agent work (low priority)

From an agent source review on 2026-09-08 (claims re-checked against the code on 2026-10-05, still accurate). Nothing here needs a product decision — it's work an agent can pick up unattended when nothing else is queued. **S** = small change; **M** = one focused session.

### B1. Check moderation permissions in the actual channel — S — start here

**Evidence:** [src/commands/mod/clear.ts](src/commands/mod/clear.ts) checks the
bot's guild-level `ManageMessages` permission, then casts the interaction channel
to `TextChannel`. A guild-level check does not represent the channel overwrites
that govern the actual deletion operation.

**Agent brief:** Validate the channel's supported operations and the bot's
effective permissions there before fetching/deleting messages. Keep the user's
existing permission gate. Return a useful ephemeral response when the bot cannot
read history or manage messages. Preserve the current 1–100 and old-message
behavior.

**Done when:** A runnable assertion script uses fake interactions to cover guild
permission granted but channel permission denied, missing channel/member data,
and a permitted request. Denied requests perform no fetch/delete. Existing
assertion scripts, `pnpm typecheck`, and `pnpm lint` pass.

### B2. Make `/clear` report partial deletion accurately — M

**Evidence:** The handler counts successful deletes inside one `try`; if one
individual deletion fails after earlier successes, the catch replaces the result
with a generic “try again.” That loses the information needed to know how much
of a destructive command already happened.

**Agent brief:** Keep an accurate count across bulk and individual deletion
steps. Stop on a terminal failure and report successful deletions plus the
remaining failure without suggesting the whole request did nothing. Use existing
logging helpers and keep replies ephemeral. Reuse B1's fakes if available.

**Done when:** Assertions cover zero/one/many recent messages, mixed-age messages,
fewer fetched than requested, and failure on the third individual delete. No
message is retried automatically; the reported count matches completed calls.
No real Discord messages are used.

### B3. Isolate retention cleanup failures between guilds — S

**Evidence:** [src/helpers/logCleanup.ts](src/helpers/logCleanup.ts) wraps the
whole guild loop in one catch and computes a fresh cutoff for each guild. One
failed delete prevents later guilds from being cleaned. Its comment still
proposes `guild.logRetentionDays`, contrary to the newer entitlement plan.

**Agent brief:** Capture one run timestamp, preserve the existing 30-day policy,
and handle deletion errors per guild. Report succeeded/failed counts. Extract
only the clock/database seam needed for assertions. Remove the obsolete guidance
without implementing premium or modifying schema.

**Done when:** Fake guild A fails but B is processed; all guilds use the same
cutoff; logs exactly at the cutoff remain because the predicate is strictly
older-than. A failed guild-list query performs no deletion. No live database is
required.

### B4. Give the bot one credential-free verification command — S

**Evidence:** [package.json](package.json) exposes lint and typecheck, but the
existing [CheckCommandHash.ts](src/scripts/CheckCommandHash.ts) and
[CheckVoiceTracking.ts](src/scripts/CheckVoiceTracking.ts) must be invoked
separately. The readme explicitly prefers runnable assertions over a test suite.

**Agent brief:** Add `pnpm check` to run typecheck, lint, and the existing assertion
scripts, plus those added by the tasks above. Keep assertion entrypoints free of
bot startup, deployment, migration, and database-client side effects. Add a
short contributor instruction with the exact command.

**Done when:** The command works with bot/database credentials unset, exits
nonzero for a deliberately failing temporary assertion, and leaves no scheduled
process running. A clean run does not contact Discord or PostgreSQL.

### How to hand these off

Use: “Implement B1 in `TODO.md` (Background section), following `CLAUDE.md`. Complete the
local implementation and assertion checks and report the results.”

These are new maintenance proposals, not approval for premium billing,
migrations, starting the bot, or deploying slash commands. Preserve the documented
independence of per-channel tracking and `trackAll`.

## Completed

Moved to [`docs/CHANGELOG.md`](docs/CHANGELOG.md).
