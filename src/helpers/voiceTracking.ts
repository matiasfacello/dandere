export type VoiceTrackingGuild = {
  trackAll: boolean;
  ignoreUsers: readonly string[] | null;
};

export type TrackedVoiceChannel = {
  channelId: string;
  enabled: boolean;
};

export function shouldLogVoiceEvent(
  guildRow: VoiceTrackingGuild | undefined,
  trackedChannelRows: readonly TrackedVoiceChannel[],
  channelIds: readonly string[],
  userId: string,
): boolean {
  if (!guildRow || guildRow.ignoreUsers?.includes(userId)) return false;
  if (guildRow.trackAll) return true;

  // A move touches two channels; either side being tracked makes the event relevant.
  return trackedChannelRows.some(
    (trackedChannel) => trackedChannel.enabled && channelIds.includes(trackedChannel.channelId),
  );
}
