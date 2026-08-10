import { BaseGame } from "../BaseGame.js";
import { BLUFF_PROMPTS } from "./prompts.js";

const BLUFF_DURATION_MS = 45_000;
const VOTE_DURATION_MS = 30_000;
const REVEAL_DURATION_MS = 12_000;
const TRUTH_POINTS = 1_000;
const BLUFF_POINTS = 500;

export class BluffPartyGame extends BaseGame {
  constructor(context) {
    super(context);
    this.submissions = new Map();
    this.votes = new Map();
    this.choiceEntries = [];
    this.roundPlayerTokens = [];
    this.roundPoints = new Map();
    this.reveal = null;
    this.state = {
      ...this.state,
      gameId: "bluff-party",
      title: "Bluff Party",
      prompt: null,
      inputType: "waiting",
      message: "Get ready to bluff."
    };
  }

  start() {
    this.startRound(1);
  }

  startRound(round) {
    this.state.round = round;
    this.state.prompt = this.getCurrentPrompt().question;
    this.state.inputType = "text";
    this.state.message = "Write a convincing fake answer.";
    this.submissions.clear();
    this.votes.clear();
    this.choiceEntries = [];
    this.roundPoints.clear();
    this.reveal = null;
    this.roundPlayerTokens = [...this.room.players.keys()];
    this.transitionTo("submit-bluff", BLUFF_DURATION_MS, () => this.finishBluffSubmission());
  }

  handlePlayerAction({ playerToken, action }) {
    if (!this.roundPlayerTokens.includes(playerToken)) {
      throw new Error("You joined after this round started. Watch this round and jump in on the next one.");
    }

    if (this.state.phase === "submit-bluff") {
      this.handleBluffAction(playerToken, action);
      return;
    }

    if (this.state.phase === "select-answer") {
      this.handleVoteAction(playerToken, action);
      return;
    }

    throw new Error("Answers are closed for this round.");
  }

  handleBluffAction(playerToken, action) {
    if (this.submissions.has(playerToken)) {
      throw new Error("Your answer is already locked in.");
    }

    if (action?.type === "auto-answer") {
      this.submissions.set(playerToken, this.createAutomaticBluff());
    } else {
      const answer = String(action?.value ?? "").trim().slice(0, 120);
      if (!answer) {
        throw new Error("Enter an answer before submitting.");
      }
      this.submissions.set(playerToken, answer);
    }

    if (this.everyRoundPlayerHasSubmitted()) {
      this.beginAnswerSelection();
      return;
    }

    this.emitState();
  }

  finishBluffSubmission() {
    for (const playerToken of this.roundPlayerTokens) {
      if (!this.submissions.has(playerToken)) {
        this.submissions.set(playerToken, this.createAutomaticBluff());
      }
    }
    this.beginAnswerSelection();
  }

  beginAnswerSelection() {
    const prompt = this.getCurrentPrompt();
    const entries = [
      { text: prompt.answer, ownerToken: null, isCorrect: true },
      ...this.roundPlayerTokens.map((playerToken) => ({
        text: this.submissions.get(playerToken),
        ownerToken: playerToken,
        isCorrect: false
      }))
    ];

    this.choiceEntries = shuffle(entries).map((entry, index) => ({
      ...entry,
      id: `choice-${index + 1}`
    }));
    this.votes.clear();
    this.state.inputType = "choice";
    this.state.message = "Which answer is actually true?";
    this.transitionTo("select-answer", VOTE_DURATION_MS, () => this.finishVoting());
  }

  handleVoteAction(playerToken, action) {
    if (this.votes.has(playerToken)) {
      throw new Error("Your answer is already locked in.");
    }

    const choiceId = String(action?.value ?? "");
    const choice = this.choiceEntries.find((entry) => entry.id === choiceId);
    if (!choice) {
      throw new Error("Choose one of the available answers.");
    }
    if (choice.ownerToken === playerToken) {
      throw new Error("You cannot vote for your own bluff.");
    }

    this.votes.set(playerToken, choiceId);
    if (this.everyRoundPlayerHasVoted()) {
      this.finishVoting();
      return;
    }

    this.emitState();
  }

  finishVoting() {
    if (this.state.phase !== "select-answer") {
      return;
    }

    this.calculateScores();
    this.reveal = this.buildReveal();
    this.state.inputType = "waiting";
    this.state.message = "Here’s how everyone did.";
    this.transitionTo("reveal", REVEAL_DURATION_MS, () => this.finishReveal());
  }

  finishReveal() {
    if (this.state.phase !== "reveal") {
      return;
    }
    this.startRound(this.state.round + 1);
  }

  calculateScores() {
    this.roundPoints = new Map(this.roundPlayerTokens.map((playerToken) => [playerToken, 0]));

    for (const [voterToken, choiceId] of this.votes.entries()) {
      const choice = this.choiceEntries.find((entry) => entry.id === choiceId);
      if (!choice) {
        continue;
      }

      if (choice.isCorrect) {
        this.addRoundPoints(voterToken, TRUTH_POINTS);
      } else if (choice.ownerToken) {
        this.addRoundPoints(choice.ownerToken, BLUFF_POINTS);
      }
    }

    for (const playerToken of this.roundPlayerTokens) {
      const player = this.room.players.get(playerToken);
      if (player) {
        player.score = Number(player.score ?? 0) + (this.roundPoints.get(playerToken) ?? 0);
      }
    }
  }

  addRoundPoints(playerToken, points) {
    this.roundPoints.set(playerToken, (this.roundPoints.get(playerToken) ?? 0) + points);
  }

  buildReveal() {
    return {
      correctAnswer: this.getCurrentPrompt().answer,
      answers: this.choiceEntries.map((choice) => {
        const voters = [...this.votes.entries()]
          .filter(([, choiceId]) => choiceId === choice.id)
          .map(([playerToken]) => this.getPlayerName(playerToken));

        return {
          id: choice.id,
          text: choice.text,
          isCorrect: choice.isCorrect,
          authorName: choice.ownerToken ? this.getPlayerName(choice.ownerToken) : null,
          voters,
          pointsEarned: choice.ownerToken ? voters.length * BLUFF_POINTS : 0
        };
      }),
      scoreboard: this.roundPlayerTokens
        .map((playerToken) => {
          const player = this.room.players.get(playerToken);
          return {
            id: player?.id ?? playerToken,
            name: player?.name ?? "Player",
            roundPoints: this.roundPoints.get(playerToken) ?? 0,
            score: Number(player?.score ?? 0)
          };
        })
        .sort((left, right) => right.score - left.score || right.roundPoints - left.roundPoints)
    };
  }

  getPlayerName(playerToken) {
    return this.room.players.get(playerToken)?.name ?? "Player";
  }

  getPublicState() {
    return {
      ...this.state,
      submissionCount: this.submissions.size,
      voteCount: this.votes.size,
      choices: this.state.phase === "select-answer"
        ? this.choiceEntries.map(({ id, text }) => ({ id, text }))
        : [],
      reveal: this.state.phase === "reveal" ? this.reveal : null
    };
  }

  getPlayerState(playerToken) {
    const publicState = this.getPublicState();
    return {
      ...publicState,
      hasSubmitted: this.submissions.has(playerToken),
      hasVoted: this.votes.has(playerToken),
      choices: this.state.phase === "select-answer"
        ? this.choiceEntries
          .filter((entry) => entry.ownerToken !== playerToken)
          .map(({ id, text }) => ({ id, text }))
        : []
    };
  }

  everyRoundPlayerHasSubmitted() {
    return this.roundPlayerTokens.length > 0
      && this.roundPlayerTokens.every((playerToken) => this.submissions.has(playerToken));
  }

  everyRoundPlayerHasVoted() {
    return this.roundPlayerTokens.length > 0
      && this.roundPlayerTokens.every((playerToken) => this.votes.has(playerToken));
  }

  createAutomaticBluff() {
    const prompt = this.getCurrentPrompt();
    const usedAnswers = new Set([
      prompt.answer.toLowerCase(),
      ...[...this.submissions.values()].map((answer) => answer.toLowerCase())
    ]);
    const available = prompt.fallbackAnswers.filter((answer) => !usedAnswers.has(answer.toLowerCase()));
    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)];
    }
    return `Mystery answer ${this.submissions.size + 1}`;
  }

  getCurrentPrompt() {
    return BLUFF_PROMPTS[(this.state.round - 1) % BLUFF_PROMPTS.length];
  }
}

function shuffle(values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}
