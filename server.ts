import http from "http";
import next from "next";
import { Server as IOServer } from "socket.io";

import { attachSocketHandlers } from "./app/api/socket/route";

const port = Number(process.env.PORT ?? 3000);
const hostname = process.env.HOSTNAME ?? "0.0.0.0";
const dev = process.env.NODE_ENV !== "production";

const nextApp = next({ dev, hostname });
const handler = nextApp.getRequestHandler();

nextApp
  .prepare()
  .then(() => {
    const httpServer = http.createServer((req, res) => {
      handler(req, res);
    });

    const io = new IOServer(httpServer, {
      transports: ["websocket"],
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    attachSocketHandlers(io);

    httpServer.listen(port, hostname, () => {
      console.log(`TicTacToe server listening on http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
