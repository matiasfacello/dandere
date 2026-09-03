import assert from "node:assert/strict";
import { createCommandHash } from "helpers/commandHash";
import { printDev } from "helpers/functions";

const ping = { name: "ping", description: "Replies with pong" };
const status = { name: "status", description: "Shows bot status" };
const changedPing = { ...ping, description: "Replies with latency" };

assert.equal(createCommandHash([ping, status]), createCommandHash([status, ping]));
assert.notEqual(createCommandHash([ping]), createCommandHash([changedPing]));
assert.notEqual(createCommandHash([ping]), createCommandHash([ping, status]));
assert.equal(createCommandHash([]), createCommandHash([]));

printDev("Command hash checks passed.");
