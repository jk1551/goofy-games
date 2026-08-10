import assert from "node:assert/strict";
import test from "node:test";
import { toastReducer } from "../src/toasts/toastReducer.js";

test("adds, deduplicates, and removes error toasts", () => {
  const first = { id: "1", message: "Could not join", tone: "error" };
  const replacement = { id: "2", message: "Could not join", tone: "error" };
  let state = toastReducer([], { type: "add", toast: first });
  state = toastReducer(state, { type: "add", toast: replacement });

  assert.deepEqual(state, [replacement]);
  assert.deepEqual(toastReducer(state, { type: "remove", id: "2" }), []);
});

test("keeps only the four newest toasts", () => {
  let state = [];
  for (let index = 0; index < 6; index += 1) {
    state = toastReducer(state, {
      type: "add",
      toast: { id: String(index), message: String(index), tone: "error" }
    });
  }
  assert.deepEqual(state.map((toast) => toast.id), ["2", "3", "4", "5"]);
});
