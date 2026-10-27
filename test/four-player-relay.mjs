import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { RelayRoom } from "../src/worker.js";

globalThis.crypto ??= webcrypto;

class FakeSocket {
  constructor() {
    this.messages = [];
    this.data = undefined;
  }
  deserializeAttachment() { return this.data; }
  serializeAttachment(value) { this.data = value; }
  send(value) { this.messages.push(JSON.parse(value)); }
  take(type) {
    const index = this.messages.findIndex((message) => message.type === type);
    assert.notEqual(index, -1, `missing ${type}`);
    return this.messages.splice(index, 1)[0];
  }
}

const sockets = [new FakeSocket(), new FakeSocket(), new FakeSocket(), new FakeSocket()];
const room = new RelayRoom({ getWebSockets: () => sockets });
const client = (type, tag, extra = {}) => ({
  type,
  protocol: 10,
  tag,
  clientId: `${(tag.length % 16).toString(16)}`.repeat(32),
  romHash: "a".repeat(40),
  romSize: 32 * 1024 * 1024,
  gameCode: "BPEE",
  ...extra,
});

room.webSocketMessage(sockets[0], JSON.stringify(client("create", "host", { maxPlayers: 4 })));
const code = sockets[0].take("room").code;
for (let player = 1; player < 4; player++) {
  room.webSocketMessage(sockets[player], JSON.stringify(
    client("join", `guest${player}`, { code })));
  assert.equal(sockets[player].take("joined").playerId, player);
}
for (let player = 0; player < 4; player++) {
  const ready = sockets[player].take("session_ready");
  assert.equal(ready.playerId, player);
  assert.deepEqual(ready.playerTags, ["host", "guest1", "guest2", "guest3"]);
}

room.webSocketMessage(sockets[3], JSON.stringify({ type: "input", frame: 41, buttons: 7 }));
assert.deepEqual(sockets[0].take("input"), {
  type: "input", playerId: 3, frame: 41, buttons: 7,
});
assert.equal(sockets[1].messages.some((message) => message.type === "input"), false);

room.webSocketMessage(sockets[0], JSON.stringify({ type: "input", frame: 42, buttons: 9 }));
for (let player = 1; player < 4; player++) {
  assert.deepEqual(sockets[player].take("input"), {
    type: "input", playerId: 0, frame: 42, buttons: 9,
  });
}

room.webSocketMessage(sockets[0], JSON.stringify({
  type: "video_frame", targetPlayerId: 2, sequence: 5, frame: 99, data: "AQID",
}));
assert.equal(sockets[2].take("video_frame").playerId, 2);
assert.equal(sockets[1].messages.some((message) => message.type === "video_frame"), false);
assert.equal(sockets[3].messages.some((message) => message.type === "video_frame"), false);

for (let player = 1; player < 4; player++) {
  const hash = `${player}`.repeat(64);
  room.webSocketMessage(sockets[player], JSON.stringify({
    type: "player_save_begin", size: 3, chunks: 1, hash,
  }));
  assert.equal(sockets[0].take("player_save_begin").playerId, player);
  room.webSocketMessage(sockets[player], JSON.stringify({ type: "player_save_chunk", index: 0, data: "AQID" }));
  assert.equal(sockets[0].take("player_save_chunk").playerId, player);
  room.webSocketMessage(sockets[player], JSON.stringify({ type: "player_save_end" }));
  assert.equal(sockets[0].take("player_save_end").playerId, player);
}

const stateHash = "f".repeat(64);
room.webSocketMessage(sockets[0], JSON.stringify({
  type: "state_begin", size: 3, chunks: 1, hash: stateHash,
}));
for (let player = 1; player < 4; player++) {
  assert.equal(sockets[player].take("state_begin").hash, stateHash);
  room.webSocketMessage(sockets[player], JSON.stringify({ type: "state_ready", hash: stateHash }));
}
assert.equal(sockets[0].take("state_ready").hash, stateHash);
room.webSocketMessage(sockets[0], JSON.stringify({ type: "start" }));
for (let player = 0; player < 4; player++) sockets[player].take("start");

room.webSocketMessage(sockets[0], JSON.stringify({
  type: "return_save_begin", targetPlayerId: 3, size: 3, chunks: 1, hash: "e".repeat(64),
}));
assert.equal(sockets[3].take("return_save_begin").playerId, 3);
assert.equal(sockets[1].messages.some((message) => message.type === "return_save_begin"), false);

console.log(`four-player relay ok: room ${code}, routing, barrier and individual saves`);
