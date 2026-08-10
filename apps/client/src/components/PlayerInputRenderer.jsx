import { useEffect, useState } from "react";
import { Countdown } from "./Countdown.jsx";

export function PlayerInputRenderer({ game, onSubmit }) {
  const [value, setValue] = useState("");
  const [pendingPhase, setPendingPhase] = useState(null);

  useEffect(() => {
    setPendingPhase(null);
    setValue("");
  }, [game?.phase, game?.round]);

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

  if (game.inputType === "text") {
    if (game.hasSubmitted || pendingPhase === "submit-bluff") {
      return <WaitingMessage title="Answer locked" message="Now wait for everyone else to finish." emoji="✅" />;
    }

    const submitBluff = async (action) => {
      const result = await onSubmit(action);
      if (result) {
        setPendingPhase("submit-bluff");
      }
    };

    const handleSubmit = async (event) => {
      event.preventDefault();
      await submitBluff({ type: "text", value });
    };

    return (
      <div className="player-game-card">
        <div className="player-game-card__topline">
          <span>Round {game.round}{game.totalRounds ? ` of ${game.totalRounds}` : ""}</span>
          <Countdown deadline={game.deadline} />
        </div>
        <span className="eyebrow">{game.message}</span>
        <h1>{game.prompt}</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="answer">Your convincing lie</label>
          <textarea
            id="answer"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            maxLength={120}
            placeholder="Type something believable…"
            autoFocus
            required
          />
          <div className="form-footer">
            <span>{value.length}/120</span>
            <div className="button-row">
              <button
                className="button button--ghost"
                type="button"
                onClick={() => submitBluff({ type: "auto-answer" })}
              >
                Answer for me
              </button>
              <button className="button button--primary" type="submit">Lock it in</button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  if (game.inputType === "choice") {
    if (game.hasVoted || pendingPhase === "select-answer") {
      return <WaitingMessage title="Pick locked" message="Your vote is in. Watch the main screen." emoji="✅" />;
    }

    const chooseAnswer = async (choiceId) => {
      const result = await onSubmit({ type: "choice", value: choiceId });
      if (result) {
        setPendingPhase("select-answer");
      }
    };

    return (
      <div className="player-game-card">
        <div className="player-game-card__topline">
          <span>Round {game.round}{game.totalRounds ? ` of ${game.totalRounds}` : ""}</span>
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
