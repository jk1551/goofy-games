export function Logo({ compact = false }) {
  return (
    <div className={`logo ${compact ? "logo--compact" : ""}`}>
      <div className="logo__mark" aria-hidden="true">G</div>
      <div>
        <strong>Goofy</strong>
        <span>Games</span>
      </div>
    </div>
  );
}
