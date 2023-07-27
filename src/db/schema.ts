import { pgTable, uniqueIndex, index, boolean, timestamp, serial, varchar } from "drizzle-orm/pg-core";

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
  (table) => {
    return {
      guildIdKey: uniqueIndex("voicetrack_guildId_key").on(table.guildId),
      guildIdIdx: index("voicetrack_guildId_idx").on(table.guildId),
    };
  }
);

export const log = pgTable("log", {
  id: serial("id").primaryKey().notNull(),
  action: varchar("action").notNull(),
  guildId: varchar("guildId"),
  guildName: varchar("guildName"),
  userId: varchar("userId"),
  userName: varchar("userName"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
