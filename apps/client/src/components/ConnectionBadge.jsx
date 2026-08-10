export function ConnectionBadge({ state }) {
  return (
    <div className={`connection-badge connection-badge--${state}`}>
      <span aria-hidden="true" />
      {state}
    </div>
  );
}
