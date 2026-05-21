import { printDev } from "helpers/functions";

const WINDOW_MS = 1_000;
const USER_LIMIT = 2;
const GUILD_LIMIT = 10;

const userBuckets = new Map<string, number[]>(); // key: `${guildId}:${userId}`
const guildBuckets = new Map<string, number[]>(); // key: guildId

function pruneWindow(timestamps: number[], now: number): number[] {
  return timestamps.filter((t) => now - t < WINDOW_MS);
}

function runCleanup(): void {
  printDev("[RateLimiter] Cleanup started.");
  const now = Date.now();
  let deleted = 0;
  for (const [key, ts] of userBuckets) {
    if (pruneWindow(ts, now).length === 0) {
      userBuckets.delete(key);
      deleted++;
    }
  }
  for (const [key, ts] of guildBuckets) {
    if (pruneWindow(ts, now).length === 0) {
      guildBuckets.delete(key);
      deleted++;
    }
  }
  printDev(`[RateLimiter] Cleanup done. Removed ${deleted} stale entries.`);
}

function msUntilHour(hour: number): number {
  const next = new Date();
  next.setHours(hour, 0, 0, 0);
  if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
  return next.getTime() - Date.now();
}

function scheduleAtHour(hour: number): void {
  setTimeout(() => {
    runCleanup();
    scheduleAtHour(hour);
  }, msUntilHour(hour)).unref();
}

function scheduleCleanup(): void {
  const rawHour = Number(process.env.RATE_LIMIT_CLEANUP_HOUR);
  const rawHours = Number(process.env.RATE_LIMIT_CLEANUP_HOURS);

  if (process.env.RATE_LIMIT_CLEANUP_HOUR !== undefined) {
    if (!Number.isInteger(rawHour) || rawHour < 0 || rawHour > 23) {
      printWarn(
        true,
        `[RateLimiter] Invalid RATE_LIMIT_CLEANUP_HOUR "${process.env.RATE_LIMIT_CLEANUP_HOUR}" — must be 0–23. Falling back to interval.`,
      );
    } else {
      scheduleAtHour(rawHour);
      return;
    }
  }

  const intervalMs = (rawHours > 0 ? rawHours : 24) * 60 * 60 * 1_000;
  setInterval(runCleanup, intervalMs).unref();
}

scheduleCleanup();

export type RateLimitResult = { limited: false } | { limited: true; scope: "user" | "guild"; remainingMs: number };

export function checkRateLimit(userId: string, guildId: string): RateLimitResult {
  const now = Date.now();
  const userKey = `${guildId}:${userId}`;

  const guildTs = pruneWindow(guildBuckets.get(guildId) ?? [], now);
  if (guildTs.length >= GUILD_LIMIT) {
    return { limited: true, scope: "guild", remainingMs: WINDOW_MS - (now - guildTs[0]) };
  }

  const userTs = pruneWindow(userBuckets.get(userKey) ?? [], now);
  if (userTs.length >= USER_LIMIT) {
    return { limited: true, scope: "user", remainingMs: WINDOW_MS - (now - userTs[0]) };
  }

  guildBuckets.set(guildId, [...guildTs, now]);
  userBuckets.set(userKey, [...userTs, now]);

  return { limited: false };
}
