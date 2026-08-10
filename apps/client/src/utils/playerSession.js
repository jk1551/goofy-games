const PLAYER_SESSION_KEY = "goofy-games-player-session";
const PLAYER_SESSION_VERSION = 1;

export function savePlayerSession(session, { storage = globalThis.localStorage } = {}) {
  const normalized = normalizePlayerSession(session);
  if (!normalized) {
    return null;
  }

  try {
    storage?.setItem(PLAYER_SESSION_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return null;
  }
}

export function readPlayerSession({ storage = globalThis.localStorage } = {}) {
  try {
    const raw = storage?.getItem(PLAYER_SESSION_KEY);
    if (!raw) {
      return null;
    }

    return normalizePlayerSession(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function clearPlayerSession({ storage = globalThis.localStorage } = {}) {
  try {
    storage?.removeItem(PLAYER_SESSION_KEY);
  } catch {
    // Storage can be unavailable in privacy modes; clearing should still be safe.
  }
}

export function normalizePlayerSession(session) {
  if (!session || typeof session !== "object") {
    return null;
  }

  const roomCode = String(session.roomCode ?? "").trim().toUpperCase();
  const displayName = String(session.displayName ?? "").replace(/\s+/g, " ").trim().slice(0, 24);
  const playerToken = String(session.playerToken ?? "").trim();

  if (!roomCode || !displayName || !playerToken) {
    return null;
  }

  return {
    version: PLAYER_SESSION_VERSION,
    roomCode,
    displayName,
    playerToken
  };
}
