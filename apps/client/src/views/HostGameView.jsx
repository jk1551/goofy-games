import { Countdown } from "../components/Countdown.jsx";
import { Logo } from "../components/Logo.jsx";
import "../reveal.css";

export function HostGameView({ party, game, onReturnToLibrary }) {
  const isReveal = game?.phase === "reveal" && game?.reveal;

  return (
    <main className="host-game-shell">
      <header className="host-game-header">
        <Logo compact />
        <div className="host-game-header__meta">
          <span>Party {party.code}</span>
          <button className="button button--ghost" type="button" onClick={onReturnToLibrary}>Game library</button>
        </div>
      </header>

      {isReveal ? (
        <RevealStage game={game} />
      ) : (
        <PlayStage party={party} game={game} />
      )}
    </main>
  );
}

function PlayStage({ party, game }) {
  const isVoting = game?.phase === "select-answer";
  const completed = isVoting ? (game?.voteCount ?? 0) : (game?.submissionCount ?? 0);
  const label = isVoting ? "votes" : "answers";

  return (
    <section className="host-stage">
      <div className="host-stage__round">Round {game?.round ?? 1}</div>
      <Countdown deadline={game?.deadline} />
      <span className="eyebrow">{game?.message ?? "Starting game…"}</span>
      <h1>{game?.prompt ?? "Everybody get ready!"}</h1>
      <div className="submission-meter">
        <div>
          <strong>{completed}</strong>
          <span>of {party.players.length} {label}</span>
        </div>
        <div className="submission-meter__track">
          <span style={{ width: `${party.players.length ? (completed / party.players.length) * 100 : 0}%` }} />
        </div>
      </div>
    </section>
  );
}

function RevealStage({ game }) {
  return (
    <section className="reveal-stage">
      <div className="reveal-stage__heading">
        <div>
          <div className="host-stage__round">Round {game.round} results</div>
          <span className="eyebrow">The truth was</span>
          <h1>{game.reveal.correctAnswer}</h1>
        </div>
        <Countdown deadline={game.deadline} />
      </div>

      <div className="reveal-layout">
        <div className="reveal-answers">
          {game.reveal.answers.map((answer) => (
            <article className={`reveal-answer ${answer.isCorrect ? "reveal-answer--correct" : ""}`} key={answer.id}>
              <div className="reveal-answer__copy">
                <span>{answer.isCorrect ? "✓ Truth" : `Bluff by ${answer.authorName}`}</span>
                <strong>{answer.text}</strong>
              </div>
              <div className="reveal-answer__votes">
                <span>{answer.voters.length} {answer.voters.length === 1 ? "vote" : "votes"}</span>
                {answer.voters.length > 0 && <small>{answer.voters.join(", ")}</small>}
                {!answer.isCorrect && answer.pointsEarned > 0 && <b>+{answer.pointsEarned.toLocaleString()} pts</b>}
              </div>
            </article>
          ))}
        </div>

        <aside className="scoreboard-card">
          <span className="eyebrow">Updated scores</span>
          <h2>Leaderboard</h2>
          <div className="scoreboard-list">
            {game.reveal.scoreboard.map((player, index) => (
              <div className="scoreboard-row" key={player.id}>
                <span className="scoreboard-row__rank">{index + 1}</span>
                <strong>{player.name}</strong>
                <span className="scoreboard-row__round">+{player.roundPoints.toLocaleString()}</span>
                <b>{player.score.toLocaleString()}</b>
              </div>
            ))}
          </div>
          <p>Next round starts automatically.</p>
        </aside>
      </div>
    </section>
  );
}
