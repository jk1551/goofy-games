import assert from "node:assert/strict";
import test from "node:test";
import { BluffPartyGame } from "../src/games/bluff-party/BluffPartyGame.js";

function createGame() {
  const room = {
    players: new Map([
      ["player-1", { id: "id-1", token: "player-1", name: "Alice", score: 100 }],
      ["player-2", { id: "id-2", token: "player-2", name: "Bob", score: 200 }],
      ["player-3", { id: "id-3", token: "player-3", name: "Cara", score: 300 }]
    ])
  };
  return new BluffPartyGame({ room, onStateChanged: () => {} });
}

function submitAllBluffs(game) {
  game.handlePlayerAction({ playerToken: "player-1", action: { type: "text", value: "One" } });
  game.handlePlayerAction({ playerToken: "player-2", action: { type: "text", value: "Two" } });
  game.handlePlayerAction({ playerToken: "player-3", action: { type: "text", value: "Three" } });
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
  submitAllBluffs(game);

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

test("voting ends immediately in a reveal when every player chooses", () => {
  const game = createGame();
  game.start();
  submitAllBluffs(game);

  for (const playerToken of ["player-1", "player-2", "player-3"]) {
    const choice = game.choiceEntries.find((entry) => entry.ownerToken !== playerToken);
    game.handlePlayerAction({ playerToken, action: { type: "choice", value: choice.id } });
  }

  const state = game.getPublicState();
  assert.equal(state.phase, "reveal");
  assert.equal(state.inputType, "waiting");
  assert.ok(state.reveal);
  assert.ok(state.deadline > Date.now());
  game.stop();
});

test("reveal shows who voted for what and applies round points to cumulative scores", () => {
  const game = createGame();
  game.start();
  submitAllBluffs(game);

  const truth = game.choiceEntries.find((choice) => choice.isCorrect);
  const aliceBluff = game.choiceEntries.find((choice) => choice.ownerToken === "player-1");

  game.handlePlayerAction({ playerToken: "player-1", action: { type: "choice", value: truth.id } });
  game.handlePlayerAction({ playerToken: "player-2", action: { type: "choice", value: aliceBluff.id } });
  game.handlePlayerAction({ playerToken: "player-3", action: { type: "choice", value: aliceBluff.id } });

  const reveal = game.getPublicState().reveal;
  const revealedTruth = reveal.answers.find((answer) => answer.isCorrect);
  const revealedAliceBluff = reveal.answers.find((answer) => answer.authorName === "Alice");
  const aliceScore = reveal.scoreboard.find((player) => player.name === "Alice");
  const bobScore = reveal.scoreboard.find((player) => player.name === "Bob");
  const caraScore = reveal.scoreboard.find((player) => player.name === "Cara");

  assert.deepEqual(revealedTruth.voters, ["Alice"]);
  assert.equal(revealedAliceBluff.text, "One");
  assert.deepEqual(revealedAliceBluff.voters, ["Bob", "Cara"]);
  assert.equal(revealedAliceBluff.pointsEarned, 1_000);

  assert.equal(aliceScore.roundPoints, 2_000);
  assert.equal(aliceScore.score, 2_100);
  assert.equal(bobScore.roundPoints, 0);
  assert.equal(bobScore.score, 200);
  assert.equal(caraScore.roundPoints, 0);
  assert.equal(caraScore.score, 300);
  assert.equal(reveal.scoreboard[0].name, "Alice");
  game.stop();
});

test("reveal automatically advances into a fresh next round without resetting scores", () => {
  const game = createGame();
  game.start();
  submitAllBluffs(game);

  const truth = game.choiceEntries.find((choice) => choice.isCorrect);
  for (const playerToken of ["player-1", "player-2", "player-3"]) {
    game.handlePlayerAction({ playerToken, action: { type: "choice", value: truth.id } });
  }

  assert.equal(game.getPublicState().phase, "reveal");
  const firstPrompt = game.getPublicState().prompt;
  game.finishReveal();

  const nextRound = game.getPublicState();
  assert.equal(nextRound.round, 2);
  assert.equal(nextRound.phase, "submit-bluff");
  assert.equal(nextRound.inputType, "text");
  assert.notEqual(nextRound.prompt, firstPrompt);
  assert.equal(nextRound.submissionCount, 0);
  assert.equal(nextRound.reveal, null);
  assert.equal(game.room.players.get("player-1").score, 1_100);
  assert.equal(game.room.players.get("player-2").score, 1_200);
  assert.equal(game.room.players.get("player-3").score, 1_300);
  game.stop();
});
