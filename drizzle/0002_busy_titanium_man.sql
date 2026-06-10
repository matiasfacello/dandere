DROP INDEX IF EXISTS "guild_guildId_key";--> statement-breakpoint
ALTER TABLE "guild" ADD CONSTRAINT "guild_guildId_key" UNIQUE("guildId");