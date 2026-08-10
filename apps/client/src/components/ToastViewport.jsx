const ICONS = Object.freeze({
  error: "!",
  success: "✓",
  info: "i"
});

export function ToastViewport({ toasts, onDismiss }) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="toast-viewport" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div
          className={`toast toast--${toast.tone}`}
          key={toast.id}
          role={toast.tone === "error" ? "alert" : "status"}
        >
          <span className="toast__icon" aria-hidden="true">{ICONS[toast.tone] ?? ICONS.info}</span>
          <p>{toast.message}</p>
          <button
            type="button"
            className="toast__close"
            aria-label="Dismiss notification"
            onClick={() => onDismiss(toast.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
