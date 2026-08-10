import assert from "node:assert/strict";
import test from "node:test";
import { RoomManager } from "../src/rooms/RoomManager.js";

test("creates a room and lets a player join", () => {
  const manager = new RoomManager();
  const room = manager.createRoom({ hostSocketId: "host-1" });
  const result = manager.joinRoom({
    roomCode: room.code,
    socketId: "player-1",
    playerToken: "token-1",
    displayName: "  Goofy   Joe  "
  });

  assert.equal(result.player.name, "Goofy Joe");
  assert.equal(manager.toPublicSnapshot(room).players.length, 1);
});

test("reconnects an existing player by token", () => {
  const manager = new RoomManager();
  const room = manager.createRoom({ hostSocketId: "host-1" });
  manager.joinRoom({
    roomCode: room.code,
    socketId: "player-1",
    playerToken: "same-token",
    displayName: "Joe"
  });
  manager.disconnect("player-1");
  const result = manager.joinRoom({
    roomCode: room.code,
    socketId: "player-2",
    playerToken: "same-token",
    displayName: "Joe"
  });

  assert.equal(room.players.size, 1);
  assert.equal(result.player.connected, true);
  assert.equal(result.player.socketId, "player-2");
});

test("a stale socket disconnect cannot mark a rejoined player offline", () => {
  const manager = new RoomManager();
  const room = manager.createRoom({ hostSocketId: "host-1" });
  const firstJoin = manager.joinRoom({
    roomCode: room.code,
    socketId: "player-old",
    playerToken: "same-token",
    displayName: "Joe"
  });

  const secondJoin = manager.joinRoom({
    roomCode: room.code,
    socketId: "player-new",
    playerToken: "same-token",
    displayName: "Joe"
  });

  manager.disconnect("player-old");
  const snapshot = manager.toPublicSnapshot(room);

  assert.equal(secondJoin.player.id, firstJoin.player.id);
  assert.equal(room.players.size, 1);
  assert.equal(snapshot.players[0].connected, true);
  assert.equal(secondJoin.player.socketId, "player-new");
  assert.equal(manager.getMembership("player-new").playerToken, "same-token");
});
