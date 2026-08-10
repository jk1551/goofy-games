import { RoundTimer } from "../timers/RoundTimer.js";

export class BaseGame {
  constructor({ room, onStateChanged }) {
    this.room = room;
    this.onStateChanged = onStateChanged;
    this.timer = new RoundTimer();
    this.state = {
      phase: "intro",
      round: 0,
      deadline: null
    };
  }

  start() {
    throw new Error("Games must implement start().");
  }

  handlePlayerAction() {
    throw new Error("Games must implement handlePlayerAction().");
  }

  transitionTo(phase, durationMs, onComplete) {
    this.timer.stop();
    this.state.phase = phase;
    this.state.deadline = durationMs ? Date.now() + durationMs : null;
    this.emitState();

    if (durationMs && onComplete) {
      this.timer.start(durationMs, onComplete);
    }
  }

  emitState() {
    this.onStateChanged?.();
  }

  getPublicState() {
    return { ...this.state };
  }

  getPlayerState() {
    return this.getPublicState();
  }

  stop() {
    this.timer.stop();
  }
}
