import {
  CLIENT_EVENTS,
  GAME_CATALOG,
  GAME_STATUS,
  SERVER_EVENTS
} from "@goofy-games/shared";

function sendAck(ack, payload) {
  if (typeof ack === "function") {
    ack(payload);
  }
}

export function registerSocketHandlers({ io, socket, roomManager, gameRegistry }) {
  socket.on(CLIENT_EVENTS.CREATE_PARTY, (_payload, ack) => {
    try {
      const room = roomManager.createRoom({ hostSocketId: socket.id });
      socket.join(room.code);
      sendAck(ack, { ok: true, room: roomManager.toPublicSnapshot(room) });
      io.to(room.code).emit(SERVER_EVENTS.PARTY_UPDATED, roomManager.toPublicSnapshot(room));
    } catch (error) {
      sendAck(ack, { ok: false, error: error.message });
    }
  });

  socket.on(CLIENT_EVENTS.JOIN_PARTY, (payload, ack) => {
    try {
      const { room, player } = roomManager.joinRoom({
        roomCode: payload?.roomCode,
        socketId: socket.id,
        playerToken: payload?.playerToken,
        displayName: payload?.displayName
      });
      socket.join(room.code);
      sendAck(ack, {
        ok: true,
        playerToken: player.token,
        room: roomManager.toPublicSnapshot(room),
        game: room.game?.getPlayerState(player.token) ?? null
      });
      io.to(room.code).emit(SERVER_EVENTS.PARTY_UPDATED, roomManager.toPublicSnapshot(room));
    } catch (error) {
      sendAck(ack, { ok: false, error: error.message });
    }
  });

  socket.on(CLIENT_EVENTS.SELECT_GAME, ({ gameId } = {}, ack) => {
    try {
      const catalogGame = GAME_CATALOG.find((game) => game.id === gameId);
      if (!catalogGame || catalogGame.status !== GAME_STATUS.AVAILABLE) {
        throw new Error("That game is not available yet.");
      }
      const room = roomManager.selectGame(socket.id, gameId);
      io.to(room.code).emit(SERVER_EVENTS.PARTY_UPDATED, roomManager.toPublicSnapshot(room));
      sendAck(ack, { ok: true });
    } catch (error) {
      sendAck(ack, { ok: false, error: error.message });
    }
  });

  socket.on(CLIENT_EVENTS.START_GAME, ({ gameId } = {}, ack) => {
    try {
      const room = roomManager.assertHost(socket.id);
      const selectedGameId = gameId ?? room.selectedGameId;
      const game = gameRegistry.create(selectedGameId, {
        room,
        onStateChanged: () => broadcastGameState(io, room)
      });
      roomManager.attachGame(socket.id, game);
      game.start();
      io.to(room.code).emit(SERVER_EVENTS.PARTY_UPDATED, roomManager.toPublicSnapshot(room));
      broadcastGameState(io, room);
      sendAck(ack, { ok: true });
    } catch (error) {
      sendAck(ack, { ok: false, error: error.message });
    }
  });

  socket.on(CLIENT_EVENTS.RETURN_TO_LIBRARY, (_payload, ack) => {
    try {
      const room = roomManager.returnToLibrary(socket.id);
      io.to(room.code).emit(SERVER_EVENTS.PARTY_UPDATED, roomManager.toPublicSnapshot(room));
      io.to(room.code).emit(SERVER_EVENTS.GAME_UPDATED, null);
      sendAck(ack, { ok: true });
    } catch (error) {
      sendAck(ack, { ok: false, error: error.message });
    }
  });

  socket.on(CLIENT_EVENTS.PLAYER_ACTION, ({ action } = {}, ack) => {
    try {
      const membership = roomManager.getMembership(socket.id);
      const room = roomManager.getRoomForSocket(socket.id);
      if (!membership || membership.role !== "player" || !room?.game) {
        throw new Error("You are not in an active game.");
      }
      room.game.handlePlayerAction({
        playerToken: membership.playerToken,
        action
      });
      sendAck(ack, { ok: true });
    } catch (error) {
      sendAck(ack, { ok: false, error: error.message });
    }
  });

  socket.on("disconnect", () => {
    const result = roomManager.disconnect(socket.id);
    if (!result) {
      return;
    }
    if (result.closed) {
      io.to(result.room.code).emit(SERVER_EVENTS.PARTY_CLOSED);
      return;
    }
    io.to(result.room.code).emit(
      SERVER_EVENTS.PARTY_UPDATED,
      roomManager.toPublicSnapshot(result.room)
    );
  });
}

function broadcastGameState(io, room) {
  io.to(room.hostSocketId).emit(SERVER_EVENTS.GAME_UPDATED, room.game?.getPublicState() ?? null);

  for (const player of room.players.values()) {
    if (player.socketId) {
      io.to(player.socketId).emit(
        SERVER_EVENTS.GAME_UPDATED,
        room.game?.getPlayerState(player.token) ?? null
      );
    }
  }
}
