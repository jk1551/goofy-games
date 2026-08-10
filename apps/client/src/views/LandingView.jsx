import { useState } from "react";
import { Logo } from "../components/Logo.jsx";

export function LandingView({ onCreate, onJoin, error }) {
  const [roomCode, setRoomCode] = useState("");
  const [displayName, setDisplayName] = useState("");

  const handleJoin = (event) => {
    event.preventDefault();
    onJoin({ roomCode, displayName });
  };

  return (
    <main className="landing-shell">
      <div className="blob blob--one" />
      <div className="blob blob--two" />
      <header className="landing-header">
        <Logo />
        <span className="platform-pill">Phone-powered party games</span>
      </header>

      <section className="hero">
        <div className="hero__copy">
          <span className="eyebrow">One screen. Every phone. Maximum nonsense.</span>
          <h1>Game night just got <em>goofier.</em></h1>
          <p>Create a party on the big screen, invite everyone with a four-character code, and jump between a growing library of games.</p>
          <button className="button button--primary button--large" onClick={onCreate} type="button">
            Start a party <span>→</span>
          </button>
        </div>

        <div className="join-card">
          <div className="join-card__icon">🎮</div>
          <span className="eyebrow">Playing on your phone?</span>
          <h2>Join the party</h2>
          <form onSubmit={handleJoin}>
            <label htmlFor="room-code">Party code</label>
            <input
              id="room-code"
              className="code-input"
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 4))}
              placeholder="ABCD"
              inputMode="text"
              autoComplete="off"
              required
            />
            <label htmlFor="display-name">Your name</label>
            <input
              id="display-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Goofy Joe"
              maxLength={24}
              autoComplete="nickname"
              required
            />
            <button className="button button--dark" type="submit">Join game</button>
          </form>
          {error && <p className="form-error">{error}</p>}
        </div>
      </section>

      <section className="feature-strip" aria-label="Platform features">
        <div><span>⚡</span><strong>Instant rooms</strong><small>No downloads or accounts</small></div>
        <div><span>📱</span><strong>Phones are controllers</strong><small>Works in any modern browser</small></div>
        <div><span>🧩</span><strong>Growing game library</strong><small>Switch games without rejoining</small></div>
      </section>
    </main>
  );
}
