export const CLIENT_EVENTS = Object.freeze({
  CREATE_PARTY: "party:create",
  JOIN_PARTY: "party:join",
  LEAVE_PARTY: "party:leave",
  SELECT_GAME: "party:select-game",
  START_GAME: "party:start-game",
  RETURN_TO_LIBRARY: "party:return-to-library",
  PLAYER_ACTION: "game:player-action"
});

export const SERVER_EVENTS = Object.freeze({
  PARTY_UPDATED: "party:updated",
  PARTY_CLOSED: "party:closed",
  GAME_UPDATED: "game:updated",
  ERROR: "server:error"
});
