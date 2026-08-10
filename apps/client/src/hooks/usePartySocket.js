import { useSnackbar } from "notistack";
import { useCallback, useEffect, useRef, useState } from "react";
import { CLIENT_EVENTS, SERVER_EVENTS } from "@goofy-games/shared";
import { socket } from "../lib/socket.js";
import { getOrCreatePlayerToken } from "../utils/playerToken.js";
import {
  clearPlayerSession,
  readPlayerSession,
  savePlayerSession
} from "../utils/playerSession.js";

const ACTION_TIMEOUT_MS = 6000;

function emitWithAck(eventName, payload = {}) {
  return new Promise((resolve) => {
    if (!socket.connected) {
      resolve({
        ok: false,
        source: "network",
        error: "Not connected to the game server yet. Check that the server is running and try again."
      });
      return;
    }

    socket.timeout(ACTION_TIMEOUT_MS).emit(eventName, payload, (timeoutError, result) => {
      if (timeoutError) {
        resolve({
          ok: false,
          source: "network",
          error: "The game server did not respond. Check your network connection and try again."
        });
        return;
      }

      if (!result) {
        resolve({
          ok: false,
          source: "server",
          error: "The game server returned an invalid response."
        });
        return;
      }

      resolve({ ...result, source: "server" });
    });
  });
}

export function usePartySocket() {
  const { enqueueSnackbar } = useSnackbar();
  const [connectionState, setConnectionState] = useState(socket.connected ? "connected" : "connecting");
  const [role, setRole] = useState(null);
  const [party, setParty] = useState(null);
  const [game, setGame] = useState(null);
  const roleRef = useRef(null);
  const restoreInFlightRef = useRef(false);
  const restoredSocketIdRef = useRef(null);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  const applyPlayerJoin = useCallback((result, session) => {
    const savedSession = savePlayerSession({
      roomCode: result.room.code,
      displayName: session.displayName,
      playerToken: result.playerToken ?? session.playerToken
    });

    roleRef.current = "player";
    restoredSocketIdRef.current = socket.id;
    setRole("player");
    setParty(result.room);
    setGame(result.game);
    return savedSession;
  }, []);

  const restoreStoredPlayerSession = useCallback(async ({ announce = false } = {}) => {
    if (
      !socket.connected ||
      roleRef.current === "host" ||
      restoreInFlightRef.current ||
      restoredSocketIdRef.current === socket.id
    ) {
      return false;
    }

    const session = readPlayerSession();
    if (!session) {
      return false;
    }

    restoreInFlightRef.current = true;
    try {
      const result = await emitWithAck(CLIENT_EVENTS.JOIN_PARTY, session);
      if (result?.ok) {
        applyPlayerJoin(result, session);
        if (announce) {
          enqueueSnackbar(`Rejoined party ${result.room.code}.`, { variant: "success" });
        }
        return true;
      }

      if (result?.source === "server") {
        clearPlayerSession();
        restoredSocketIdRef.current = null;
        roleRef.current = null;
        setRole(null);
        setParty(null);
        setGame(null);
        enqueueSnackbar(result?.error ?? "Your previous party is no longer available.", { variant: "warning" });
      }

      return false;
    } finally {
      restoreInFlightRef.current = false;
    }
  }, [applyPlayerJoin, enqueueSnackbar]);

  useEffect(() => {
    const handleConnect = () => {
      const isReconnect = roleRef.current === "player";
      setConnectionState("connected");
      void restoreStoredPlayerSession({ announce: isReconnect });
    };
    const handleConnectError = () => {
      setConnectionState("disconnected");
      enqueueSnackbar(
        "Could not connect to the game server. Make sure this device can reach port 3001 on the host computer.",
        { variant: "error" }
      );
    };
    const handleDisconnect = (reason) => {
      restoredSocketIdRef.current = null;
      setConnectionState("disconnected");
      if (reason !== "io client disconnect") {
        enqueueSnackbar("Connection lost. Goofy Games is trying to reconnect.", { variant: "warning" });
      }
    };
    const handlePartyUpdated = (nextParty) => setParty(nextParty);
    const handleGameUpdated = (nextGame) => setGame(nextGame);
    const handlePartyClosed = () => {
      clearPlayerSession();
      restoredSocketIdRef.current = null;
      roleRef.current = null;
      setParty(null);
      setGame(null);
      setRole(null);
      enqueueSnackbar("The host ended this party.", { variant: "info" });
    };

    socket.on("connect", handleConnect);
    socket.on("connect_error", handleConnectError);
    socket.on("disconnect", handleDisconnect);
    socket.on(SERVER_EVENTS.PARTY_UPDATED, handlePartyUpdated);
    socket.on(SERVER_EVENTS.GAME_UPDATED, handleGameUpdated);
    socket.on(SERVER_EVENTS.PARTY_CLOSED, handlePartyClosed);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("connect_error", handleConnectError);
      socket.off("disconnect", handleDisconnect);
      socket.off(SERVER_EVENTS.PARTY_UPDATED, handlePartyUpdated);
      socket.off(SERVER_EVENTS.GAME_UPDATED, handleGameUpdated);
      socket.off(SERVER_EVENTS.PARTY_CLOSED, handlePartyClosed);
    };
  }, [enqueueSnackbar, restoreStoredPlayerSession]);

  const runAction = useCallback(async (eventName, payload) => {
    try {
      const result = await emitWithAck(eventName, payload);
      if (!result?.ok) {
        enqueueSnackbar(result?.error ?? "Something went wrong.", { variant: "error" });
        return null;
      }
      return result;
    } catch {
      enqueueSnackbar("An unexpected error occurred while talking to the game server.", { variant: "error" });
      return null;
    }
  }, [enqueueSnackbar]);

  const createParty = useCallback(async () => {
    const result = await runAction(CLIENT_EVENTS.CREATE_PARTY);
    if (result) {
      clearPlayerSession();
      restoredSocketIdRef.current = null;
      roleRef.current = "host";
      setRole("host");
      setParty(result.room);
      setGame(null);
    }
  }, [runAction]);

  const joinParty = useCallback(async ({ roomCode, displayName }) => {
    const session = {
      roomCode: String(roomCode ?? "").trim().toUpperCase(),
      displayName: String(displayName ?? "").trim(),
      playerToken: getOrCreatePlayerToken()
    };

    const result = await runAction(CLIENT_EVENTS.JOIN_PARTY, session);
    if (result) {
      applyPlayerJoin(result, session);
    }
  }, [applyPlayerJoin, runAction]);

  const selectGame = useCallback((gameId) => runAction(CLIENT_EVENTS.SELECT_GAME, { gameId }), [runAction]);
  const startGame = useCallback((gameId, settings = {}) => runAction(CLIENT_EVENTS.START_GAME, { gameId, settings }), [runAction]);
  const returnToLibrary = useCallback(() => runAction(CLIENT_EVENTS.RETURN_TO_LIBRARY), [runAction]);
  const submitAction = useCallback((action) => runAction(CLIENT_EVENTS.PLAYER_ACTION, { action }), [runAction]);

  const reset = useCallback(() => {
    clearPlayerSession();
    restoredSocketIdRef.current = null;
    roleRef.current = null;
    setRole(null);
    setParty(null);
    setGame(null);
  }, []);

  return {
    connectionState,
    role,
    party,
    game,
    createParty,
    joinParty,
    selectGame,
    startGame,
    returnToLibrary,
    submitAction,
    reset
  };
}
