import assert from "node:assert/strict";
import test from "node:test";
import { GameRegistry } from "../src/games/GameRegistry.js";

test("registers and creates a game", () => {
  const registry = new GameRegistry();
  registry.register("demo", (context) => ({ context }));
  assert.deepEqual(registry.create("demo", { room: "ABCD" }), {
    context: { room: "ABCD" }
  });
});

test("rejects unknown games", () => {
  const registry = new GameRegistry();
  assert.throws(() => registry.create("missing", {}), /not available/i);
});
