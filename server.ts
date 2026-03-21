import http from "http";
import next from "next";
import { Server as IOServer } from "socket.io";
import { attachSocketHandlers } from "./lib/online/socketHandlers";

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
      path: "/api/socket",
      transports: ["polling", "websocket"],
      cors: {
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          callback(null, true);
        },
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    attachSocketHandlers(io);

    httpServer.listen(port, hostname, () => {
      console.log(`Server running at http://${hostname}:${port}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });