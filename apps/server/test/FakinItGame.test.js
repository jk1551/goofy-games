import assert from "node:assert/strict";
import test from "node:test";
import { FakinItGame } from "../src/games/fakin-it/FakinItGame.js";
import { FAKIN_IT_ROUNDS } from "../src/games/fakin-it/prompts.js";

function makeGame(playerCount = 3) {
  const names = ["Alice", "Bob", "Cara", "Drew", "Emi", "Finn", "Gail"];
  const players = new Map();
  for (let index = 0; index < playerCount; index += 1) {
    const number = index + 1;
    players.set(`player-${number}`, {
      id: `id-${number}`,
      token: `player-${number}`,
      name: names[index],
      score: 0
    });
  }

  return new FakinItGame({
    room: { players },
    onStateChanged: () => {},
    random: () => 0.999
  });
}

function createStartedGame() {
  const game = makeGame();
  game.start();
  return game;
}

function readyEveryone(game) {
  for (const playerToken of ["player-1", "player-2", "player-3"]) {
    game.handlePlayerAction({ playerToken, action: { type: "ready" } });
  }
}

function voteFor(game, voterToken, accusedName) {
  const choice = game.voteChoices.find((entry) => entry.text === accusedName);
  assert.ok(choice, `Missing vote choice for ${accusedName}`);
  game.handlePlayerAction({
    playerToken: voterToken,
    action: { type: "choice", value: choice.id }
  });
}

function submitWrongVotes(game) {
  voteFor(game, "player-1", "Bob");
  voteFor(game, "player-2", "Cara");
  voteFor(game, "player-3", "Bob");
}

test("requires the same 3 to 6 player range as Fakin' It", () => {
  const tooSmall = makeGame(2);
  assert.throws(() => tooSmall.start(), /3 to 6 players/i);

  const tooLarge = makeGame(7);
  assert.throws(() => tooLarge.start(), /3 to 6 players/i);
});

test("keeps the task and Faker identity off the shared screen", () => {
  const game = createStartedGame();
  const publicState = game.getPublicState();
  const fakerState = game.getPlayerState("player-1");
  const playerState = game.getPlayerState("player-2");

  assert.equal(publicState.phase, "perform-task");
  assert.equal(publicState.prompt, "Follow the secret task on your phone. Keep it hidden.");
  assert.equal("fakerToken" in publicState, false);
  assert.equal(fakerState.role, "faker");
  assert.match(fakerState.prompt, /you are the faker/i);
  assert.equal(playerState.role, "player");
  assert.equal(playerState.prompt, FAKIN_IT_ROUNDS[0].prompts[0]);
  game.stop();
});

test("reveals the task only after everyone performs it and then opens player voting", () => {
  const game = createStartedGame();
  readyEveryone(game);

  const state = game.getPublicState();
  assert.equal(state.phase, "select-answer");
  assert.equal(state.prompt, FAKIN_IT_ROUNDS[0].prompts[0]);
  assert.equal(state.choices.length, 3);

  const bobState = game.getPlayerState("player-2");
  assert.equal(bobState.choices.length, 2);
  assert.equal(bobState.choices.some((choice) => choice.text === "Bob"), false);
  game.stop();
});

test("a unanimous non-Faker vote catches the Faker and awards sleuth points", () => {
  const game = createStartedGame();
  readyEveryone(game);

  voteFor(game, "player-1", "Bob");
  voteFor(game, "player-2", "Alice");
  voteFor(game, "player-3", "Alice");

  const state = game.getPublicState();
  assert.equal(state.phase, "reveal");
  assert.equal(state.reveal.caught, true);
  assert.equal(state.reveal.roundComplete, true);
  assert.equal(state.reveal.fakerName, "Alice");
  assert.equal(game.room.players.get("player-2").score, 375);
  assert.equal(game.room.players.get("player-3").score, 375);

  game.finishReveal();
  assert.equal(game.getPublicState().round, 2);
  assert.equal(game.getPublicState().phase, "perform-task");
  game.stop();
});

test("a split vote keeps the same Faker secret for the next attempt", () => {
  const game = createStartedGame();
  readyEveryone(game);

  voteFor(game, "player-1", "Bob");
  voteFor(game, "player-2", "Alice");
  voteFor(game, "player-3", "Bob");

  const reveal = game.getPublicState().reveal;
  assert.equal(reveal.caught, false);
  assert.equal(reveal.roundComplete, false);
  assert.equal(reveal.fakerName, null);
  assert.deepEqual(reveal.scoreboard, []);
  assert.equal(reveal.votes.every((vote) => vote.correct === null), true);

  game.finishReveal();
  const nextAttempt = game.getPublicState();
  assert.equal(nextAttempt.round, 1);
  assert.equal(nextAttempt.attempt, 2);
  assert.equal(game.fakerToken, "player-1");
  assert.equal(nextAttempt.phase, "perform-task");
  game.stop();
});

test("the Faker escapes and gets a bonus after surviving all three attempts", () => {
  const game = createStartedGame();

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    readyEveryone(game);
    submitWrongVotes(game);

    const reveal = game.getPublicState().reveal;
    assert.equal(reveal.caught, false);
    if (attempt < 3) {
      assert.equal(reveal.fakerName, null);
      game.finishReveal();
    } else {
      assert.equal(reveal.roundComplete, true);
      assert.equal(reveal.fakerName, "Alice");
    }
  }

  assert.equal(game.room.players.get("player-1").score, 950);
  game.finishReveal();
  assert.equal(game.getPublicState().round, 2);
  game.stop();
});

test("Text You Up gives the Faker a related prompt and reveals answers before voting", () => {
  const game = createStartedGame();
  game.fakerDeck = ["player-1"];
  game.startRound(5);

  const fakerState = game.getPlayerState("player-1");
  const bobState = game.getPlayerState("player-2");
  assert.equal(game.getPublicState().phase, "submit-response");
  assert.notEqual(fakerState.prompt, bobState.prompt);
  assert.equal(fakerState.allowAutoAnswer, false);

  game.handlePlayerAction({ playerToken: "player-1", action: { type: "text", value: "Phone charger" } });
  game.handlePlayerAction({ playerToken: "player-2", action: { type: "text", value: "Toothbrush" } });
  game.handlePlayerAction({ playerToken: "player-3", action: { type: "text", value: "Car" } });

  const state = game.getPublicState();
  assert.equal(state.phase, "select-answer");
  assert.equal(state.prompt, FAKIN_IT_ROUNDS[4].prompts[0].question);
  assert.deepEqual(state.responses.map((response) => response.name), ["Alice", "Bob", "Cara"]);
  game.stop();
});
