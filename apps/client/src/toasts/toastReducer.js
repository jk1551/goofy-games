export const initialToastState = Object.freeze([]);

export function toastReducer(state, action) {
  switch (action.type) {
    case "add": {
      const withoutDuplicate = state.filter(
        (toast) => toast.message !== action.toast.message || toast.tone !== action.toast.tone
      );
      return [...withoutDuplicate, action.toast].slice(-4);
    }
    case "remove":
      return state.filter((toast) => toast.id !== action.id);
    case "clear":
      return [];
    default:
      return state;
  }
}
