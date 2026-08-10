import { GameRegistry } from "./GameRegistry.js";
import { BluffPartyGame } from "./bluff-party/BluffPartyGame.js";

export function createGameRegistry() {
  return new GameRegistry().register(
    "bluff-party",
    (context) => new BluffPartyGame(context)
  );
}
