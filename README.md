# Goofy Games

A browser-based party game platform where one screen hosts the party and players use their phones as controllers.

## Stack

- React + Vite for the host and player experiences
- Node.js + Express for the HTTP server
- Socket.IO for real-time rooms and game events
- npm workspaces for the client, server, and shared contracts
- Node's built-in test runner for server tests

## Project structure

```text
apps/
  client/      React host and player UI
  server/      Rooms, sockets, timers, and game engine
packages/
  shared/      Events, game catalog, and shared constants
```

Game rules stay on the server. React renders server-provided state and sends player actions. New games are registered as server-side modules and can reuse shared input components such as text, multiple choice, player voting, and drawing.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The server listens on `http://localhost:3001`.

To test from phones on the same network, start Vite with its network host enabled (already configured), then open your computer's LAN IP on port `5173`.

## Commands

```bash
npm run dev     # start client and server
npm run test    # run server tests
npm run build   # build the React client
npm run check   # test and build
```

## Adding a game

1. Create a server module under `apps/server/src/games/<game-id>`.
2. Extend `BaseGame` and implement the phase transitions and player actions.
3. Register it in `apps/server/src/games/createGameRegistry.js`.
4. Add its public metadata to `packages/shared/src/gameCatalog.js`.
5. Reuse or add a React input renderer for any new interaction type.

Bluff Party is included as the first game module and reference implementation.
