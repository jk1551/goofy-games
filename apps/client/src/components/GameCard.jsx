import { GAME_STATUS } from "@goofy-games/shared";

export function GameCard({ game, selected, onSelect }) {
  const available = game.status === GAME_STATUS.AVAILABLE;

  return (
    <button
      className={`game-card game-card--${game.accent} ${selected ? "game-card--selected" : ""}`}
      onClick={() => available && onSelect(game.id)}
      disabled={!available}
      type="button"
    >
      <span className="game-card__emoji" aria-hidden="true">{game.emoji}</span>
      <span className="game-card__copy">
        <span className="game-card__meta">
          {available ? `${game.minPlayers}–${game.maxPlayers} players` : "Coming soon"}
        </span>
        <strong>{game.name}</strong>
        <span>{game.description}</span>
      </span>
      {selected && <span className="game-card__check">✓</span>}
    </button>
  );
}
