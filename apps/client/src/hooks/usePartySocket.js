import { useCallback, useEffect, useState } from "react";
import { CLIENT_EVENTS, SERVER_EVENTS } from "@goofy-games/shared";
import { socket } from "../lib/socket.js";

const PLAYER_TOKEN_KEY = "goofy-games-player-token";

function emitWithAck(eventName, payload = {}) {
  return new Promise((resolve) => {
    socket.emit(eventName, payload, resolve);
  });
}

export function usePartySocket() {
  const [connectionState, setConnectionState] = useState(socket.connected ? "connected" : "connecting");
  const [role, setRole] = useState(null);
  const [party, setParty] = useState(null);
  const [game, setGame] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const handleConnect = () => setConnectionState("connected");
    const handleDisconnect = () => setConnectionState("disconnected");
    const handlePartyUpdated = (nextParty) => setParty(nextParty);
    const handleGameUpdated = (nextGame) => setGame(nextGame);
    const handlePartyClosed = () => {
      setParty(null);
      setGame(null);
      setRole(null);
      setError("The host ended this party.");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on(SERVER_EVENTS.PARTY_UPDATED, handlePartyUpdated);
    socket.on(SERVER_EVENTS.GAME_UPDATED, handleGameUpdated);
    socket.on(SERVER_EVENTS.PARTY_CLOSED, handlePartyClosed);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off(SERVER_EVENTS.PARTY_UPDATED, handlePartyUpdated);
      socket.off(SERVER_EVENTS.GAME_UPDATED, handleGameUpdated);
      socket.off(SERVER_EVENTS.PARTY_CLOSED, handlePartyClosed);
    };
  }, []);

  const runAction = useCallback(async (eventName, payload) => {
    setError("");
    const result = await emitWithAck(eventName, payload);
    if (!result?.ok) {
      setError(result?.error ?? "Something went wrong.");
      return null;
    }
    return result;
  }, []);

  const createParty = useCallback(async () => {
    const result = await runAction(CLIENT_EVENTS.CREATE_PARTY);
    if (result) {
      setRole("host");
      setParty(result.room);
    }
  }, [runAction]);

  const joinParty = useCallback(async ({ roomCode, displayName }) => {
    const playerToken = localStorage.getItem(PLAYER_TOKEN_KEY) ?? crypto.randomUUID();
    const result = await runAction(CLIENT_EVENTS.JOIN_PARTY, {
      roomCode,
      displayName,
      playerToken
    });
    if (result) {
      localStorage.setItem(PLAYER_TOKEN_KEY, result.playerToken);
      setRole("player");
      setParty(result.room);
      setGame(result.game);
    }
  }, [runAction]);

  const selectGame = useCallback((gameId) => runAction(CLIENT_EVENTS.SELECT_GAME, { gameId }), [runAction]);
  const startGame = useCallback((gameId) => runAction(CLIENT_EVENTS.START_GAME, { gameId }), [runAction]);
  const returnToLibrary = useCallback(() => runAction(CLIENT_EVENTS.RETURN_TO_LIBRARY), [runAction]);
  const submitAction = useCallback((action) => runAction(CLIENT_EVENTS.PLAYER_ACTION, { action }), [runAction]);

  const reset = useCallback(() => {
    setRole(null);
    setParty(null);
    setGame(null);
    setError("");
  }, []);

  return {
    connectionState,
    role,
    party,
    game,
    error,
    createParty,
    joinParty,
    selectGame,
    startGame,
    returnToLibrary,
    submitAction,
    reset
  };
}
