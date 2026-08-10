import { Countdown } from "../components/Countdown.jsx";
import { Logo } from "../components/Logo.jsx";
import "../reveal.css";
import "../game-over.css";
import "../fakin-it.css";

export function HostGameView({ party, game, onReturnToLibrary }) {
  const isReveal = game?.phase === "reveal" && game?.reveal;
  const isFakinItReveal = isReveal && game.reveal?.type === "fakin-it";
  const isGameOver = game?.phase === "game-over" && game?.finalResult;

  return (
    <main className="host-game-shell">
      <header className="host-game-header">
        <Logo compact />
        <div className="host-game-header__meta">
          <span>Party {party.code}</span>
          <button className="button button--ghost" type="button" onClick={onReturnToLibrary}>Game library</button>
        </div>
      </header>

      {isGameOver ? (
        <GameOverStage game={game} onReturnToLibrary={onReturnToLibrary} />
      ) : isFakinItReveal ? (
        <FakinItRevealStage game={game} />
      ) : isReveal ? (
        <BluffRevealStage game={game} />
      ) : (
        <PlayStage party={party} game={game} />
      )}
    </main>
  );
}

function PlayStage({ party, game }) {
  const isVoting = game?.phase === "select-answer";
  const isReady = game?.inputType === "ready";
  const completed = isVoting ? (game?.voteCount ?? 0) : (game?.submissionCount ?? 0);
  const label = isVoting ? "votes" : isReady ? "ready" : "answers";
  const roundLabel = game?.totalRounds
    ? `Round ${game?.round ?? 1} of ${game.totalRounds}`
    : `Round ${game?.round ?? 1}`;
  const detailLabel = game?.category
    ? `${roundLabel} · ${game.category}${game.attempt ? ` · Attempt ${game.attempt}` : ""}`
    : roundLabel;

  return (
    <section className="host-stage">
      <div className="host-stage__round">{detailLabel}</div>
      <Countdown deadline={game?.deadline} />
      <span className="eyebrow">{game?.message ?? "Starting game…"}</span>
      <h1>{game?.prompt ?? "Everybody get ready!"}</h1>

      {(game?.responses?.length ?? 0) > 0 && <FakinResponses responses={game.responses} />}

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

function BluffRevealStage({ game }) {
  const finalRound = game.round >= game.totalRounds;

  return (
    <section className="reveal-stage">
      <div className="reveal-stage__heading">
        <div>
          <div className="host-stage__round">Round {game.round} of {game.totalRounds} results</div>
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

        <Scoreboard scoreboard={game.reveal.scoreboard} footer={finalRound ? "Final results coming up…" : "Next round starts automatically."} />
      </div>
    </section>
  );
}

function FakinItRevealStage({ game }) {
  const reveal = game.reveal;
  const heading = reveal.caught
    ? `${reveal.fakerName} was Fakin' It!`
    : reveal.roundComplete
      ? `${reveal.fakerName} fooled everybody!`
      : "The Faker survives…";
  const status = reveal.caught
    ? "Unanimous catch"
    : reveal.roundComplete
      ? "Three attempts survived"
      : "The room wasn't unanimous";

  return (
    <section className="reveal-stage">
      <div className="reveal-stage__heading">
        <div>
          <div className="host-stage__round">Round {game.round} of {game.totalRounds} · {reveal.category} · Attempt {reveal.attempt}</div>
          <span className="eyebrow">{status}</span>
          <h1>{heading}</h1>
          <div className="fakin-reveal-status">Task: {reveal.task}</div>
        </div>
        <Countdown deadline={game.deadline} />
      </div>

      {(reveal.responses?.length ?? 0) > 0 && <FakinResponses responses={reveal.responses} />}

      <div className="reveal-layout">
        <div className="fakin-vote-list">
          {reveal.votes.map((vote) => (
            <div className="fakin-vote" key={vote.voterName}>
              <span>{vote.voterName}</span>
              <span>→</span>
              <strong>{vote.accusedName}</strong>
            </div>
          ))}
        </div>

        {reveal.roundComplete ? (
          <Scoreboard
            scoreboard={reveal.scoreboard}
            footer={game.round >= game.totalRounds ? "Final results coming up…" : "A new Faker is coming next round."}
          />
        ) : (
          <aside className="scoreboard-card">
            <span className="eyebrow">Still undercover</span>
            <h2>No identity reveal yet</h2>
            <p>The same Faker stays hidden for the next attempt.</p>
          </aside>
        )}
      </div>
    </section>
  );
}

function FakinResponses({ responses }) {
  return (
    <div className="fakin-response-grid">
      {responses.map((response) => (
        <div className="fakin-response" key={response.name}>
          <span>{response.name}</span>
          <strong>{response.text}</strong>
        </div>
      ))}
    </div>
  );
}

function Scoreboard({ scoreboard, footer }) {
  return (
    <aside className="scoreboard-card">
      <span className="eyebrow">Updated scores</span>
      <h2>Leaderboard</h2>
      <div className="scoreboard-list">
        {scoreboard.map((player, index) => (
          <div className="scoreboard-row" key={player.id}>
            <span className="scoreboard-row__rank">{index + 1}</span>
            <strong>{player.name}</strong>
            <span className="scoreboard-row__round">+{player.roundPoints.toLocaleString()}</span>
            <b>{player.score.toLocaleString()}</b>
          </div>
        ))}
      </div>
      <p>{footer}</p>
    </aside>
  );
}

function GameOverStage({ game, onReturnToLibrary }) {
  const winners = game.finalResult.winners ?? [];
  const winnerText = winners.length === 1
    ? `${winners[0].name} wins!`
    : `${winners.map((winner) => winner.name).join(" & ")} tie!`;

  return (
    <section className="game-over-stage">
      <div className="game-over-stage__trophy">🏆</div>
      <span className="eyebrow">{game.title ?? "Game"} champion{winners.length === 1 ? "" : "s"}</span>
      <h1>{winnerText}</h1>
      <p>{game.message}</p>

      {game.gameId === "fakin-it" && (
        <div className="fakin-role-awards">
          <div className="fakin-role-award">
            <span>Best Faker</span>
            <strong>{game.finalResult.bestFaker?.name ?? "—"}</strong>
          </div>
          <div className="fakin-role-award">
            <span>Best Sleuth</span>
            <strong>{game.finalResult.bestSleuth?.name ?? "—"}</strong>
          </div>
        </div>
      )}

      <div className="game-over-scoreboard">
        {game.finalResult.scoreboard.map((player, index) => (
          <div className={`game-over-score ${index === 0 ? "game-over-score--winner" : ""}`} key={player.id}>
            <span>{index + 1}</span>
            <strong>{player.name}</strong>
            <b>{player.score.toLocaleString()} pts</b>
          </div>
        ))}
      </div>

      <button className="button button--primary button--large" type="button" onClick={onReturnToLibrary}>
        Back to game library <span>→</span>
      </button>
    </section>
  );
}
