import { useState } from "react";
import { Countdown } from "./Countdown.jsx";

export function PlayerInputRenderer({ game, onSubmit }) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(Boolean(game?.hasSubmitted));
  const [error, setError] = useState("");

  if (!game) {
    return <WaitingMessage title="You're in!" message="The host is choosing a game." />;
  }

  if (game.hasSubmitted || submitted) {
    return <WaitingMessage title="Answer locked" message="Now wait for everyone else to finish." emoji="✅" />;
  }

  if (game.inputType !== "text") {
    return <WaitingMessage title={game.title ?? "Game on"} message={game.message ?? "Watch the main screen."} />;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const result = await onSubmit({ type: "text", value });
    if (result) {
      setSubmitted(true);
    } else {
      setError("Your answer was not submitted. Try again.");
    }
  };

  return (
    <div className="player-game-card">
      <div className="player-game-card__topline">
        <span>Round {game.round}</span>
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
          <button className="button button--primary" type="submit">Lock it in</button>
        </div>
        {error && <p className="form-error">{error}</p>}
      </form>
    </div>
  );
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
