import assert from "node:assert/strict";
import { printDev } from "helpers/functions";
import { shouldLogVoiceEvent } from "helpers/voiceTracking";

const userId = "user-1";
const guild = { trackAll: false, ignoreUsers: null };

assert.equal(
  shouldLogVoiceEvent(
    { ...guild, trackAll: true },
    [{ channelId: "channel-2", enabled: false }],
    ["channel-1"],
    userId,
  ),
  true,
);
assert.equal(
  shouldLogVoiceEvent(guild, [{ channelId: "channel-1", enabled: true }], ["channel-1"], userId),
  true,
);
assert.equal(
  shouldLogVoiceEvent(guild, [{ channelId: "channel-2", enabled: true }], ["channel-1"], userId),
  false,
);
assert.equal(shouldLogVoiceEvent(guild, [], ["channel-1"], userId), false);
assert.equal(shouldLogVoiceEvent(undefined, [], ["channel-1"], userId), false);
assert.equal(
  shouldLogVoiceEvent(
    { trackAll: true, ignoreUsers: [userId] },
    [{ channelId: "channel-1", enabled: true }],
    ["channel-1"],
    userId,
  ),
  false,
);

// a move out of a tracked channel into an untracked one must still log
assert.equal(
  shouldLogVoiceEvent(guild, [{ channelId: "channel-1", enabled: true }], ["channel-1", "channel-2"], userId),
  true,
);
assert.equal(
  shouldLogVoiceEvent(guild, [{ channelId: "channel-3", enabled: true }], ["channel-1", "channel-2"], userId),
  false,
);

printDev("Voice tracking checks passed.");
