import { GameRegistry } from "./GameRegistry.js";
import { BluffPartyGame } from "./bluff-party/BluffPartyGame.js";
import { FakinItGame } from "./fakin-it/FakinItGame.js";

export function createGameRegistry() {
  return new GameRegistry()
    .register(
      "bluff-party",
      (context) => new BluffPartyGame(context)
    )
    .register(
      "fakin-it",
      (context) => new FakinItGame(context)
    );
}
