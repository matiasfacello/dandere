CREATE TABLE IF NOT EXISTS "channelTracking" (
	"guildId" varchar NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"channelId" varchar NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "guild" (
	"id" serial PRIMARY KEY NOT NULL,
	"guildId" varchar NOT NULL,
	"trackAll" boolean DEFAULT false NOT NULL,
	"logChannelId" varchar,
	"ignoreUsers" varchar,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE IF NOT EXISTS "premiumPlans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"duration" integer NOT NULL,
	"price" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "premiumSubscription" (
	"id" serial PRIMARY KEY NOT NULL,
	"guildId" varchar NOT NULL,
	"planId" varchar NOT NULL,
	"premiumFrom" timestamp NOT NULL,
	"premiumUntil" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "voicetrack_guildId_key" ON "channelTracking" USING btree ("guildId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "voicetrack_guildId_idx" ON "channelTracking" USING btree ("guildId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "guild_guildId_key" ON "guild" USING btree ("guildId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "log_id_key" ON "log" USING btree ("id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "log_guildId_idx" ON "log" USING btree ("guildId");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "log_userId_idx" ON "log" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "premium_plans_id_key" ON "premiumPlans" USING btree ("id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "premium_id_key" ON "premiumSubscription" USING btree ("id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "premium_guildId_idx" ON "premiumSubscription" USING btree ("guildId");