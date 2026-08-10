import { GAME_CATALOG } from "@goofy-games/shared";
import { GameCard } from "../components/GameCard.jsx";
import { Logo } from "../components/Logo.jsx";
import { PlayerList } from "../components/PlayerList.jsx";

export function HostLibraryView({ party, onSelectGame, onStartGame }) {
  const selectedGame = GAME_CATALOG.find((game) => game.id === party.selectedGameId);
  const enoughPlayers = party.players.length >= (selectedGame?.minPlayers ?? 1);

  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <Logo compact />
        <div className="room-code-block">
          <span>Join at this screen's address</span>
          <div><small>Code</small><strong>{party.code}</strong></div>
        </div>
      </header>

      <div className="dashboard-grid">
        <PlayerList players={party.players} />

        <section className="library-panel">
          <div className="library-heading">
            <div>
              <span className="eyebrow">Choose the chaos</span>
              <h1>Game library</h1>
            </div>
            <span className="library-count">{GAME_CATALOG.length} games</span>
          </div>

          <div className="game-grid">
            {GAME_CATALOG.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                selected={game.id === party.selectedGameId}
                onSelect={onSelectGame}
              />
            ))}
          </div>

          <div className="start-bar">
            <div>
              <span>Up next</span>
              <strong>{selectedGame?.emoji} {selectedGame?.name}</strong>
              <small>{enoughPlayers ? "Ready when you are." : `Needs at least ${selectedGame?.minPlayers} players.`}</small>
            </div>
            <button
              className="button button--primary button--large"
              type="button"
              onClick={() => onStartGame(party.selectedGameId)}
              disabled={!enoughPlayers}
            >
              Start game <span>→</span>
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
