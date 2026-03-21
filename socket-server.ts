import http from "http";

import { Server as IOServer } from "socket.io";

import { attachSocketHandlers } from "./lib/online/socketHandlers";
import { getSocketIoCorsOptions } from "./lib/online/socketCors";

const port = Number(process.env.SOCKET_PORT ?? 3001);
const hostname = process.env.HOSTNAME ?? "0.0.0.0";

const httpServer = http.createServer();

const io = new IOServer(httpServer, {
  transports: ["polling", "websocket"],
  path: "/api/socket",
  cors: getSocketIoCorsOptions(),
});

attachSocketHandlers(io);

httpServer.listen(port, hostname, () => {
  console.log(`Socket server listening at http://${hostname}:${port} (path /api/socket)`);
});
