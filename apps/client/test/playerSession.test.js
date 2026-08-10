import assert from "node:assert/strict";
import test from "node:test";
import {
  clearPlayerSession,
  normalizePlayerSession,
  readPlayerSession,
  savePlayerSession
} from "../src/utils/playerSession.js";

function createStorage() {
  const values = new Map();
  return {
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
    removeItem(key) { values.delete(key); }
  };
}

test("persists the room, display name, and player token needed to rejoin", () => {
  const storage = createStorage();
  const saved = savePlayerSession({
    roomCode: " ab12 ",
    displayName: "  Goofy   Joe ",
    playerToken: "player-token"
  }, { storage });

  assert.deepEqual(saved, {
    version: 1,
    roomCode: "AB12",
    displayName: "Goofy Joe",
    playerToken: "player-token"
  });
  assert.deepEqual(readPlayerSession({ storage }), saved);
});

test("rejects corrupted or incomplete stored sessions", () => {
  assert.equal(normalizePlayerSession(null), null);
  assert.equal(normalizePlayerSession({ roomCode: "ABCD", displayName: "Joe" }), null);

  const storage = createStorage();
  storage.setItem("goofy-games-player-session", "not-json");
  assert.equal(readPlayerSession({ storage }), null);
});

test("clears a stored player session when the party ends or the player leaves", () => {
  const storage = createStorage();
  savePlayerSession({
    roomCode: "ABCD",
    displayName: "Joe",
    playerToken: "player-token"
  }, { storage });

  clearPlayerSession({ storage });
  assert.equal(readPlayerSession({ storage }), null);
});
