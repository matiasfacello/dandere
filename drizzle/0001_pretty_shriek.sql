CREATE TABLE IF NOT EXISTS "log" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" varchar NOT NULL,
	"guildId" varchar,
	"guildName" varchar,
	"userId" varchar,
	"userName" varchar,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "VoiceTrack" RENAME TO "voicetrack";--> statement-breakpoint
DROP INDEX IF EXISTS "VoiceTrack_guildId_key";--> statement-breakpoint
DROP INDEX IF EXISTS "VoiceTrack_guildId_idx";--> statement-breakpoint
ALTER TABLE "voicetrack" ALTER COLUMN "guildId" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "voicetrack" ALTER COLUMN "trackChannels" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "voicetrack" ALTER COLUMN "logChannel" SET DATA TYPE varchar;--> statement-breakpoint
ALTER TABLE "voicetrack" ALTER COLUMN "createdAt" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "voicetrack" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "voicetrack" ALTER COLUMN "ignoreUsers" SET DATA TYPE varchar;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "voicetrack_guildId_key" ON "voicetrack" ("guildId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "voicetrack_guildId_idx" ON "voicetrack" ("guildId");