DROP INDEX "voicetrack_guildId_key";--> statement-breakpoint
CREATE UNIQUE INDEX "voicetrack_guildId_key" ON "channelTracking" USING btree ("guildId","channelId");