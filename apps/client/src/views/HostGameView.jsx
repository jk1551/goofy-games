import { Countdown } from "../components/Countdown.jsx";
import { Logo } from "../components/Logo.jsx";

export function HostGameView({ party, game, onReturnToLibrary }) {
  return (
    <main className="host-game-shell">
      <header className="host-game-header">
        <Logo compact />
        <div className="host-game-header__meta">
          <span>Party {party.code}</span>
          <button className="button button--ghost" type="button" onClick={onReturnToLibrary}>Game library</button>
        </div>
      </header>

      <section className="host-stage">
        <div className="host-stage__round">Round {game?.round ?? 1}</div>
        <Countdown deadline={game?.deadline} />
        <span className="eyebrow">{game?.message ?? "Starting game…"}</span>
        <h1>{game?.prompt ?? "Everybody get ready!"}</h1>
        <div className="submission-meter">
          <div>
            <strong>{game?.submissionCount ?? 0}</strong>
            <span>of {party.players.length} answers</span>
          </div>
          <div className="submission-meter__track">
            <span style={{ width: `${party.players.length ? ((game?.submissionCount ?? 0) / party.players.length) * 100 : 0}%` }} />
          </div>
        </div>
      </section>
    </main>
  );
}
