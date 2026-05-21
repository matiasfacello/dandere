import { and, lt } from "drizzle-orm";
import { dzz, eq } from "db/client";
import { guild, log } from "db/schema";
import { printDev, printError } from "helpers/functions";

export const FREE_TIER_RETENTION_DAYS = 30;

function retentionCutoff(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function runLogCleanup(): Promise<void> {
  try {
    // Once guild.logRetentionDays exists (see Pending DB Changes), replace FREE_TIER_RETENTION_DAYS
    // with retentionDays ?? FREE_TIER_RETENTION_DAYS and select that column too.
    const guilds = await dzz.select({ guildId: guild.guildId }).from(guild);

    for (const { guildId } of guilds) {
      const cutoff = retentionCutoff(FREE_TIER_RETENTION_DAYS);
      await dzz.delete(log).where(and(eq(log.guildId, guildId), lt(log.createdAt, cutoff)));
    }

    printDev(`[LogCleanup] Cleaned logs for ${guilds.length} guild(s).`);
  } catch (err) {
    printError(true, "[LogCleanup] Error during log cleanup:", err);
  }
}

export function scheduleLogCleanup(): void {
  runLogCleanup();
  setInterval(runLogCleanup, 24 * 60 * 60 * 1000).unref();
}
