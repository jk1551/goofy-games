export class GameRegistry {
  #factories = new Map();

  register(gameId, factory) {
    if (!gameId || typeof factory !== "function") {
      throw new Error("A game registration requires an id and factory.");
    }
    if (this.#factories.has(gameId)) {
      throw new Error(`Game '${gameId}' is already registered.`);
    }
    this.#factories.set(gameId, factory);
    return this;
  }

  has(gameId) {
    return this.#factories.has(gameId);
  }

  create(gameId, context) {
    const factory = this.#factories.get(gameId);
    if (!factory) {
      throw new Error("That game is not available yet.");
    }
    return factory(context);
  }

  list() {
    return [...this.#factories.keys()];
  }
}
