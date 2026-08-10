import { BaseGame } from "../BaseGame.js";
import { BLUFF_PROMPTS } from "./prompts.js";

export class BluffPartyGame extends BaseGame {
  constructor(context) {
    super(context);
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
    this.state.round = 1;
    this.state.prompt = BLUFF_PROMPTS[0].question;
    this.state.inputType = "text";
    this.state.message = "Write a convincing fake answer.";
    this.transitionTo("submit-bluff", 45_000, () => this.revealPlaceholder());
  }

  handlePlayerAction({ playerToken, action }) {
    if (this.state.phase !== "submit-bluff") {
      throw new Error("Answers are closed for this round.");
    }

    const answer = String(action?.value ?? "").trim().slice(0, 120);
    if (!answer) {
      throw new Error("Enter an answer before submitting.");
    }

    this.state.submissions ??= {};
    this.state.submissions[playerToken] = answer;
    this.emitState();
  }

  revealPlaceholder() {
    this.state.inputType = "waiting";
    this.state.message = "The reusable engine advanced the round automatically.";
    this.transitionTo("round-complete", null);
  }

  getPublicState() {
    const { submissions, ...publicState } = this.state;
    return {
      ...publicState,
      submissionCount: Object.keys(submissions ?? {}).length
    };
  }

  getPlayerState(playerToken) {
    return {
      ...this.getPublicState(),
      hasSubmitted: Boolean(this.state.submissions?.[playerToken])
    };
  }
}
