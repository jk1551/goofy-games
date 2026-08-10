import { useCallback, useEffect, useState } from "react";
import { CLIENT_EVENTS, SERVER_EVENTS } from "@goofy-games/shared";
import { socket } from "../lib/socket.js";
import { getOrCreatePlayerToken } from "../utils/playerToken.js";
import { useToastQueue } from "./useToastQueue.js";

const ACTION_TIMEOUT_MS = 6000;

function emitWithAck(eventName, payload = {}) {
  return new Promise((resolve) => {
    if (!socket.connected) {
      resolve({
        ok: false,
        error: "Not connected to the game server yet. Check that the server is running and try again."
      });
      return;
    }

    socket.timeout(ACTION_TIMEOUT_MS).emit(eventName, payload, (timeoutError, result) => {
      if (timeoutError) {
        resolve({
          ok: false,
          error: "The game server did not respond. Check your network connection and try again."
        });
        return;
      }
      resolve(result);
    });
  });
}

export function usePartySocket() {
  const [connectionState, setConnectionState] = useState(socket.connected ? "connected" : "connecting");
  const [role, setRole] = useState(null);
  const [party, setParty] = useState(null);
  const [game, setGame] = useState(null);
  const { toasts, showToast, dismissToast } = useToastQueue();

  useEffect(() => {
    const handleConnect = () => setConnectionState("connected");
    const handleConnectError = () => {
      setConnectionState("disconnected");
      showToast("Could not connect to the game server. Make sure this device can reach port 3001 on the host computer.");
    };
    const handleDisconnect = (reason) => {
      setConnectionState("disconnected");
      if (reason !== "io client disconnect") {
        showToast("Connection lost. Goofy Games is trying to reconnect.");
      }
    };
    const handlePartyUpdated = (nextParty) => setParty(nextParty);
    const handleGameUpdated = (nextGame) => setGame(nextGame);
    const handlePartyClosed = () => {
      setParty(null);
      setGame(null);
      setRole(null);
      showToast("The host ended this party.");
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);
    socket.on(SERVER_EVENTS.PARTY_UPDATED, handlePartyUpdated);
    socket.on(SERVER_EVENTS.GAME_UPDATED, handleGameUpdated);
    socket.on(SERVER_EVENTS.PARTY_CLOSED, handlePartyClosed);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
      socket.off(SERVER_EVENTS.PARTY_UPDATED, handlePartyUpdated);
      socket.off(SERVER_EVENTS.GAME_UPDATED, handleGameUpdated);
      socket.off(SERVER_EVENTS.PARTY_CLOSED, handlePartyClosed);
    };
  }, [showToast]);

  const runAction = useCallback(async (eventName, payload) => {
    try {
      const result = await emitWithAck(eventName, payload);
      if (!result?.ok) {
        showToast(result?.error ?? "Something went wrong.");
        return null;
      }
      return result;
    } catch {
      showToast("An unexpected error occurred while talking to the game server.");
      return null;
    }
  }, [showToast]);

  const createParty = useCallback(async () => {
    const result = await runAction(CLIENT_EVENTS.CREATE_PARTY);
    if (result) {
      setRole("host");
      setParty(result.room);
    }
  }, [runAction]);

  const joinParty = useCallback(async ({ roomCode, displayName }) => {
    const playerToken = getOrCreatePlayerToken();
    const result = await runAction(CLIENT_EVENTS.JOIN_PARTY, {
      roomCode,
      displayName,
      playerToken
    });
    if (result) {
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
  }, []);

  return {
    connectionState,
    role,
    party,
    game,
    toasts,
    createParty,
    joinParty,
    selectGame,
    startGame,
    returnToLibrary,
    submitAction,
    dismissToast,
    reset
  };
}
