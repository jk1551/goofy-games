export function PlayerList({ players = [] }) {
  return (
    <section className="panel player-panel">
      <div className="panel__heading">
        <div>
          <span className="eyebrow">Party people</span>
          <h2>{players.length} joined</h2>
        </div>
        <div className="live-dot" aria-label="Live" />
      </div>

      {players.length === 0 ? (
        <div className="empty-state">
          <span>👋</span>
          <p>Waiting for the first goofball to join.</p>
        </div>
      ) : (
        <div className="player-grid">
          {players.map((player, index) => (
            <div className="player-chip" key={player.id}>
              <span className="player-chip__avatar">{["🤪", "🦆", "🛸", "🦖", "🐸", "🤠"][index % 6]}</span>
              <span>{player.name}</span>
              <i className={player.connected ? "online" : "offline"} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
