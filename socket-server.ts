import { Server as IOServer } from "socket.io";

import { attachSocketHandlers } from "@/lib/online/socketHandlers";

const port = Number(process.env.SOCKET_PORT ?? 3001);

const io = new IOServer(port, {
  transports: ["websocket"],
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

attachSocketHandlers(io);

console.log(`Socket server listening on http://localhost:${port}`);
