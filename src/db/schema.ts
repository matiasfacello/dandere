import { boolean, index, integer, pgTable, serial, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";

export const voiceTrack = pgTable(
  "voicetrack",
  {
    guildId: varchar("guildId").notNull(),
    enabled: boolean("enabled").default(false).notNull(),
    allChannels: boolean("allChannels"),
    trackChannels: varchar("trackChannels"),
    logChannel: varchar("logChannel"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    ignoreUsers: varchar("ignoreUsers"),
  },
  (table) => [uniqueIndex("voicetrack_guildId_key").on(table.guildId), index("voicetrack_guildId_idx").on(table.guildId)]
);

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
