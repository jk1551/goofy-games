import { randomUUID } from "node:crypto";
import { createRoomCode } from "./createRoomCode.js";
import { sanitizeName } from "../utils/sanitizeName.js";

const ROOM_CODE_ATTEMPTS = 50;

export class RoomManager {
  #rooms = new Map();
  #socketMembership = new Map();

  createRoom({ hostSocketId }) {
    const code = this.#generateUniqueCode();
    const room = {
      id: randomUUID(),
      code,
      hostSocketId,
      status: "library",
      selectedGameId: "bluff-party",
      players: new Map(),
      game: null,
      createdAt: new Date().toISOString()
    };

    this.#rooms.set(code, room);
    this.#socketMembership.set(hostSocketId, { roomCode: code, role: "host" });
    return room;
  }

  joinRoom({ roomCode, socketId, playerToken, displayName }) {
    const code = String(roomCode ?? "").trim().toUpperCase();
    const room = this.#rooms.get(code);

    if (!room) {
      throw new Error("That party code does not exist.");
    }

    const name = sanitizeName(displayName);
    if (!name) {
      throw new Error("Enter a display name.");
    }

    const token = String(playerToken || randomUUID());
    let player = room.players.get(token);

    if (player) {
      player.socketId = socketId;
      player.connected = true;
      player.name = name;
    } else {
      player = {
        id: randomUUID(),
        token,
        socketId,
        name,
        connected: true,
        score: 0,
        joinedAt: new Date().toISOString()
      };
      room.players.set(token, player);
    }

    this.#socketMembership.set(socketId, {
      roomCode: code,
      role: "player",
      playerToken: token
    });

    return { room, player };
  }

  getRoom(roomCode) {
    return this.#rooms.get(String(roomCode ?? "").toUpperCase()) ?? null;
  }

  getMembership(socketId) {
    return this.#socketMembership.get(socketId) ?? null;
  }

  getRoomForSocket(socketId) {
    const membership = this.getMembership(socketId);
    return membership ? this.getRoom(membership.roomCode) : null;
  }

  assertHost(socketId) {
    const membership = this.getMembership(socketId);
    if (!membership || membership.role !== "host") {
      throw new Error("Only the party host can do that.");
    }

    const room = this.getRoom(membership.roomCode);
    if (!room || room.hostSocketId !== socketId) {
      throw new Error("The host session is no longer active.");
    }

    return room;
  }

  selectGame(socketId, gameId) {
    const room = this.assertHost(socketId);
    room.selectedGameId = gameId;
    return room;
  }

  attachGame(socketId, game) {
    const room = this.assertHost(socketId);
    room.game = game;
    room.status = "game";
    return room;
  }

  returnToLibrary(socketId) {
    const room = this.assertHost(socketId);
    room.game?.stop?.();
    room.game = null;
    room.status = "library";
    return room;
  }

  disconnect(socketId) {
    const membership = this.#socketMembership.get(socketId);
    if (!membership) {
      return null;
    }

    this.#socketMembership.delete(socketId);
    const room = this.getRoom(membership.roomCode);
    if (!room) {
      return null;
    }

    if (membership.role === "host") {
      this.#rooms.delete(room.code);
      room.game?.stop?.();
      for (const player of room.players.values()) {
        this.#socketMembership.delete(player.socketId);
      }
      return { room, closed: true };
    }

    const player = room.players.get(membership.playerToken);
    if (player) {
      player.connected = false;
      player.socketId = null;
    }

    return { room, closed: false };
  }

  toPublicSnapshot(room) {
    return {
      code: room.code,
      status: room.status,
      selectedGameId: room.selectedGameId,
      players: [...room.players.values()].map((player) => ({
        id: player.id,
        name: player.name,
        connected: player.connected,
        score: player.score
      })),
      game: room.game?.getPublicState?.() ?? null
    };
  }

  #generateUniqueCode() {
    for (let attempt = 0; attempt < ROOM_CODE_ATTEMPTS; attempt += 1) {
      const code = createRoomCode();
      if (!this.#rooms.has(code)) {
        return code;
      }
    }

    throw new Error("Could not create a unique party code. Try again.");
  }
}
