import { useEffect, useState } from "react";
import { Countdown } from "./Countdown.jsx";

export function PlayerInputRenderer({ game, onSubmit }) {
  const [value, setValue] = useState("");
  const [pendingPhase, setPendingPhase] = useState(null);

  useEffect(() => {
    setPendingPhase(null);
    setValue("");
  }, [game?.phase, game?.round, game?.attempt]);

  if (!game) {
    return <WaitingMessage title="You're in!" message="The host is choosing a game." />;
  }

  if (game.phase === "game-over" && game.finalResult) {
    const winners = game.finalResult.winners ?? [];
    const winnerText = winners.length === 1
      ? `${winners[0].name} wins!`
      : `${winners.map((winner) => winner.name).join(" & ")} tie!`;

    return (
      <WaitingMessage
        title={winnerText}
        message={game.message ?? "The game is over. Watch the main screen for final scores."}
        emoji="🏆"
      />
    );
  }

  if (game.inputType === "ready") {
    if (game.hasSubmitted || pendingPhase === game.phase) {
      return <WaitingMessage title="Ready!" message="Keep your task secret and watch the room." emoji="👀" />;
    }

    const markReady = async () => {
      const phase = game.phase;
      const result = await onSubmit({ type: "ready" });
      if (result) {
        setPendingPhase(phase);
      }
    };

    return (
      <div className="player-game-card">
        <div className="player-game-card__topline">
          <span>{roundLabel(game)}</span>
          <Countdown deadline={game.deadline} />
        </div>
        <span className="eyebrow">{game.message}</span>
        <h1>{game.prompt}</h1>
        <button className="button button--primary button--large" type="button" onClick={markReady}>
          Done — I'm ready
        </button>
      </div>
    );
  }

  if (game.inputType === "text") {
    if (game.hasSubmitted || pendingPhase === game.phase) {
      return <WaitingMessage title="Answer locked" message="Now wait for everyone else to finish." emoji="✅" />;
    }

    const allowAutoAnswer = game.allowAutoAnswer ?? game.gameId === "bluff-party";
    const submitText = async (action) => {
      const phase = game.phase;
      const result = await onSubmit(action);
      if (result) {
        setPendingPhase(phase);
      }
    };

    const handleSubmit = async (event) => {
      event.preventDefault();
      await submitText({ type: "text", value });
    };

    return (
      <div className="player-game-card">
        <div className="player-game-card__topline">
          <span>{roundLabel(game)}</span>
          <Countdown deadline={game.deadline} />
        </div>
        <span className="eyebrow">{game.message}</span>
        <h1>{game.prompt}</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="answer">{game.inputLabel ?? "Your convincing lie"}</label>
          <textarea
            id="answer"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            maxLength={game.maxLength ?? 120}
            placeholder={game.inputPlaceholder ?? "Type something believable…"}
            autoFocus
            required
          />
          <div className="form-footer">
            <span>{value.length}/{game.maxLength ?? 120}</span>
            <div className="button-row">
              {allowAutoAnswer && (
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={() => submitText({ type: "auto-answer" })}
                >
                  Answer for me
                </button>
              )}
              <button className="button button--primary" type="submit">Lock it in</button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  if (game.inputType === "choice") {
    if (game.hasVoted || pendingPhase === game.phase) {
      return <WaitingMessage title="Pick locked" message="Your vote is in. Watch the main screen." emoji="✅" />;
    }

    const chooseAnswer = async (choiceId) => {
      const phase = game.phase;
      const result = await onSubmit({ type: "choice", value: choiceId });
      if (result) {
        setPendingPhase(phase);
      }
    };

    return (
      <div className="player-game-card">
        <div className="player-game-card__topline">
          <span>{roundLabel(game)}</span>
          <Countdown deadline={game.deadline} />
        </div>
        <span className="eyebrow">{game.message}</span>
        <h1>{game.prompt}</h1>
        <div className="answer-grid">
          {game.choices?.map((choice) => (
            <button
              className="button button--ghost"
              type="button"
              key={choice.id}
              onClick={() => chooseAnswer(choice.id)}
            >
              {choice.text}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return <WaitingMessage title={game.title ?? "Game on"} message={game.message ?? "Watch the main screen."} />;
}

function roundLabel(game) {
  const round = game.totalRounds ? `Round ${game.round} of ${game.totalRounds}` : `Round ${game.round}`;
  return game.attempt ? `${round} · Attempt ${game.attempt}` : round;
}

function WaitingMessage({ title, message, emoji = "🎉" }) {
  return (
    <div className="waiting-card">
      <span>{emoji}</span>
      <h1>{title}</h1>
      <p>{message}</p>
      <div className="waiting-dots"><i /><i /><i /></div>
    </div>
  );
}
