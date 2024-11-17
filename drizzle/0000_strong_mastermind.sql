CREATE TABLE IF NOT EXISTS "log" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" integer NOT NULL,
	"guildId" varchar,
	"guildName" varchar,
	"channelId" varchar,
	"channelName" varchar,
	"userId" varchar,
	"userName" varchar,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "voicetrack" (
	"guildId" varchar NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"allChannels" boolean,
	"trackChannels" varchar,
	"logChannel" varchar,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"ignoreUsers" varchar
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "log_id_key" ON "log" USING btree ("id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "log_guildId_idx" ON "log" USING btree ("guildId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "log_userId_idx" ON "log" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "voicetrack_guildId_key" ON "voicetrack" USING btree ("guildId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "voicetrack_guildId_idx" ON "voicetrack" USING btree ("guildId");