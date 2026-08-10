import assert from "node:assert/strict";
import test from "node:test";
import { createRoomCode } from "../src/rooms/createRoomCode.js";

test("creates a four-character room code by default", () => {
  assert.equal(createRoomCode(4, () => 0), "AAAA");
});

test("uses an alphabet without confusing characters", () => {
  const code = createRoomCode(100);
  assert.match(code, /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
});
