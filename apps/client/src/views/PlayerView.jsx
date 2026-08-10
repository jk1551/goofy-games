import { Logo } from "../components/Logo.jsx";
import { PlayerInputRenderer } from "../components/PlayerInputRenderer.jsx";

export function PlayerView({ party, game, onSubmit, error }) {
  return (
    <main className="player-shell">
      <header className="player-header">
        <Logo compact />
        <div className="player-room-code">Party <strong>{party.code}</strong></div>
      </header>
      <section className="player-content">
        <PlayerInputRenderer key={`${game?.phase}-${game?.round}`} game={game} onSubmit={onSubmit} />
        {error && <p className="form-error form-error--center">{error}</p>}
      </section>
    </main>
  );
}
