import assert from "node:assert/strict";
import test from "node:test";
import { isOriginAllowed, parseClientOrigins } from "../src/config.js";

test("allows browser clients on common private LAN addresses by default", () => {
  assert.equal(isOriginAllowed("http://192.168.1.25:5173", []), true);
  assert.equal(isOriginAllowed("http://10.0.0.8:5173", []), true);
  assert.equal(isOriginAllowed("http://172.20.10.4:5173", []), true);
  assert.equal(isOriginAllowed("http://goofy-games.local:5173", []), true);
});

test("rejects public or unexpected origins when using local defaults", () => {
  assert.equal(isOriginAllowed("https://example.com", []), false);
  assert.equal(isOriginAllowed("http://192.168.1.25:9000", []), false);
  assert.equal(isOriginAllowed("not-a-url", []), false);
});

test("explicit client origins create a production allowlist", () => {
  const origins = parseClientOrigins("https://games.example.com, https://tv.example.com");
  assert.deepEqual(origins, ["https://games.example.com", "https://tv.example.com"]);
  assert.equal(isOriginAllowed("https://games.example.com", origins), true);
  assert.equal(isOriginAllowed("http://192.168.1.25:5173", origins), false);
});
