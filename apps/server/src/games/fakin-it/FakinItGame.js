import { BaseGame } from "../BaseGame.js";
import { FAKIN_IT_ROUNDS } from "./prompts.js";

const TASK_DURATION_MS = 12_000;
const TEXT_DURATION_MS = 35_000;
const VOTE_DURATION_MS = 30_000;
const REVEAL_DURATION_MS = 9_000;
const MAX_ATTEMPTS = 3;
const SLEUTH_POINTS = Object.freeze([100, 125, 150]);
const CAUGHT_BONUS = Object.freeze([275, 150, 75]);
const FAKER_SURVIVE_POINTS = 150;
const FAKER_ESCAPE_BONUS = 500;

export class FakinItGame extends BaseGame {
  constructor(context) {
    super(context);
    this.random = context.random ?? Math.random;
    this.roundPlayerTokens = [];
    this.fakerDeck = [];
    this.fakerToken = null;
    this.lastFakerToken = null;
    this.attempt = 0;
    this.readyPlayers = new Set();
    this.submissions = new Map();
    this.votes = new Map();
    this.voteChoices = [];
    this.roundPoints = new Map();
    this.roleStats = new Map();
    this.reveal = null;
    this.finalResult = null;
    this.state = {
      ...this.state,
      gameId: "fakin-it",
      title: "Fakin' It",
      prompt: null,
      inputType: "waiting",
      message: "Get ready to lie with a straight face.",
      totalRounds: FAKIN_IT_ROUNDS.length,
      category: null,
      attempt: 0,
      maxAttempts: MAX_ATTEMPTS
    };
  }

  start() {
    const playerCount = this.room.players.size;
    if (playerCount < 3 || playerCount > 6) {
      throw new Error("Fakin' It supports 3 to 6 players.");
    }

    this.roundPlayerTokens = [...this.room.players.keys()];
    this.roleStats = new Map(this.roundPlayerTokens.map((playerToken) => [
      playerToken,
      { fakerPoints: 0, sleuthPoints: 0 }
    ]));
    this.startRound(1);
  }

  startRound(round) {
    this.state.round = round;
    this.state.category = this.getCurrentCategory().name;
    this.fakerToken = this.drawFaker();
    this.attempt = 1;
    this.reveal = null;
    this.finalResult = null;
    this.startAttempt();
  }

  startAttempt() {
    const category = this.getCurrentCategory();
    this.readyPlayers.clear();
    this.submissions.clear();
    this.votes.clear();
    this.voteChoices = [];
    this.roundPoints = new Map(this.roundPlayerTokens.map((playerToken) => [playerToken, 0]));
    this.reveal = null;
    this.state.attempt = this.attempt;
    this.state.category = category.name;
    this.state.prompt = category.mode === "text"
      ? "Everyone is answering a secret question on their phone."
      : "Follow the secret task on your phone. Keep it hidden.";
    this.state.message = `${category.emoji} ${category.name} · Attempt ${this.attempt} of ${MAX_ATTEMPTS}`;
    this.state.inputType = category.mode === "text" ? "text" : "ready";

    const duration = category.mode === "text" ? TEXT_DURATION_MS : TASK_DURATION_MS;
    const phase = category.mode === "text" ? "submit-response" : "perform-task";
    this.transitionTo(phase, duration, () => this.finishTask());
  }

  handlePlayerAction({ playerToken, action }) {
    if (!this.roundPlayerTokens.includes(playerToken)) {
      throw new Error("You joined after the game started. Watch this game and join the next one.");
    }

    if (this.state.phase === "perform-task") {
      this.handleReadyAction(playerToken, action);
      return;
    }

    if (this.state.phase === "submit-response") {
      this.handleTextAction(playerToken, action);
      return;
    }

    if (this.state.phase === "select-answer") {
      this.handleVoteAction(playerToken, action);
      return;
    }

    throw new Error("That action is closed right now.");
  }

  handleReadyAction(playerToken, action) {
    if (action?.type !== "ready") {
      throw new Error("Tap ready after you have completed the secret task.");
    }
    if (this.readyPlayers.has(playerToken)) {
      throw new Error("You're already ready.");
    }

    this.readyPlayers.add(playerToken);
    if (this.everyPlayerIsReady()) {
      this.finishTask();
      return;
    }
    this.emitState();
  }

  handleTextAction(playerToken, action) {
    if (this.submissions.has(playerToken)) {
      throw new Error("Your answer is already locked in.");
    }

    const value = String(action?.value ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
    if (!value) {
      throw new Error("Enter an answer before submitting.");
    }

    this.submissions.set(playerToken, value);
    if (this.everyPlayerHasSubmitted()) {
      this.finishTask();
      return;
    }
    this.emitState();
  }

  finishTask() {
    if (!new Set(["perform-task", "submit-response"]).has(this.state.phase)) {
      return;
    }

    if (this.getCurrentCategory().mode === "text") {
      for (const playerToken of this.roundPlayerTokens) {
        if (!this.submissions.has(playerToken)) {
          this.submissions.set(playerToken, "No answer");
        }
      }
    }

    this.beginVoting();
  }

  beginVoting() {
    this.voteChoices = this.roundPlayerTokens.map((playerToken, index) => ({
      id: `suspect-${index + 1}`,
      playerToken,
      text: this.getPlayerName(playerToken)
    }));
    this.votes.clear();
    this.state.prompt = this.getPublicTask();
    this.state.inputType = "choice";
    this.state.message = "Talk it out. Who is Fakin' It?";
    this.transitionTo("select-answer", VOTE_DURATION_MS, () => this.finishVoting());
  }

  handleVoteAction(playerToken, action) {
    if (this.votes.has(playerToken)) {
      throw new Error("Your vote is already locked in.");
    }

    const choiceId = String(action?.value ?? "");
    const choice = this.voteChoices.find((entry) => entry.id === choiceId);
    if (!choice) {
      throw new Error("Choose one of the available players.");
    }
    if (choice.playerToken === playerToken) {
      throw new Error("You cannot vote for yourself.");
    }

    this.votes.set(playerToken, choiceId);
    if (this.everyPlayerHasVoted()) {
      this.finishVoting();
      return;
    }
    this.emitState();
  }

  finishVoting() {
    if (this.state.phase !== "select-answer") {
      return;
    }

    const nonFakerTokens = this.roundPlayerTokens.filter((playerToken) => playerToken !== this.fakerToken);
    const correctVoters = nonFakerTokens.filter((playerToken) => this.getVotedForToken(playerToken) === this.fakerToken);
    const caught = correctVoters.length === nonFakerTokens.length;

    for (const playerToken of correctVoters) {
      this.awardPoints(playerToken, SLEUTH_POINTS[this.attempt - 1], "sleuthPoints");
      if (caught) {
        this.awardPoints(playerToken, CAUGHT_BONUS[this.attempt - 1], "sleuthPoints");
      }
    }

    if (!caught) {
      this.awardPoints(this.fakerToken, FAKER_SURVIVE_POINTS, "fakerPoints");
      if (this.attempt >= MAX_ATTEMPTS) {
        this.awardPoints(this.fakerToken, FAKER_ESCAPE_BONUS, "fakerPoints");
      }
    }

    const roundComplete = caught || this.attempt >= MAX_ATTEMPTS;
    this.reveal = this.buildReveal({ caught, roundComplete });
    this.state.inputType = "waiting";
    this.state.message = caught
      ? `${this.getPlayerName(this.fakerToken)} got caught!`
      : roundComplete
        ? `${this.getPlayerName(this.fakerToken)} fooled the room!`
        : "Not unanimous. The Faker gets another shot.";
    this.transitionTo("reveal", REVEAL_DURATION_MS, () => this.finishReveal());
  }

  finishReveal() {
    if (this.state.phase !== "reveal") {
      return;
    }

    if (!this.reveal?.roundComplete) {
      this.attempt += 1;
      this.startAttempt();
      return;
    }

    if (this.state.round >= FAKIN_IT_ROUNDS.length) {
      this.finishGame();
      return;
    }

    this.startRound(this.state.round + 1);
  }

  finishGame() {
    const scoreboard = this.buildScoreboard();
    const winningScore = scoreboard[0]?.score ?? 0;
    const winners = scoreboard.filter((player) => player.score === winningScore);
    const bestFaker = this.buildRoleLeader("fakerPoints");
    const bestSleuth = this.buildRoleLeader("sleuthPoints");

    this.finalResult = { winners, scoreboard, bestFaker, bestSleuth };
    this.state.prompt = null;
    this.state.inputType = "waiting";
    this.state.message = winners.length === 1
      ? `${winners[0].name} wins Fakin' It!`
      : `${winners.map((winner) => winner.name).join(" & ")} tie for the win!`;
    this.transitionTo("game-over", null);
  }

  awardPoints(playerToken, points, statKey) {
    const player = this.room.players.get(playerToken);
    if (!player) {
      return;
    }

    player.score = Number(player.score ?? 0) + points;
    this.roundPoints.set(playerToken, (this.roundPoints.get(playerToken) ?? 0) + points);
    const stats = this.roleStats.get(playerToken) ?? { fakerPoints: 0, sleuthPoints: 0 };
    stats[statKey] += points;
    this.roleStats.set(playerToken, stats);
  }

  buildReveal({ caught, roundComplete }) {
    const revealFaker = roundComplete;
    return {
      type: "fakin-it",
      caught,
      roundComplete,
      attempt: this.attempt,
      maxAttempts: MAX_ATTEMPTS,
      category: this.getCurrentCategory().name,
      task: this.getPublicTask(),
      fakerName: revealFaker ? this.getPlayerName(this.fakerToken) : null,
      votes: this.roundPlayerTokens.map((playerToken) => ({
        voterName: this.getPlayerName(playerToken),
        accusedName: this.getPlayerName(this.getVotedForToken(playerToken)),
        correct: this.getVotedForToken(playerToken) === this.fakerToken
      })),
      responses: this.buildResponses(),
      scoreboard: this.buildScoreboard()
    };
  }

  buildScoreboard() {
    return this.roundPlayerTokens
      .map((playerToken) => {
        const player = this.room.players.get(playerToken);
        return {
          id: player?.id ?? playerToken,
          name: player?.name ?? "Player",
          roundPoints: this.roundPoints.get(playerToken) ?? 0,
          score: Number(player?.score ?? 0)
        };
      })
      .sort((left, right) => right.score - left.score || right.roundPoints - left.roundPoints || left.name.localeCompare(right.name));
  }

  buildRoleLeader(statKey) {
    const ranked = this.roundPlayerTokens
      .map((playerToken) => ({
        name: this.getPlayerName(playerToken),
        points: this.roleStats.get(playerToken)?.[statKey] ?? 0
      }))
      .sort((left, right) => right.points - left.points || left.name.localeCompare(right.name));
    return ranked[0] ?? null;
  }

  buildResponses() {
    if (this.getCurrentCategory().mode !== "text") {
      return [];
    }
    return this.roundPlayerTokens.map((playerToken) => ({
      name: this.getPlayerName(playerToken),
      text: this.submissions.get(playerToken) ?? "No answer"
    }));
  }

  getPublicState() {
    return {
      ...this.state,
      submissionCount: this.state.phase === "perform-task" ? this.readyPlayers.size : this.submissions.size,
      voteCount: this.votes.size,
      choices: this.state.phase === "select-answer"
        ? this.voteChoices.map(({ id, text }) => ({ id, text }))
        : [],
      responses: this.state.phase === "select-answer" ? this.buildResponses() : [],
      reveal: this.state.phase === "reveal" ? this.reveal : null,
      finalResult: this.state.phase === "game-over" ? this.finalResult : null
    };
  }

  getPlayerState(playerToken) {
    const publicState = this.getPublicState();

    if (this.state.phase === "perform-task") {
      return {
        ...publicState,
        prompt: playerToken === this.fakerToken
          ? "You are the Faker! Watch everyone else and copy a believable action."
          : this.getCurrentPrompt(),
        message: playerToken === this.fakerToken
          ? "You did not get the real task. Blend in."
          : "Do this now, then keep your answer to yourself.",
        role: playerToken === this.fakerToken ? "faker" : "player",
        hasSubmitted: this.readyPlayers.has(playerToken)
      };
    }

    if (this.state.phase === "submit-response") {
      const prompt = this.getCurrentPrompt();
      return {
        ...publicState,
        prompt: playerToken === this.fakerToken ? prompt.fakerQuestion : prompt.question,
        message: playerToken === this.fakerToken
          ? "You're the Faker. Your question is similar, but not the same."
          : "Answer your question truthfully.",
        role: playerToken === this.fakerToken ? "faker" : "player",
        inputLabel: "Your answer",
        inputPlaceholder: "Keep it short and believable…",
        allowAutoAnswer: false,
        hasSubmitted: this.submissions.has(playerToken)
      };
    }

    return {
      ...publicState,
      hasVoted: this.votes.has(playerToken),
      choices: this.state.phase === "select-answer"
        ? this.voteChoices
          .filter((entry) => entry.playerToken !== playerToken)
          .map(({ id, text }) => ({ id, text }))
        : []
    };
  }

  getCurrentCategory() {
    return FAKIN_IT_ROUNDS[this.state.round - 1];
  }

  getCurrentPrompt() {
    const category = this.getCurrentCategory();
    return category.prompts[(this.attempt - 1) % category.prompts.length];
  }

  getPublicTask() {
    const prompt = this.getCurrentPrompt();
    return typeof prompt === "string" ? prompt : prompt.question;
  }

  getVotedForToken(playerToken) {
    const choiceId = this.votes.get(playerToken);
    return this.voteChoices.find((choice) => choice.id === choiceId)?.playerToken ?? null;
  }

  getPlayerName(playerToken) {
    if (!playerToken) {
      return "No vote";
    }
    return this.room.players.get(playerToken)?.name ?? "Player";
  }

  everyPlayerIsReady() {
    return this.roundPlayerTokens.every((playerToken) => this.readyPlayers.has(playerToken));
  }

  everyPlayerHasSubmitted() {
    return this.roundPlayerTokens.every((playerToken) => this.submissions.has(playerToken));
  }

  everyPlayerHasVoted() {
    return this.roundPlayerTokens.every((playerToken) => this.votes.has(playerToken));
  }

  drawFaker() {
    if (this.fakerDeck.length === 0) {
      this.fakerDeck = shuffle(this.roundPlayerTokens, this.random);
    }

    if (this.fakerDeck[0] === this.lastFakerToken && this.fakerDeck.length > 1) {
      [this.fakerDeck[0], this.fakerDeck[1]] = [this.fakerDeck[1], this.fakerDeck[0]];
    }

    const fakerToken = this.fakerDeck.shift();
    this.lastFakerToken = fakerToken;
    return fakerToken;
  }
}

function shuffle(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}
