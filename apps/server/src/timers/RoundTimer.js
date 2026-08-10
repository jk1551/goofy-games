export class RoundTimer {
  #timeoutId = null;
  #deadline = null;

  start(durationMs, onComplete) {
    this.stop();
    this.#deadline = Date.now() + durationMs;
    this.#timeoutId = setTimeout(() => {
      this.#timeoutId = null;
      this.#deadline = null;
      onComplete();
    }, durationMs);
  }

  stop() {
    if (this.#timeoutId) {
      clearTimeout(this.#timeoutId);
    }
    this.#timeoutId = null;
    this.#deadline = null;
  }

  get deadline() {
    return this.#deadline;
  }
}
