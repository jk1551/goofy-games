import assert from "node:assert/strict";
import test from "node:test";
import { createPlayerToken, getOrCreatePlayerToken } from "../src/utils/playerToken.js";

test("uses randomUUID when it is available", () => {
  assert.equal(createPlayerToken({ randomUUID: () => "secure-uuid" }), "secure-uuid");
});

test("creates a UUID-shaped token when randomUUID is unavailable on local HTTP", () => {
  const cryptoApi = {
    getRandomValues(bytes) {
      bytes.fill(17);
      return bytes;
    }
  };

  assert.match(
    createPlayerToken(cryptoApi),
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
  );
});

test("reuses a stored player token", () => {
  const storage = {
    value: "existing-token",
    getItem() { return this.value; },
    setItem(_key, value) { this.value = value; }
  };

  assert.equal(getOrCreatePlayerToken({ storage, cryptoApi: {} }), "existing-token");
});
