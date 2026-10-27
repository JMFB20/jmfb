import assert from "node:assert/strict";

const url = process.argv[2];
if (!url) throw new Error("usage: node test/live-four-player-relay.mjs wss://relay.example");

function connect() {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.addEventListener("open", () => resolve(socket), { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
}

function next(socket, type, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.removeEventListener("message", listener);
      reject(new Error(`timeout waiting for ${type}`));
    }, timeoutMs);
    const listener = (event) => {
      const message = JSON.parse(event.data);
      if (message.type !== type) return;
      clearTimeout(timeout);
      socket.removeEventListener("message", listener);
      resolve(message);
    };
    socket.addEventListener("message", listener);
  });
}

const sockets = await Promise.all([connect(), connect(), connect(), connect()]);
const request = (type, player, extra = {}) => ({
  type,
  protocol: 10,
  tag: `live${player}`,
  clientId: `${player + 1}`.repeat(32),
  romHash: "a".repeat(40),
  romSize: 32 * 1024 * 1024,
  gameCode: "BPEE",
  ...extra,
});

const roomReply = next(sockets[0], "room");
sockets[0].send(JSON.stringify(request("create", 0, { maxPlayers: 4 })));
const code = (await roomReply).code;
const readyPromises = sockets.map((socket) => next(socket, "session_ready"));
for (let player = 1; player < 4; player++) {
  const joined = next(sockets[player], "joined");
  sockets[player].send(JSON.stringify(request("join", player, { code })));
  assert.equal((await joined).playerId, player);
}
const ready = await Promise.all(readyPromises);
assert.deepEqual(ready.map((message) => message.playerId), [0, 1, 2, 3]);
assert.ok(ready.every((message) => message.playerTags.length === 4));

for (const socket of sockets) socket.close();
console.log(`live four-player relay ok: ${code}`);
