-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE IF NOT EXISTS "VoiceTrack" (
	"guildId" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"allChannels" boolean,
	"trackChannels" text,
	"logChannel" text,
	"createdAt" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"ignoreUsers" text
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "VoiceTrack_guildId_key" ON "VoiceTrack" ("guildId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "VoiceTrack_guildId_idx" ON "VoiceTrack" ("guildId");
*/