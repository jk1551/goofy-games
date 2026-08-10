import { useCallback, useEffect, useReducer, useRef } from "react";
import { initialToastState, toastReducer } from "../toasts/toastReducer.js";

let nextToastId = 1;

export function useToastQueue() {
  const [toasts, dispatch] = useReducer(toastReducer, initialToastState);
  const timersRef = useRef(new Map());

  const dismissToast = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    dispatch({ type: "remove", id });
  }, []);

  const showToast = useCallback((message, { tone = "error", duration = 5000 } = {}) => {
    if (!message) {
      return null;
    }

    const id = `toast-${Date.now()}-${nextToastId++}`;
    dispatch({
      type: "add",
      toast: { id, message, tone }
    });

    if (duration > 0) {
      const timer = window.setTimeout(() => {
        timersRef.current.delete(id);
        dispatch({ type: "remove", id });
      }, duration);
      timersRef.current.set(id, timer);
    }

    return id;
  }, []);

  useEffect(() => () => {
    for (const timer of timersRef.current.values()) {
      window.clearTimeout(timer);
    }
    timersRef.current.clear();
  }, []);

  return { toasts, showToast, dismissToast };
}
