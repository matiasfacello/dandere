import { relations } from "drizzle-orm";
import { boolean, index, integer, pgTable, serial, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const guild = pgTable(
  "guild",
  {
    id: serial("id").primaryKey().notNull(),
    guildId: varchar("guildId").notNull(),
    trackAll: boolean("trackAll").default(false).notNull(),
    logChannelId: varchar("logChannelId"),
    ignoreUsers: varchar("ignoreUsers"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("guild_guildId_key").on(table.guildId)]
);

export const guildRelations = relations(guild, ({ many }) => ({
  channels: many(channelTracking),
  premiumSubscriptions: many(premiumSubscription),
}));

export const channelTracking = pgTable(
  "channelTracking",
  {
    guildId: varchar("guildId").notNull(),
    enabled: boolean("enabled").default(false).notNull(),
    channelId: varchar("channelId").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("voicetrack_guildId_key").on(table.guildId), index("voicetrack_guildId_idx").on(table.guildId)]
);

export const channelRelations = relations(channelTracking, ({ one }) => ({
  guildId: one(guild, {
    fields: [channelTracking.guildId],
    references: [guild.guildId],
  }),
}));

export const log = pgTable(
  "log",
  {
    id: serial("id").primaryKey().notNull(),
    action: integer("action").notNull(),
    guildId: varchar("guildId"),
    guildName: varchar("guildName"),
    channelId: varchar("channelId"),
    channelName: varchar("channelName"),
    userId: varchar("userId"),
    userName: varchar("userName"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("log_id_key").on(table.id), index("log_guildId_idx").on(table.guildId), index("log_userId_idx").on(table.userId)]
);

export const logRelations = relations(log, ({ one }) => ({
  guildId: one(guild, {
    fields: [log.guildId],
    references: [guild.guildId],
  }),
}));

export const premiumPlans = pgTable(
  "premiumPlans",
  {
    id: serial("id").primaryKey().notNull(),
    name: varchar("name").notNull(),
    description: text("description"),
    duration: integer("duration").notNull(),
    price: integer("price").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("premium_plans_id_key").on(table.id)]
);

export const premiumPlanRelations = relations(premiumPlans, ({ many }) => ({
  premiumSubscriptions: many(premiumSubscription),
}));

export const premiumSubscription = pgTable(
  "premiumSubscription",
  {
    id: serial("id").primaryKey().notNull(),
    guildId: varchar("guildId").notNull(),
    planId: varchar("planId").notNull(),
    premiumFrom: timestamp("premiumFrom").notNull(),
    premiumUntil: timestamp("premiumUntil").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("premium_id_key").on(table.id), index("premium_guildId_idx").on(table.guildId)]
);

export const premiumSubscriptionRelations = relations(premiumSubscription, ({ one }) => ({
  guildId: one(guild, {
    fields: [premiumSubscription.guildId],
    references: [guild.guildId],
  }),
  planId: one(premiumPlans, {
    fields: [premiumSubscription.planId],
    references: [premiumPlans.id],
  }),
}));
