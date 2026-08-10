import assert from "node:assert/strict";
import test from "node:test";
import { CLIENT_EVENTS, SERVER_EVENTS } from "@goofy-games/shared";
import { RoomManager } from "../src/rooms/RoomManager.js";
import { registerSocketHandlers } from "../src/socket/registerSocketHandlers.js";

class FakeSocket {
  constructor(id) {
    this.id = id;
    this.handlers = new Map();
    this.joinedRooms = [];
  }

  on(eventName, handler) {
    this.handlers.set(eventName, handler);
  }

  join(roomCode) {
    this.joinedRooms.push(roomCode);
  }

  emitFromClient(eventName, payload = {}) {
    return new Promise((resolve) => {
      const handler = this.handlers.get(eventName);
      assert.ok(handler, `No handler registered for ${eventName}`);
      handler(payload, resolve);
    });
  }

  disconnectFromClient() {
    const handler = this.handlers.get("disconnect");
    assert.ok(handler, "No disconnect handler registered");
    handler();
  }
}

class FakeIo {
  constructor() {
    this.emissions = [];
  }

  to(target) {
    return {
      emit: (eventName, payload) => this.emissions.push({ target, eventName, payload })
    };
  }
}

test("regression: a player can join a newly created room through socket handlers", async () => {
  const roomManager = new RoomManager();
  const io = new FakeIo();
  const gameRegistry = { create() { throw new Error("not used"); } };

  const hostSocket = new FakeSocket("host-socket");
  registerSocketHandlers({ io, socket: hostSocket, roomManager, gameRegistry });
  const created = await hostSocket.emitFromClient(CLIENT_EVENTS.CREATE_PARTY);
  assert.equal(created.ok, true);

  const playerSocket = new FakeSocket("player-socket");
  registerSocketHandlers({ io, socket: playerSocket, roomManager, gameRegistry });
  const joined = await playerSocket.emitFromClient(CLIENT_EVENTS.JOIN_PARTY, {
    roomCode: created.room.code,
    displayName: "Joe",
    playerToken: "lan-player-token"
  });

  assert.equal(joined.ok, true);
  assert.equal(joined.room.players.length, 1);
  assert.equal(joined.room.players[0].name, "Joe");
  assert.deepEqual(playerSocket.joinedRooms, [created.room.code]);
  assert.ok(
    io.emissions.some(
      (emission) =>
        emission.target === created.room.code &&
        emission.eventName === SERVER_EVENTS.PARTY_UPDATED &&
        emission.payload.players.length === 1
    )
  );
});

test("regression: refresh reuses the same player identity and restores active game state", async () => {
  const roomManager = new RoomManager();
  const io = new FakeIo();
  const gameRegistry = { create() { throw new Error("not used"); } };

  const hostSocket = new FakeSocket("host-socket");
  registerSocketHandlers({ io, socket: hostSocket, roomManager, gameRegistry });
  const created = await hostSocket.emitFromClient(CLIENT_EVENTS.CREATE_PARTY);
  const room = roomManager.getRoom(created.room.code);
  room.status = "game";
  room.game = {
    getPublicState() {
      return { phase: "voting", round: 2, inputType: "multiple-choice" };
    },
    getPlayerState(playerToken) {
      return {
        phase: "voting",
        round: 2,
        inputType: "multiple-choice",
        playerToken,
        hasSubmitted: true
      };
    }
  };

  const firstSocket = new FakeSocket("player-before-refresh");
  registerSocketHandlers({ io, socket: firstSocket, roomManager, gameRegistry });
  const firstJoin = await firstSocket.emitFromClient(CLIENT_EVENTS.JOIN_PARTY, {
    roomCode: created.room.code,
    displayName: "Joe",
    playerToken: "persisted-token"
  });
  const originalPlayerId = firstJoin.room.players[0].id;

  firstSocket.disconnectFromClient();

  const refreshedSocket = new FakeSocket("player-after-refresh");
  registerSocketHandlers({ io, socket: refreshedSocket, roomManager, gameRegistry });
  const rejoined = await refreshedSocket.emitFromClient(CLIENT_EVENTS.JOIN_PARTY, {
    roomCode: created.room.code,
    displayName: "Joe",
    playerToken: "persisted-token"
  });

  assert.equal(rejoined.ok, true);
  assert.equal(rejoined.room.players.length, 1);
  assert.equal(rejoined.room.players[0].id, originalPlayerId);
  assert.equal(rejoined.room.players[0].connected, true);
  assert.equal(rejoined.game.phase, "voting");
  assert.equal(rejoined.game.round, 2);
  assert.equal(rejoined.game.hasSubmitted, true);
});
