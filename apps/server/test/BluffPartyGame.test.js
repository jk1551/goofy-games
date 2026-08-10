import assert from "node:assert/strict";
import test from "node:test";
import { BluffPartyGame } from "../src/games/bluff-party/BluffPartyGame.js";

function createGame() {
  const room = {
    players: new Map([
      ["player-1", { token: "player-1" }],
      ["player-2", { token: "player-2" }],
      ["player-3", { token: "player-3" }]
    ])
  };
  return new BluffPartyGame({ room, onStateChanged: () => {} });
}

test("moves to answer selection immediately when every player submits", () => {
  const game = createGame();
  game.start();

  game.handlePlayerAction({ playerToken: "player-1", action: { type: "text", value: "One" } });
  game.handlePlayerAction({ playerToken: "player-2", action: { type: "text", value: "Two" } });
  assert.equal(game.getPublicState().phase, "submit-bluff");

  game.handlePlayerAction({ playerToken: "player-3", action: { type: "text", value: "Three" } });

  const state = game.getPublicState();
  assert.equal(state.phase, "select-answer");
  assert.equal(state.inputType, "choice");
  assert.equal(state.submissionCount, 3);
  assert.equal(state.choices.length, 4);
  assert.ok(state.deadline > Date.now());
  game.stop();
});

test("answer for me creates a server-selected bluff", () => {
  const game = createGame();
  game.start();

  game.handlePlayerAction({ playerToken: "player-1", action: { type: "auto-answer" } });

  const answer = game.submissions.get("player-1");
  assert.equal(typeof answer, "string");
  assert.ok(answer.length > 0);
  assert.equal(game.getPlayerState("player-1").hasSubmitted, true);
  game.stop();
});

test("submission timeout fills missing answers and starts voting", () => {
  const game = createGame();
  game.start();
  game.handlePlayerAction({ playerToken: "player-1", action: { type: "text", value: "Manual bluff" } });

  game.finishBluffSubmission();

  assert.equal(game.submissions.size, 3);
  assert.equal(game.getPublicState().phase, "select-answer");
  assert.ok(game.submissions.get("player-2"));
  assert.ok(game.submissions.get("player-3"));
  game.stop();
});

test("players cannot vote for their own bluff", () => {
  const game = createGame();
  game.start();
  game.handlePlayerAction({ playerToken: "player-1", action: { type: "text", value: "One" } });
  game.handlePlayerAction({ playerToken: "player-2", action: { type: "text", value: "Two" } });
  game.handlePlayerAction({ playerToken: "player-3", action: { type: "text", value: "Three" } });

  const ownChoice = game.choiceEntries.find((choice) => choice.ownerToken === "player-1");
  assert.ok(ownChoice);
  assert.throws(
    () => game.handlePlayerAction({
      playerToken: "player-1",
      action: { type: "choice", value: ownChoice.id }
    }),
    /own bluff/i
  );

  const playerState = game.getPlayerState("player-1");
  assert.equal(playerState.choices.some((choice) => choice.id === ownChoice.id), false);
  game.stop();
});

test("voting ends immediately when every player chooses", () => {
  const game = createGame();
  game.start();
  game.handlePlayerAction({ playerToken: "player-1", action: { type: "text", value: "One" } });
  game.handlePlayerAction({ playerToken: "player-2", action: { type: "text", value: "Two" } });
  game.handlePlayerAction({ playerToken: "player-3", action: { type: "text", value: "Three" } });

  for (const playerToken of ["player-1", "player-2", "player-3"]) {
    const choice = game.choiceEntries.find((entry) => entry.ownerToken !== playerToken);
    game.handlePlayerAction({ playerToken, action: { type: "choice", value: choice.id } });
  }

  assert.equal(game.getPublicState().phase, "round-complete");
  assert.equal(game.getPublicState().inputType, "waiting");
  game.stop();
});
