import http from "node:http";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import { config, createCorsOriginValidator } from "./config.js";
import { createGameRegistry } from "./games/createGameRegistry.js";
import { RoomManager } from "./rooms/RoomManager.js";
import { registerSocketHandlers } from "./socket/registerSocketHandlers.js";

const app = express();
const server = http.createServer(app);
const corsOrigin = createCorsOriginValidator(config.clientOrigins);
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ["GET", "POST"]
  }
});

const roomManager = new RoomManager();
const gameRegistry = createGameRegistry();

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    service: "goofy-games-server",
    games: gameRegistry.list()
  });
});

io.on("connection", (socket) => {
  registerSocketHandlers({ io, socket, roomManager, gameRegistry });
});

server.listen(config.port, "0.0.0.0", () => {
  console.log(`Goofy Games server listening on http://0.0.0.0:${config.port}`);
});
