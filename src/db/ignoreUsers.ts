import { dzz, eq } from "db/client";
import { guild } from "db/schema";

export async function addIgnoredUser(guildId: string, userId: string): Promise<"already_ignored" | "not_found" | "success"> {
  const [get] = await dzz.select().from(guild).where(eq(guild.guildId, guildId));

  if (!get) return "not_found";
  if (get.ignoreUsers?.includes(userId)) return "already_ignored";

  const ignoreArr = get.ignoreUsers ? [...get.ignoreUsers, userId] : [userId];
  await dzz.update(guild).set({ ignoreUsers: ignoreArr }).where(eq(guild.guildId, guildId));

  return "success";
}

export async function removeIgnoredUser(guildId: string, userId: string): Promise<"no_users" | "not_ignored" | "success"> {
  const [get] = await dzz.select().from(guild).where(eq(guild.guildId, guildId));

  if (!get || !get.ignoreUsers) return "no_users";
  if (!get.ignoreUsers.includes(userId)) return "not_ignored";

  const ignoreArr = get.ignoreUsers.filter((id) => id !== userId);
  await dzz.update(guild).set({ ignoreUsers: ignoreArr.length > 0 ? ignoreArr : null }).where(eq(guild.guildId, guildId));

  return "success";
}
